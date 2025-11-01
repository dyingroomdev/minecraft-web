import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketState

from app.api.routes.websocket import ConnectionManager


@pytest.mark.asyncio
async def test_connection_manager_broadcast():
    """Test broadcasting messages to connected WebSocket clients."""
    manager = ConnectionManager()
    
    # Mock WebSocket connections
    ws1 = MagicMock()
    ws1.client_state = WebSocketState.CONNECTED
    ws1.send_text = AsyncMock()
    
    ws2 = MagicMock()
    ws2.client_state = WebSocketState.CONNECTED
    ws2.send_text = AsyncMock()
    
    manager.active_connections = [ws1, ws2]
    
    message = {"type": "test", "data": "hello"}
    await manager.broadcast(message)
    
    # Verify both connections received the message
    ws1.send_text.assert_called_once_with(json.dumps(message))
    ws2.send_text.assert_called_once_with(json.dumps(message))


@pytest.mark.asyncio
async def test_connection_manager_handles_disconnected_clients():
    """Test that disconnected clients are cleaned up during broadcast."""
    manager = ConnectionManager()
    
    # Mock connected and disconnected WebSocket
    ws_connected = MagicMock()
    ws_connected.client_state = WebSocketState.CONNECTED
    ws_connected.send_text = AsyncMock()
    
    ws_disconnected = MagicMock()
    ws_disconnected.client_state = WebSocketState.DISCONNECTED
    ws_disconnected.send_text = AsyncMock()
    
    manager.active_connections = [ws_connected, ws_disconnected]
    
    message = {"type": "test", "data": "hello"}
    await manager.broadcast(message)
    
    # Verify only connected client received message
    ws_connected.send_text.assert_called_once()
    ws_disconnected.send_text.assert_not_called()
    
    # Verify disconnected client was removed
    assert ws_disconnected not in manager.active_connections
    assert ws_connected in manager.active_connections


@pytest.mark.asyncio
async def test_connection_manager_redis_listener():
    """Test Redis message listening and broadcasting."""
    manager = ConnectionManager()
    
    # Mock Redis and WebSocket
    mock_redis = AsyncMock()
    mock_pubsub = AsyncMock()
    mock_redis.pubsub.return_value = mock_pubsub
    
    # Mock Redis message
    redis_message = {
        'type': 'message',
        'data': json.dumps({'type': 'server_status', 'data': {'status': 'online'}})
    }
    
    mock_pubsub.listen.return_value = [redis_message]
    
    ws = MagicMock()
    ws.client_state = WebSocketState.CONNECTED
    ws.send_text = AsyncMock()
    manager.active_connections = [ws]
    manager.redis = mock_redis
    
    # Start listener task
    task = asyncio.create_task(manager._redis_listener())
    await asyncio.sleep(0.1)  # Let it process the message
    task.cancel()
    
    try:
        await task
    except asyncio.CancelledError:
        pass
    
    # Verify subscription and broadcast
    mock_pubsub.subscribe.assert_called_with('minecraft:status')
    ws.send_text.assert_called_once()


def test_websocket_endpoint_integration(client: TestClient):
    """Test WebSocket endpoint accepts connections."""
    with client.websocket_connect("/ws/status") as websocket:
        # Connection should be established
        assert websocket is not None
        
        # Send a test message (connection should stay alive)
        websocket.send_text("ping")
        
        # WebSocket should remain connected
        # In a real scenario, server status updates would be received here