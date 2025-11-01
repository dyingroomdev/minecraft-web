import pytest

from app.db.models import User
from app.services.auth import AuthService
from app.core.enums import RBACRole
from app.db.session import SessionFactory


@pytest.mark.asyncio
async def test_me_endpoint_returns_authenticated_user(client, settings_override):
    async with SessionFactory() as session:
        user = User(
            discord_id="555",
            username="Tester",
            email="tester@example.com",
            avatar=None,
            roles=[RBACRole.PLAYER.value],
        )
        session.add(user)
        await session.flush()

        auth_service = AuthService(session=session, settings=settings_override)
        tokens = await auth_service.issue_tokens(user=user)
        await session.commit()

    response = await client.get(
        "/me",
        headers={"Authorization": f"Bearer {tokens.access_token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["discord_id"] == "555"
    assert payload["roles"] == [RBACRole.PLAYER.value]
