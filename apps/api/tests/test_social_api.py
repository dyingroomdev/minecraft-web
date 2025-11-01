import pytest

from app.core.enums import RBACRole
from app.db.models import SocialLink, User
from app.db.session import SessionFactory
from app.services.auth import AuthService


@pytest.mark.asyncio
async def test_get_social_links_public(client, settings_override):
    """Test public social links endpoint."""
    async with SessionFactory() as session:
        # Create social links
        links = [
            SocialLink(platform="DISCORD", url="https://discord.gg/test"),
            SocialLink(platform="TWITTER", url="https://twitter.com/test"),
        ]
        for link in links:
            session.add(link)
        await session.commit()

    response = await client.get("/api/social")
    assert response.status_code == 200
    
    data = response.json()
    assert data["discord"] == "https://discord.gg/test"
    assert data["twitter"] == "https://twitter.com/test"
    assert data["facebook"] is None


@pytest.mark.asyncio
async def test_update_social_links_admin_only(client, settings_override):
    """Test social links update requires admin role."""
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
    
    response = await client.patch(
        "/admin/social",
        json={"discord": "https://discord.gg/new"},
        headers=headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_social_links_success(client, settings_override):
    """Test successful social links update."""
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
    
    response = await client.patch(
        "/admin/social",
        json={
            "discord": "https://discord.gg/updated",
            "twitter": "https://twitter.com/updated",
        },
        headers=headers,
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["discord"] == "https://discord.gg/updated"
    assert data["twitter"] == "https://twitter.com/updated"