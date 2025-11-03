#!/usr/bin/env python3
"""Create admin user script."""

import asyncio
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from app.core.config import get_settings
from app.core.enums import AdminRole
from app.db.session import SessionFactory
from app.services.admin_auth import AdminAuthService


async def create_admin_user():
    """Create the initial admin user."""
    settings = get_settings()
    
    async with SessionFactory() as session:
        auth_service = AdminAuthService(session, settings)
        
        try:
            admin_user = await auth_service.create_admin_user(
                email="admin@amzcraft.xyz",
                password="admin123",
                role=AdminRole.SUPER_ADMIN
            )
            print(f"Created admin user: {admin_user.email} with role {admin_user.role}")
        except Exception as e:
            print(f"Error creating admin user: {e}")
            # User might already exist, try to authenticate
            try:
                admin_user = await auth_service.authenticate_admin("admin@amzcraft.xyz", "admin123")
                print(f"Admin user already exists: {admin_user.email} with role {admin_user.role}")
            except Exception as auth_e:
                print(f"Authentication also failed: {auth_e}")


if __name__ == "__main__":
    asyncio.run(create_admin_user())