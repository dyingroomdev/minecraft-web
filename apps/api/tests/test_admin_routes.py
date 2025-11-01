import pytest

from app.core.enums import RBACRole
from app.db.models import User
from app.db.session import SessionFactory
from app.services.auth import AuthService


@pytest.mark.asyncio
async def test_admin_create_news_requires_admin_role(client, settings_override):
    async with SessionFactory() as session:
        user = User(
            discord_id="123",
            username="Player",
            email="player@example.com",
            roles=[RBACRole.PLAYER.value],
        )
        session.add(user)
        await session.flush()

        auth_service = AuthService(session=session, settings=settings_override)
        bundle = await auth_service.issue_tokens(user=user)
        await session.commit()

    headers = {"Authorization": f"Bearer {bundle.access_token}"}
    response = await client.post(
        "/admin/news",
        json={
            "slug": "test-news",
            "title": "Test News",
            "content": "Test content",
        },
        headers=headers,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_create_news_success_with_admin_role(client, settings_override):
    async with SessionFactory() as session:
        admin_user = User(
            discord_id="456",
            username="Admin",
            email="admin@example.com",
            roles=[RBACRole.ADMIN.value],
        )
        session.add(admin_user)
        await session.flush()

        auth_service = AuthService(session=session, settings=settings_override)
        bundle = await auth_service.issue_tokens(user=admin_user)
        await session.commit()

    headers = {"Authorization": f"Bearer {bundle.access_token}"}
    response = await client.post(
        "/admin/news",
        json={
            "slug": "test-news",
            "title": "Test News",
            "content": "Test content",
        },
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "test-news"
    assert data["title"] == "Test News"