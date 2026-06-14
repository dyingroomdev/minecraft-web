import pytest

from app.core.enums import RBACRole
from app.db.models import User
from app.db.session import SessionFactory
from app.services.auth import AuthService


@pytest.mark.asyncio
async def test_discord_login_redirects_to_discord(client):
    response = await client.get("/auth/discord/login", follow_redirects=False)

    assert response.status_code == 302
    assert response.headers["location"].startswith("https://discord.com/api/oauth2/authorize?")
    assert "client_id=test-client" in response.headers["location"]


@pytest.mark.asyncio
async def test_register_and_login_with_email(client):
    registration = await client.post(
        "/auth/register",
        json={
            "email": "player@example.com",
            "username": "NewPlayer",
            "password": "correct-horse-battery",
        },
    )
    assert registration.status_code == 200
    assert registration.json()["access_token"]

    login = await client.post(
        "/auth/login",
        json={"email": "PLAYER@example.com", "password": "correct-horse-battery"},
    )
    assert login.status_code == 200
    assert login.json()["roles"] == [RBACRole.PLAYER.value]

    invalid = await client.post(
        "/auth/login",
        json={"email": "player@example.com", "password": "wrong-password"},
    )
    assert invalid.status_code == 401


@pytest.mark.asyncio
async def test_google_login_requires_configuration(client):
    response = await client.get("/auth/google/login", follow_redirects=False)
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_refresh_endpoint_rotates_cookie_and_token(client, settings_override):
    async with SessionFactory() as session:
        user = User(
            discord_id="999",
            username="Rotator",
            email="rotate@example.com",
            avatar=None,
            roles=[role.value for role in (RBACRole.PLAYER,)],
        )
        session.add(user)
        await session.flush()

        auth_service = AuthService(session=session, settings=settings_override)
        bundle = await auth_service.issue_tokens(user=user)
        await session.commit()

    client.cookies.set(settings_override.jwt_refresh_cookie_name, bundle.refresh_token)
    response = await client.post("/auth/refresh")

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"]
    assert payload["refresh_expires_at"]
    assert payload["roles"] == [RBACRole.PLAYER.value]

    rotated_cookie = response.cookies.get(settings_override.jwt_refresh_cookie_name)
    assert rotated_cookie is not None
    assert rotated_cookie != bundle.refresh_token
