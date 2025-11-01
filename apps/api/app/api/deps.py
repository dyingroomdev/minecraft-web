"""Shared FastAPI dependencies."""

from __future__ import annotations

import uuid

from typing import AsyncIterator

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.enums import RBACRole
from app.core.security import (
    InvalidTokenError,
    TokenType,
    decode_jwt_token,
    token_has_expired,
)
from app.db.models import User
from app.db.session import get_session


def get_oauth_scheme() -> OAuth2PasswordBearer:
    return OAuth2PasswordBearer(tokenUrl="/auth/discord/login")


oauth2_scheme = get_oauth_scheme()


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async for session in get_session():
        yield session


async def get_settings_dependency() -> Settings:
    return get_settings()


async def get_http_client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        yield client


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> User:
    try:
        payload = decode_jwt_token(token=token, secret=settings.jwt_secret, algorithm=settings.jwt_algorithm)
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if payload.type is not TokenType.ACCESS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    if token_has_expired(payload):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    try:
        user_id = uuid.UUID(payload.sub)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid subject") from exc

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if RBACRole.ADMIN not in current_user.roles and RBACRole.OWNER not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
