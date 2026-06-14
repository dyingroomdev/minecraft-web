"""Admin authentication service."""

from __future__ import annotations

from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.enums import AdminRole
from app.core.security import TokenType, create_jwt_token, hash_password, verify_password
from app.db.models import AdminUser


class AdminAuthService:
    """Service for admin user authentication."""

    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self.session = session
        self.settings = settings

    async def create_admin_user(self, email: str, password: str, role: AdminRole = AdminRole.ADMIN) -> AdminUser:
        """Create a new admin user."""
        # Check if user already exists
        email = email.strip().lower()
        result = await self.session.execute(select(AdminUser).where(AdminUser.email == email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin user already exists")

        admin_user = AdminUser(
            email=email,
            password_hash=hash_password(password),
            role=role.value,
        )
        self.session.add(admin_user)
        await self.session.commit()
        await self.session.refresh(admin_user)
        return admin_user

    async def authenticate_admin(self, email: str, password: str) -> AdminUser:
        """Authenticate an admin user."""
        result = await self.session.execute(
            select(AdminUser).where(AdminUser.email == email.strip().lower())
        )
        admin_user = result.scalar_one_or_none()

        if not admin_user or not admin_user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if not verify_password(password, admin_user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        return admin_user

    async def authenticate_discord(
        self,
        *,
        discord_id: str,
        email: str | None,
        email_verified: bool,
    ) -> AdminUser:
        """Authorize Discord only when it matches an existing active admin."""

        if not email or not email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Discord did not provide a verified email address",
            )

        result = await self.session.execute(
            select(AdminUser).where(AdminUser.email == email.strip().lower())
        )
        admin_user = result.scalar_one_or_none()
        if not admin_user or not admin_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This Discord account is not authorized for admin access",
            )
        if admin_user.discord_id and admin_user.discord_id != discord_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account is linked to another Discord account",
            )
        admin_user.discord_id = discord_id
        return admin_user

    def create_admin_token(self, admin_user: AdminUser) -> str:
        """Create JWT token for admin user."""
        access_token, _ = create_jwt_token(
            subject=str(admin_user.id),
            secret=self.settings.jwt_secret,
            algorithm=self.settings.jwt_algorithm,
            expires_delta=timedelta(minutes=self.settings.jwt_access_expires_minutes),
            token_type=TokenType.ACCESS,
            roles=[admin_user.role],
        )
        return access_token
