import asyncio
import types
import uuid

import pytest

from app.core.enums import RBACRole
from app.db.models import User
from app.services.auth import AuthService


async def _issue_admin_token(db_session, settings) -> tuple[User, str]:
    user = User(
        discord_id=str(uuid.uuid4()),
        username="DiagnosticsAdmin",
        email="diag@example.com",
        avatar=None,
        roles=[RBACRole.ADMIN.value],
    )
    db_session.add(user)
    await db_session.flush()

    service = AuthService(session=db_session, settings=settings)
    bundle = await service.issue_tokens(user=user)
    await db_session.commit()
    return user, bundle.access_token


@pytest.mark.asyncio
async def test_admin_diagnostics_reports_healthy(monkeypatch, client, db_session, settings_override):
    _, token = await _issue_admin_token(db_session, settings_override)

    class FakeRedis:
        async def ping(self):
            return True

        async def info(self, section=None):
            return {"redis_version": "7.2.1", "redis_mode": "standalone"}

        async def close(self):
            return None

    async def fake_open_connection(host, port):
        class DummyWriter:
            def close(self):
                pass

            async def wait_closed(self):
                return None

        return asyncio.StreamReader(), DummyWriter()

    monkeypatch.setattr("app.api.routes.admin_diagnostics.aioredis.from_url", lambda url: FakeRedis())
    monkeypatch.setattr("app.api.routes.admin_diagnostics.asyncio.open_connection", fake_open_connection)

    response = await client.get(
        "/admin/diagnostics/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["overall_status"] == "healthy"
    assert payload["database"]["status"] == "healthy"
    assert payload["redis"]["status"] == "healthy"
    assert payload["rcon"]["status"] in {"healthy", "skipped"}


@pytest.mark.asyncio
async def test_admin_diagnostics_handles_failures(monkeypatch, client, db_session, settings_override):
    _, token = await _issue_admin_token(db_session, settings_override)

    class BrokenRedis:
        async def ping(self):
            raise RuntimeError("boom")

        async def info(self, section=None):
            return {}

        async def close(self):
            return None

    monkeypatch.setattr("app.api.routes.admin_diagnostics.aioredis.from_url", lambda url: BrokenRedis())

    async def failing_open_connection(host, port):
        raise ConnectionError("rcon down")

    monkeypatch.setattr("app.api.routes.admin_diagnostics.asyncio.open_connection", failing_open_connection)

    response = await client.get(
        "/admin/diagnostics/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["overall_status"] == "degraded"
    assert payload["redis"]["status"] == "unhealthy"
    assert payload["rcon"]["status"] in {"unhealthy", "skipped"}
