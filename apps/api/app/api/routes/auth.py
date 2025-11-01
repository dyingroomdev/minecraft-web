"""Authentication routes including Discord OAuth and token lifecycle."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_http_client, get_settings_dependency
from app.core.config import Settings
from app.core.security import sign_state, verify_state
from app.services.auth import AuthService
from app.services.discord import (
    DiscordOAuthService,
    map_discord_roles_to_rbac,
)
from app.schemas.auth import LogoutResponse, TokenResponse

router = APIRouter()


def _set_refresh_cookie(response: Response, *, token: str, settings: Settings, expires_at: datetime) -> None:
    """Attach the refresh token as an HTTP-only cookie."""

    max_age = int((expires_at - datetime.now(timezone.utc)).total_seconds())
    response.set_cookie(
        key=settings.jwt_refresh_cookie_name,
        value=token,
        httponly=True,
        secure=settings.jwt_refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        domain=settings.jwt_refresh_cookie_domain,
        path=settings.jwt_refresh_cookie_path,
        max_age=max(max_age, 0),
        expires=expires_at,
    )


def _clear_refresh_cookie(response: Response, *, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.jwt_refresh_cookie_name,
        domain=settings.jwt_refresh_cookie_domain,
        path=settings.jwt_refresh_cookie_path,
    )


@router.get("/discord/login")
async def discord_login(
    settings: Settings = Depends(get_settings_dependency),
) -> RedirectResponse:
    """Redirect the user to Discord's OAuth consent page."""

    state = secrets.token_urlsafe(32)
    state_signature = sign_state(state, settings.jwt_secret)

    params = {
        "response_type": "code",
        "client_id": settings.discord.client_id,
        "scope": " ".join(settings.oauth_scopes),
        "redirect_uri": settings.discord.redirect_uri,
        "state": state,
        "prompt": "consent",
    }
    query = httpx.QueryParams(params).render()
    redirect_url = f"{settings.discord.authorize_url}?{query}"

    response = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key=settings.discord_state_cookie_name,
        value=state_signature,
        max_age=settings.discord_state_ttl_seconds,
        httponly=True,
        secure=settings.jwt_refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        domain=settings.jwt_refresh_cookie_domain,
        path=settings.jwt_refresh_cookie_path,
    )
    return response


@router.get("/discord/callback", response_model=TokenResponse)
async def discord_callback(
    request: Request,
    code: str,
    state: str,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
    http_client: httpx.AsyncClient = Depends(get_http_client),
) -> JSONResponse:
    """Handle the OAuth redirect from Discord, issuing platform tokens."""

    stored_signature = request.cookies.get(settings.discord_state_cookie_name)
    if not stored_signature or not verify_state(state, stored_signature, settings.jwt_secret):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state parameter")

    oauth_service = DiscordOAuthService(settings.discord, http_client)

    try:
        token_response = await oauth_service.exchange_code(code=code)
        discord_user = await oauth_service.fetch_user(access_token=token_response.access_token)
        guild_member = await oauth_service.fetch_guild_member(
            access_token=token_response.access_token,
            guild_id=settings.discord.guild_id,
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discord API error") from exc
    except httpx.RequestError as exc:  # pragma: no cover - network errors
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Discord request failed") from exc

    rbac_roles = map_discord_roles_to_rbac(
        discord_role_ids=guild_member.roles,
        mapping=settings.discord_role_mapping,
    )

    auth_service = AuthService(session=session, settings=settings)
    user = await auth_service.upsert_user(
        discord_user=discord_user,
        roles=rbac_roles,
    )
    await auth_service.log_audit(
        user=user,
        action="auth.discord.login",
        metadata={
            "discord_id": discord_user.id,
            "guild_roles": guild_member.roles,
            "rbac_roles": rbac_roles,
        },
    )

    token_bundle = await auth_service.issue_tokens(user=user)

    await session.commit()

    response = JSONResponse(
        content=TokenResponse(
            access_token=token_bundle.access_token,
            token_type=token_bundle.token_type,
            expires_at=token_bundle.access_expires_at,
            refresh_expires_at=token_bundle.refresh_expires_at,
            roles=token_bundle.roles,
        ).model_dump(),
        status_code=status.HTTP_200_OK,
    )
    _set_refresh_cookie(
        response,
        token=token_bundle.refresh_token,
        settings=settings,
        expires_at=token_bundle.refresh_expires_at,
    )
    response.delete_cookie(
        key=settings.discord_state_cookie_name,
        domain=settings.jwt_refresh_cookie_domain,
        path=settings.jwt_refresh_cookie_path,
    )
    return response


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> JSONResponse:
    """Rotate refresh tokens and issue a new access token."""

    refresh_token = request.cookies.get(settings.jwt_refresh_cookie_name)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    auth_service = AuthService(session=session, settings=settings)
    user, token_record, _ = await auth_service.authenticate_refresh_token(raw_token=refresh_token)
    token_bundle = await auth_service.rotate_refresh_token(token_record=token_record, user=user)

    await auth_service.log_audit(
        user=user,
        action="auth.refresh",
        metadata={"token_id": token_record.jwt_id},
    )

    await session.commit()

    response = JSONResponse(
        content=TokenResponse(
            access_token=token_bundle.access_token,
            token_type=token_bundle.token_type,
            expires_at=token_bundle.access_expires_at,
            refresh_expires_at=token_bundle.refresh_expires_at,
            roles=token_bundle.roles,
        ).model_dump(),
    )
    _set_refresh_cookie(
        response,
        token=token_bundle.refresh_token,
        settings=settings,
        expires_at=token_bundle.refresh_expires_at,
    )
    return response


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> JSONResponse:
    """Revoke the active refresh token and clear cookies."""

    refresh_token = request.cookies.get(settings.jwt_refresh_cookie_name)
    auth_service = AuthService(session=session, settings=settings)

    if refresh_token:
        try:
            user, token_record, _ = await auth_service.authenticate_refresh_token(raw_token=refresh_token)
        except HTTPException:
            user = None
            token_record = None
        else:
            await auth_service.revoke_refresh_token(token_record, cascade=True)
            await auth_service.log_audit(
                user=user,
                action="auth.logout",
                metadata={"token_id": token_record.jwt_id},
            )
            await session.commit()

    response = JSONResponse(content=LogoutResponse(detail="Logged out").model_dump())
    _clear_refresh_cookie(response, settings=settings)
    response.delete_cookie(
        key=settings.discord_state_cookie_name,
        domain=settings.jwt_refresh_cookie_domain,
        path=settings.jwt_refresh_cookie_path,
    )
    return response
