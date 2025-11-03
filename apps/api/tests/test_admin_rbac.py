"""Tests for admin RBAC system."""

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import AdminRole
from app.db.models import AdminUser
from app.services.admin_auth import AdminAuthService


@pytest.fixture
async def admin_user(db_session: AsyncSession, settings) -> AdminUser:
    """Create a test admin user."""
    auth_service = AdminAuthService(db_session, settings)
    admin_user = await auth_service.create_admin_user(
        email="admin@test.com",
        password="testpass123",
        role=AdminRole.ADMIN,
    )
    await db_session.commit()
    return admin_user


@pytest.fixture
async def super_admin_user(db_session: AsyncSession, settings) -> AdminUser:
    """Create a test super admin user."""
    auth_service = AdminAuthService(db_session, settings)
    super_admin = await auth_service.create_admin_user(
        email="superadmin@test.com",
        password="testpass123",
        role=AdminRole.SUPER_ADMIN,
    )
    await db_session.commit()
    return super_admin


@pytest.fixture
async def admin_token(admin_user: AdminUser, settings) -> str:
    """Create JWT token for admin user."""
    from app.services.admin_auth import AdminAuthService
    auth_service = AdminAuthService(None, settings)
    return auth_service.create_admin_token(admin_user)


@pytest.fixture
async def super_admin_token(super_admin_user: AdminUser, settings) -> str:
    """Create JWT token for super admin user."""
    from app.services.admin_auth import AdminAuthService
    auth_service = AdminAuthService(None, settings)
    return auth_service.create_admin_token(super_admin_user)


class TestAdminRBAC:
    """Test admin RBAC functionality."""

    async def test_admin_login(self, client: AsyncClient, admin_user: AdminUser):
        """Test admin login."""
        response = await client.post(
            "/admin/auth/login",
            json={"email": "admin@test.com", "password": "testpass123"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "ADMIN"

    async def test_admin_profile(self, client: AsyncClient, admin_token: str):
        """Test admin profile endpoint."""
        response = await client.get(
            "/admin/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "admin@test.com"
        assert data["role"] == "ADMIN"

    async def test_admin_can_access_regular_endpoints(self, client: AsyncClient, admin_token: str):
        """Test that admin can access regular admin endpoints."""
        response = await client.get(
            "/admin/rules",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK

    async def test_admin_cannot_access_super_admin_endpoints(self, client: AsyncClient, admin_token: str):
        """Test that admin cannot access super admin endpoints."""
        response = await client.get(
            "/admin/diagnostics/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_super_admin_can_access_all_endpoints(self, client: AsyncClient, super_admin_token: str):
        """Test that super admin can access all endpoints."""
        # Regular admin endpoint
        response = await client.get(
            "/admin/rules",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK

        # Super admin endpoint
        response = await client.get(
            "/admin/diagnostics/",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK

    async def test_admin_cannot_create_users(self, client: AsyncClient, admin_token: str):
        """Test that admin cannot create other admin users."""
        response = await client.post(
            "/admin/users/",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": "newadmin@test.com",
                "password": "testpass123",
                "role": "ADMIN",
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_super_admin_can_create_users(self, client: AsyncClient, super_admin_token: str):
        """Test that super admin can create other admin users."""
        response = await client.post(
            "/admin/users/",
            headers={"Authorization": f"Bearer {super_admin_token}"},
            json={
                "email": "newadmin@test.com",
                "password": "testpass123",
                "role": "ADMIN",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED