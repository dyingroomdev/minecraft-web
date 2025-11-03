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
from app.core.enums import AdminRole, RBACRole
from app.core.security import (
    InvalidTokenError,
    TokenType,
    decode_jwt_token,
    token_has_expired,
)
from app.db.models import AdminUser, User
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


def _normalized_roles(user: User) -> set[str]:
    return {role.upper() for role in user.roles}


def require_roles(*roles: RBACRole | str):
    allowed = {role.value if isinstance(role, RBACRole) else str(role).upper() for role in roles}

    async def _checker(user: User = Depends(get_current_user)) -> User:
        if not allowed & _normalized_roles(user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _checker


async def get_admin_user(current_user: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER))) -> User:
    return current_user


async def get_current_admin_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> AdminUser:
    """Get current admin user from JWT token."""
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

    result = await session.execute(select(AdminUser).where(AdminUser.id == user_id))
    admin_user = result.scalar_one_or_none()
    if not admin_user or not admin_user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin user not found")

    return admin_user


def require_admin(min_role: AdminRole = AdminRole.ADMIN):
    """Require admin user with minimum role."""
    async def wrapper(admin_user: AdminUser = Depends(get_current_admin_user)) -> AdminUser:
        user_role = AdminRole(admin_user.role)
        
        # SUPER_ADMIN has access to everything
        if user_role == AdminRole.SUPER_ADMIN:
            return admin_user
            
        # Check if user has required role
        if user_role != min_role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")
            
        return admin_user
    return wrapper
