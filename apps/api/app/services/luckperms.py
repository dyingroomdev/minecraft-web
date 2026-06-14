"""LuckPerms administrative helpers."""

from __future__ import annotations

import asyncio
import contextlib
import struct
from typing import Any


class RCONError(RuntimeError):
    """Raised when RCON communication fails."""


class LuckPermsService:
    """Simple asynchronous RCON client for LuckPerms commands."""

    def __init__(self, host: str, port: int, password: str, *, timeout: float = 5.0) -> None:
        self.host = host
        self.port = port
        self.password = password
        self.timeout = timeout
        self._request_id = 1

    async def list_groups(self) -> list[str]:
        """Return LuckPerms groups via `lp listgroups`."""

        payload = await self._execute("lp listgroups")
        if not payload:
            return []

        # Typical output: "There are X groups: default, vip, mvp"
        groups: list[str] = []
        if ":" in payload:
            _, _, data = payload.partition(":")
            groups = [item.strip() for item in data.split(",") if item.strip()]
        else:
            groups = [line.strip() for line in payload.splitlines() if line.strip()]

        # De-duplicate while preserving order
        seen: set[str] = set()
        result: list[str] = []
        for group in groups:
            if group not in seen:
                seen.add(group)
                result.append(group)
        return result

    async def _execute(self, command: str) -> str:
        if not self.password:
            raise RCONError("RCON password not configured")

        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(self.host, self.port),
            timeout=self.timeout,
        )

        try:
            # Authenticate first.
            auth_id = self._next_request_id()
            writer.write(self._build_packet(auth_id, 3, self.password))
            await writer.drain()

            while True:
                auth_response = await self._read_packet(reader)
                if auth_response["id"] == -1:
                    raise RCONError("RCON authentication failed")
                if auth_response["id"] == auth_id:
                    break

            # Issue command with fresh request id so we can ignore stray packets.
            command_id = self._next_request_id()
            writer.write(self._build_packet(command_id, 2, command))
            await writer.drain()

            chunks: list[str] = []
            safety_budget = 8  # avoid tight loops if server misbehaves
            while safety_budget:
                try:
                    packet = await asyncio.wait_for(
                        self._read_packet(reader),
                        timeout=0.35 if chunks else self.timeout,
                    )
                except asyncio.TimeoutError:
                    if chunks:
                        break
                    raise
                if packet["id"] == -1:
                    raise RCONError(f"RCON command rejected: {command}")
                if packet["id"] != command_id:
                    # Skip unrelated packets (e.g. leftover auth echoes).
                    continue

                payload = packet.get("payload", "")
                if payload:
                    chunks.append(payload)
                if not payload:
                    break
                safety_budget -= 1

            return "\n".join(chunks)
        finally:
            writer.close()
            with contextlib.suppress(Exception):
                await writer.wait_closed()

    def _next_request_id(self) -> int:
        current = self._request_id
        self._request_id += 1
        if self._request_id > 2**31 - 1:
            self._request_id = 1
        return current

    def _build_packet(self, request_id: int, packet_type: int, payload: str) -> bytes:
        payload_bytes = payload.encode("utf-8")
        length = len(payload_bytes) + 10  # id + type + payload + 2 null terminators
        return (
            struct.pack("<i", length)
            + struct.pack("<i", request_id)
            + struct.pack("<i", packet_type)
            + payload_bytes
            + b"\x00\x00"
        )

    async def _read_packet(self, reader: asyncio.StreamReader) -> dict[str, Any]:
        size_data = await reader.readexactly(4)
        (packet_size,) = struct.unpack("<i", size_data)
        data = await reader.readexactly(packet_size)
        request_id = struct.unpack("<i", data[0:4])[0]
        packet_type = struct.unpack("<i", data[4:8])[0]
        payload = data[8:-2].decode("utf-8", errors="ignore")
        return {"id": request_id, "type": packet_type, "payload": payload}
