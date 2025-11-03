"""Admin authentication routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_settings_dependency, require_admin
from app.core.config import Settings
from app.core.enums import AdminRole
from app.schemas.admin import AdminLoginRequest, AdminUserRead
from app.services.admin_auth import AdminAuthService

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