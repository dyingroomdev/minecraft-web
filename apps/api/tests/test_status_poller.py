import json
import uuid

import pytest
from sqlalchemy import delete, select

from app.db.models import ServerStatus
from app.db.session import SessionFactory
from app.services.minecraft import SERVER_STATUS_CHANNEL, ServerStatusPoller


class DummyRedis:
    def __init__(self) -> None:
        self.messages: list[tuple[str, str]] = []

    async def publish(self, channel: str, payload: str) -> int:
        self.messages.append((channel, payload))
        return 1


class ToggleQuery:
    def __init__(self, responses: list[object]) -> None:
        self._responses = responses

    async def query(self) -> dict:
        if not self._responses:
            raise RuntimeError("No responses configured")
        result = self._responses.pop(0)
        if isinstance(result, Exception):
            raise result
        return result  # type: ignore[return-value]


@pytest.mark.asyncio
async def test_server_status_poller_backoff_and_broadcast(settings_override):
    redis = DummyRedis()
    base_payload = {
        "status": "online",
        "players_online": 5,
        "players_max": 20,
        "motd": "Welcome",
        "version": "1.20.4",
        "sample": [{"name": "Player1", "id": str(uuid.uuid4())}],
        "ping": 42,
        "tps": 19.5,
    }

    query = ToggleQuery([
        RuntimeError("network error"),
        RuntimeError("another error"),
        base_payload.copy(),
    ])

    poller = ServerStatusPoller(
        settings=settings_override,
        session_factory=SessionFactory,
        redis=redis,
        interval=1,
        max_backoff=4,
        query=query,
    )

    delay = await poller._run_cycle(poller.interval)
    assert delay == 2

    delay = await poller._run_cycle(delay)
    assert delay == 4

    delay = await poller._run_cycle(delay)
    assert delay == 1

    # Ensure Redis publish happened once with the expected payload
    assert len(redis.messages) == 1
    channel, message = redis.messages[0]
    assert channel == SERVER_STATUS_CHANNEL
    payload = json.loads(message)
    assert payload["data"]["status"] == "online"
    assert payload["data"]["sample"][0]["name"] == "Player1"

    # Verify database record matches payload metadata
    async with SessionFactory() as session:
        result = await session.execute(select(ServerStatus).order_by(ServerStatus.recorded_at.desc()))
        record = result.scalar_one()
        assert record.meta_data["version"] == base_payload["version"]
        assert record.players_online == base_payload["players_online"]
        await session.execute(delete(ServerStatus))
        await session.commit()
