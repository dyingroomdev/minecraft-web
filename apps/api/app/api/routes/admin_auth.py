"""Admin authentication routes."""

from __future__ import annotations

import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db_session,
    get_http_client,
    get_settings_dependency,
    require_admin,
)
from app.core.config import Settings
from app.core.enums import AdminRole
from app.core.security import sign_state, verify_state
from app.schemas.admin import AdminLoginRequest, AdminUserRead
from app.services.admin_auth import AdminAuthService
from app.services.discord import DiscordOAuthService

router = APIRouter()


@router.post("/login")
async def admin_login(
    payload: AdminLoginRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> dict[str, str]:
    """Admin login endpoint."""
    auth_service = AdminAuthService(session, settings)
    admin_user = await auth_service.authenticate_admin(payload.email, payload.password)
    token = auth_service.create_admin_token(admin_user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": admin_user.role,
    }


@router.get("/discord/login")
async def admin_discord_login(
    settings: Settings = Depends(get_settings_dependency),
) -> RedirectResponse:
    state = secrets.token_urlsafe(32)
    discord = settings.discord_for_redirect(settings.admin_discord_redirect_uri)
    query = httpx.QueryParams(
        {
            "response_type": "code",
            "client_id": discord.client_id,
            "scope": "identify email",
            "redirect_uri": discord.redirect_uri,
            "state": state,
            "prompt": "consent",
        }
    )
    response = RedirectResponse(
        url=f"{discord.authorize_url}?{query}",
        status_code=status.HTTP_302_FOUND,
    )
    response.set_cookie(
        key=settings.admin_discord_state_cookie_name,
        value=sign_state(state, settings.jwt_secret),
        max_age=settings.discord_state_ttl_seconds,
        httponly=True,
        secure=settings.jwt_refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        domain=settings.jwt_refresh_cookie_domain,
        path=settings.jwt_refresh_cookie_path,
    )
    return response


@router.get("/discord/callback")
async def admin_discord_callback(
    request: Request,
    code: str,
    state: str,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
    http_client: httpx.AsyncClient = Depends(get_http_client),
) -> JSONResponse:
    signature = request.cookies.get(settings.admin_discord_state_cookie_name)
    if not signature or not verify_state(state, signature, settings.jwt_secret):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state parameter")

    discord = DiscordOAuthService(
        settings.discord_for_redirect(settings.admin_discord_redirect_uri),
        http_client,
    )
    try:
        oauth_token = await discord.exchange_code(code=code)
        discord_user = await discord.fetch_user(access_token=oauth_token.access_token)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discord API error") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Discord request failed") from exc

    auth_service = AdminAuthService(session, settings)
    admin_user = await auth_service.authenticate_discord(
        discord_id=discord_user.id,
        email=discord_user.email,
        email_verified=discord_user.verified,
    )
    token = auth_service.create_admin_token(admin_user)
    await session.commit()

    response = JSONResponse(
        {"access_token": token, "token_type": "bearer", "role": admin_user.role}
    )
    response.delete_cookie(
        key=settings.admin_discord_state_cookie_name,
        domain=settings.jwt_refresh_cookie_domain,
        path=settings.jwt_refresh_cookie_path,
    )
    return response


@router.get("/me", response_model=AdminUserRead)
async def get_admin_profile(
    admin_user = Depends(require_admin()),
) -> AdminUserRead:
    """Get current admin user profile."""
    return AdminUserRead(
        id=str(admin_user.id),
        email=admin_user.email,
        role=AdminRole(admin_user.role),
        is_active=admin_user.is_active,
    )
