import pytest
from sqlalchemy import select

from app.core.enums import RBACRole
from app.services.auth import AuthService
from app.services.discord import map_discord_roles_to_rbac
from app.db.models import RefreshToken, User


def test_map_discord_roles_to_rbac_returns_sorted_roles():
    mapping = {
        RBACRole.OWNER: {"1"},
        RBACRole.ADMIN: {"2", "3"},
        RBACRole.MOD: set(),
        RBACRole.PLAYER: set(),
    }

    resolved = map_discord_roles_to_rbac(discord_role_ids=["3", "99"], mapping=mapping)

    assert resolved == ["ADMIN", "PLAYER"]


@pytest.mark.asyncio
async def test_issue_and_rotate_tokens(db_session, settings_override):
    service = AuthService(session=db_session, settings=settings_override)

    user = User(
        discord_id="123",
        username="TestUser",
        email="user@example.com",
        avatar=None,
        roles=[RBACRole.PLAYER.value],
    )
    db_session.add(user)
    await db_session.flush()

    issued = await service.issue_tokens(user=user)
    await db_session.flush()

    assert issued.access_token
    assert issued.refresh_token

    result = await db_session.execute(select(RefreshToken))
    stored_token = result.scalar_one()
    assert stored_token.user_id == user.id

    user_ref, token_record, payload = await service.authenticate_refresh_token(
        raw_token=issued.refresh_token,
    )
    assert user_ref.id == user.id
    assert payload.jti == stored_token.jwt_id

    rotated = await service.rotate_refresh_token(token_record=token_record, user=user)
    await db_session.flush()

    assert token_record.revoked is True
    assert rotated.refresh_token != issued.refresh_token

    await service.revoke_refresh_token(token_record=token_record, cascade=True)
    await db_session.flush()

    assert token_record.revoked is True
