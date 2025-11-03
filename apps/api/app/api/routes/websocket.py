"""WebSocket endpoints for real-time updates."""

from __future__ import annotations

import asyncio
import json
from typing import Any

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

from app.core.config import Settings, get_settings

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections and Redis subscriptions."""
    
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.redis_task: asyncio.Task | None = None
        self.redis: aioredis.Redis | None = None
    
    async def connect(self, websocket: WebSocket, settings: Settings) -> None:
        """Accept WebSocket connection and start Redis listener if needed."""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if self.redis_task is None:
            self.redis = aioredis.from_url(settings.redis_url)
            self.redis_task = asyncio.create_task(self._redis_listener())
    
    def disconnect(self, websocket: WebSocket) -> None:
        """Remove WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if not self.active_connections and self.redis_task:
            self.redis_task.cancel()
            self.redis_task = None
    
    async def broadcast(self, message: dict[str, Any]) -> None:
        """Broadcast message to all connected clients."""
        if not self.active_connections:
            return
        
        message_str = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                if connection.client_state == WebSocketState.CONNECTED:
                    await connection.send_text(message_str)
                else:
                    disconnected.append(connection)
            except Exception:
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
    
    async def _redis_listener(self) -> None:
        """Listen for Redis messages and broadcast to WebSocket clients."""
        if not self.redis:
            return
        
        try:
            pubsub = self.redis.pubsub()
            await pubsub.subscribe("amz:status:channel")
            
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        await self.broadcast(data)
                    except json.JSONDecodeError:
                        continue
        except asyncio.CancelledError:
            pass
        finally:
            if self.redis:
                await self.redis.close()


manager = ConnectionManager()


@router.websocket("/ws/status")
async def websocket_status(
    websocket: WebSocket,
    settings: Settings = Depends(get_settings),
) -> None:
    """WebSocket endpoint for real-time server status updates."""
    await manager.connect(websocket, settings)
    
    try:
        while True:
            # Keep connection alive and handle client messages if needed
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
