"""Authentication orchestration for Discord OAuth workflows."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import (
    InvalidTokenError,
    JWTTokenPayload,
    TokenType,
    create_jwt_token,
    decode_jwt_token,
    hash_token_value,
    token_has_expired,
)
from app.db.models import AuditLog, RefreshToken, User
from app.services.discord import DiscordUser


@dataclass
class TokenBundle:
    """Container for issued tokens and expiration data."""

    access_token: str
    refresh_token: str
    token_type: str
    access_expires_at: datetime
    refresh_expires_at: datetime
    roles: list[str]


class AuthService:
    """Service encapsulating auth-related persistence and token operations."""

    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self.session = session
        self.settings = settings

    async def upsert_user(
        self,
        *,
        discord_user: DiscordUser,
        roles: list[str],
    ) -> User:
        result = await self.session.execute(
            select(User).where(User.discord_id == str(discord_user.id))
        )
        user = result.scalar_one_or_none()

        payload = {
            "username": discord_user.display_username,
            "email": discord_user.email,
            "avatar": discord_user.avatar,
            "roles": roles,
        }

        if user is None:
            user = User(
                discord_id=str(discord_user.id),
                **payload,
            )
            self.session.add(user)
        else:
            for key, value in payload.items():
                setattr(user, key, value)

        return user

    async def log_audit(
        self,
        *,
        user: User | None,
        action: str,
        metadata: dict[str, Any] | None = None,
        notes: str | None = None,
    ) -> AuditLog:
        audit = AuditLog(
            user=user,
            action=action,
            metadata=metadata or {},
            notes=notes,
        )
        self.session.add(audit)
        return audit

    def _access_exp_delta(self) -> timedelta:
        return timedelta(minutes=self.settings.jwt_access_expires_minutes)

    def _refresh_exp_delta(self) -> timedelta:
        return timedelta(minutes=self.settings.jwt_refresh_expires_minutes)

    async def issue_tokens(self, *, user: User) -> TokenBundle:
        access_token, access_payload = create_jwt_token(
            subject=str(user.id),
            secret=self.settings.jwt_secret,
            algorithm=self.settings.jwt_algorithm,
            expires_delta=self._access_exp_delta(),
            token_type=TokenType.ACCESS,
            roles=user.roles,
        )
        refresh_token, refresh_payload = create_jwt_token(
            subject=str(user.id),
            secret=self.settings.jwt_secret,
            algorithm=self.settings.jwt_algorithm,
            expires_delta=self._refresh_exp_delta(),
            token_type=TokenType.REFRESH,
        )

        await self._store_refresh_token(user=user, raw_token=refresh_token, payload=refresh_payload)

        return TokenBundle(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            access_expires_at=access_payload.exp,
            refresh_expires_at=refresh_payload.exp,
            roles=user.roles,
        )

    async def _store_refresh_token(
        self,
        *,
        user: User,
        raw_token: str,
        payload: JWTTokenPayload,
        replaced_token: RefreshToken | None = None,
    ) -> RefreshToken:
        token_record = RefreshToken(
            user=user,
            jwt_id=payload.jti,
            token_hash=hash_token_value(raw_token),
            expires_at=payload.exp,
        )
        if replaced_token:
            replaced_token.revoked = True
            replaced_token.revoked_at = datetime.now(timezone.utc)
            replaced_token.replaced_by_token = token_record

        self.session.add(token_record)
        return token_record

    async def authenticate_refresh_token(
        self,
        *,
        raw_token: str,
    ) -> tuple[User, RefreshToken, JWTTokenPayload]:
        try:
            payload = decode_jwt_token(
                token=raw_token,
                secret=self.settings.jwt_secret,
                algorithm=self.settings.jwt_algorithm,
            )
        except InvalidTokenError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

        if payload.type is not TokenType.REFRESH:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        if token_has_expired(payload):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.jwt_id == payload.jti)
        )
        token_record = result.scalar_one_or_none()
        if token_record is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found")

        if token_record.revoked:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

        if token_record.expires_at <= datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

        if hash_token_value(raw_token) != token_record.token_hash:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token mismatch")

        user = await self.session.get(User, token_record.user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return user, token_record, payload

    async def rotate_refresh_token(
        self,
        *,
        token_record: RefreshToken,
        user: User,
    ) -> TokenBundle:
        refresh_token, refresh_payload = create_jwt_token(
            subject=str(user.id),
            secret=self.settings.jwt_secret,
            algorithm=self.settings.jwt_algorithm,
            expires_delta=self._refresh_exp_delta(),
            token_type=TokenType.REFRESH,
        )
        await self._store_refresh_token(
            user=user,
            raw_token=refresh_token,
            payload=refresh_payload,
            replaced_token=token_record,
        )

        access_token, access_payload = create_jwt_token(
            subject=str(user.id),
            secret=self.settings.jwt_secret,
            algorithm=self.settings.jwt_algorithm,
            expires_delta=self._access_exp_delta(),
            token_type=TokenType.ACCESS,
            roles=user.roles,
        )

        return TokenBundle(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            access_expires_at=access_payload.exp,
            refresh_expires_at=refresh_payload.exp,
            roles=user.roles,
        )

    async def revoke_refresh_token(self, token_record: RefreshToken, *, cascade: bool = False) -> None:
        token_record.revoked = True
        token_record.revoked_at = datetime.now(timezone.utc)
        if cascade and token_record.replaced_by_token is not None:
            await self.revoke_refresh_token(token_record.replaced_by_token, cascade=True)
