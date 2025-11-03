"""Admin user management routes (SUPER_ADMIN only)."""

from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_settings_dependency, require_admin
from app.core.config import Settings
from app.core.enums import AdminRole
from app.db.models import AdminUser
from app.schemas.admin import AdminCreateRequest, AdminUserRead
from app.services.admin_auth import AdminAuthService

router = APIRouter()


@router.get("/", response_model=list[AdminUserRead])
async def list_admin_users(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> list[AdminUserRead]:
    """List all admin users (SUPER_ADMIN only)."""
    result = await session.execute(select(AdminUser).order_by(AdminUser.created_at))
    admin_users = result.scalars().all()
    
    return [
        AdminUserRead(
            id=str(user.id),
            email=user.email,
            role=AdminRole(user.role),
            is_active=user.is_active,
        )
        for user in admin_users
    ]


@router.post("/", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
async def create_admin_user(
    payload: AdminCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> AdminUserRead:
    """Create new admin user (SUPER_ADMIN only)."""
    auth_service = AdminAuthService(session, settings)
    admin_user = await auth_service.create_admin_user(
        email=payload.email,
        password=payload.password,
        role=payload.role,
    )
    
    return AdminUserRead(
        id=str(admin_user.id),
        email=admin_user.email,
        role=AdminRole(admin_user.role),
        is_active=admin_user.is_active,
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    current_admin: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> None:
    """Delete admin user (SUPER_ADMIN only)."""
    if current_admin.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")
    
    result = await session.execute(select(AdminUser).where(AdminUser.id == user_id))
    admin_user = result.scalar_one_or_none()
    if not admin_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found")
    
    await session.delete(admin_user)
    await session.commit()