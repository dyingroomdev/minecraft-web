#!/usr/bin/env python3
"""Create admin user script."""

import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from sqlalchemy import select

from app.core.config import get_settings
from app.core.enums import AdminRole
from app.core.security import hash_password
from app.db.models import AdminUser
from app.db.session import SessionFactory
from app.services.admin_auth import AdminAuthService


async def create_admin_user():
    """Create or reset the bootstrap super admin."""
    settings = get_settings()
    email = os.environ.get("ADMIN_BOOTSTRAP_EMAIL")
    password = os.environ.get("ADMIN_BOOTSTRAP_PASSWORD")

    if not email or not password:
        raise RuntimeError(
            "ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required"
        )
    if len(password) < 8:
        raise RuntimeError("ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters")

    email = email.strip().lower()

    async with SessionFactory() as session:
        result = await session.execute(
            select(AdminUser).where(AdminUser.email == email)
        )
        admin_user = result.scalar_one_or_none()

        if admin_user is None:
            admin_user = AdminUser(
                email=email,
                password_hash=hash_password(password),
                role=AdminRole.SUPER_ADMIN.value,
                is_active=True,
            )
            session.add(admin_user)
            action = "Created"
        else:
            admin_user.password_hash = hash_password(password)
            admin_user.role = AdminRole.SUPER_ADMIN.value
            admin_user.is_active = True
            action = "Updated"

        await session.commit()
        await AdminAuthService(session, settings).authenticate_admin(email, password)
        print(f"{action} verified super admin: {email}")


if __name__ == "__main__":
    asyncio.run(create_admin_user())
