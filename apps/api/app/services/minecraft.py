"""Minecraft server query helpers and background poller."""

from __future__ import annotations

import asyncio
import json
import struct
from datetime import datetime, timezone
from typing import Any

from redis import asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.db.models import ServerStatus


SERVER_STATUS_CHANNEL = "minecraft:status"


class MinecraftQuery:
    """Minecraft server status query using the Server List Ping protocol."""

    def __init__(self, host: str, port: int) -> None:
        self.host = host
        self.port = port

    async def query(self) -> dict[str, Any]:
        """Query server status using Server List Ping."""

        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port), timeout=5.0
            )

            # Send handshake packet
            handshake = (
                self._pack_varint(47)
                + self._pack_string(self.host)
                + struct.pack(">H", self.port)
                + self._pack_varint(1)
            )
            writer.write(self._pack_varint(len(handshake)) + handshake)

            # Send status request
            status_request = self._pack_varint(0)
            writer.write(self._pack_varint(len(status_request)) + status_request)
            await writer.drain()

            # Read response
            await self._read_varint(reader)  # length (unused)
            await self._read_varint(reader)  # packet id (unused)
            json_length = await self._read_varint(reader)
            json_data = await reader.read(json_length)

            writer.close()
            await writer.wait_closed()

            payload = json.loads(json_data.decode("utf-8"))
            description = payload.get("description", "")
            if isinstance(description, dict):
                motd = description.get("text", "")
            else:
                motd = str(description)

            sample_players = payload.get("players", {}).get("sample", []) or []

            return {
                "status": "online",
                "players_online": payload.get("players", {}).get("online", 0),
                "players_max": payload.get("players", {}).get("max", 0),
                "motd": motd,
                "version": payload.get("version", {}).get("name", ""),
                "sample": sample_players,
                "ping": 0,  # Ping requires a second round-trip; omit for now
                "tps": None,
            }
        except Exception:
            return {
                "status": "offline",
                "players_online": 0,
                "players_max": 0,
                "motd": "",
                "version": "",
                "sample": [],
                "ping": 0,
                "tps": None,
            }

    def _pack_varint(self, value: int) -> bytes:
        data = b""
        while value >= 0x80:
            data += struct.pack("B", value & 0x7F | 0x80)
            value >>= 7
        data += struct.pack("B", value)
        return data

    def _pack_string(self, value: str) -> bytes:
        encoded = value.encode("utf-8")
        return self._pack_varint(len(encoded)) + encoded

    async def _read_varint(self, reader: asyncio.StreamReader) -> int:
        value = 0
        position = 0
        while True:
            byte_data = await reader.read(1)
            if not byte_data:
                raise EOFError("Unexpected end of stream")
            byte = byte_data[0]
            value |= (byte & 0x7F) << position
            if not (byte & 0x80):
                break
            position += 7
            if position >= 32:
                raise ValueError("VarInt too big")
        return value


class ServerStatusPoller:
    """Background poller that persists and broadcasts server status."""

    def __init__(
        self,
        settings: Settings,
        session_factory: async_sessionmaker[AsyncSession],
        redis: aioredis.Redis,
        *,
        interval: float = 10.0,
        max_backoff: float = 60.0,
        channel: str = SERVER_STATUS_CHANNEL,
        query: MinecraftQuery | None = None,
    ) -> None:
        self.settings = settings
        self._session_factory = session_factory
        self.redis = redis
        self.interval = interval
        self.max_backoff = max_backoff
        self.channel = channel
        self.query = query or MinecraftQuery(
            settings.minecraft_server_host, settings.minecraft_server_port
        )

        self._stop_event = asyncio.Event()
        self._stopped_event = asyncio.Event()

    async def run(self) -> None:
        """Run the polling loop until stopped."""

        self._stop_event.clear()
        self._stopped_event.clear()

        delay = self.interval
        try:
            while not self._stop_event.is_set():
                delay = await self._run_cycle(delay)
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=delay)
                except asyncio.TimeoutError:
                    continue
        finally:
            self._stopped_event.set()

    async def stop(self) -> None:
        """Signal the poller to stop and wait for completion."""

        self._stop_event.set()
        await self._stopped_event.wait()

    async def _run_cycle(self, previous_delay: float) -> float:
        try:
            await self._poll_and_update()
            return self.interval
        except Exception:
            return min(self.max_backoff, max(self.interval, previous_delay * 2))

    async def _poll_and_update(self) -> None:
        """Poll server status, persist it, and broadcast to Redis."""

        status_data = await self.query.query()
        recorded_at = datetime.now(timezone.utc)

        async with self._session_factory() as session:  # type: ignore[call-arg]
            server_status = ServerStatus(
                status=status_data["status"],
                players_online=status_data["players_online"],
                players_max=status_data["players_max"],
                motd=status_data["motd"],
                meta_data={
                    "version": status_data.get("version"),
                    "sample": status_data.get("sample", []),
                    "ping": status_data.get("ping"),
                    "tps": status_data.get("tps"),
                },
                recorded_at=recorded_at,
            )

            session.add(server_status)
            await session.commit()

        message = {
            "type": "server_status",
            "data": {
                "status": status_data["status"],
                "players_online": status_data["players_online"],
                "players_max": status_data["players_max"],
                "motd": status_data["motd"],
                "version": status_data.get("version"),
                "ping": status_data.get("ping"),
                "tps": status_data.get("tps"),
                "sample": status_data.get("sample", []),
                "timestamp": recorded_at.isoformat(),
            },
        }

        await self.redis.publish(self.channel, json.dumps(message))
