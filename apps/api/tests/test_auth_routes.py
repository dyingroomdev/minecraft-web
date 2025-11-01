import pytest

from app.core.enums import RBACRole
from app.db.models import User
from app.db.session import SessionFactory
from app.services.auth import AuthService


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
