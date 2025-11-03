"""Admin authentication service."""

from __future__ import annotations

import bcrypt
from datetime import timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import Settings
from app.core.enums import AdminRole
from app.core.security import create_jwt_token, TokenType
from app.db.models import AdminUser


class AdminAuthService:
    """Service for admin user authentication."""

    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self.session = session
        self.settings = settings

    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    async def create_admin_user(self, email: str, password: str, role: AdminRole = AdminRole.ADMIN) -> AdminUser:
        """Create a new admin user."""
        # Check if user already exists
        result = await self.session.execute(select(AdminUser).where(AdminUser.email == email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin user already exists")

        admin_user = AdminUser(
            email=email,
            password_hash=self._hash_password(password),
            role=role.value,
        )
        self.session.add(admin_user)
        await self.session.commit()
        await self.session.refresh(admin_user)
        return admin_user

    async def authenticate_admin(self, email: str, password: str) -> AdminUser:
        """Authenticate an admin user."""
        result = await self.session.execute(select(AdminUser).where(AdminUser.email == email))
        admin_user = result.scalar_one_or_none()

        if not admin_user or not admin_user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if not self._verify_password(password, admin_user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

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