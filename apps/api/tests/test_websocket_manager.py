import json

import pytest
from fastapi.websockets import WebSocketState

from app.api.routes.websocket import ConnectionManager


class DummyWebSocket:
    def __init__(self, state: WebSocketState) -> None:
        self.client_state = state
        self.messages: list[str] = []

    async def send_text(self, message: str) -> None:
        self.messages.append(message)


@pytest.mark.asyncio
async def test_connection_manager_broadcast_filters_disconnected():
    manager = ConnectionManager()
    connected = DummyWebSocket(WebSocketState.CONNECTED)
    disconnected = DummyWebSocket(WebSocketState.DISCONNECTED)
    manager.active_connections = [connected, disconnected]

    await manager.broadcast({"status": "online"})

    assert manager.active_connections == [connected]
    assert connected.messages == [json.dumps({"status": "online"})]
