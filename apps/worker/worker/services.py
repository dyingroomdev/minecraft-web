"""Worker services for Minecraft integration."""

from __future__ import annotations

import asyncio
import json
import struct
from datetime import datetime, timezone
from typing import Any

import aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from worker.config import WorkerSettings
from worker.models import ServerStatus


class MinecraftQuery:
    """Minecraft server status query using the Server List Ping protocol."""
    
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
    
    async def query(self) -> dict[str, Any]:
        """Query server status using Server List Ping."""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port), timeout=5.0
            )
            
            # Send handshake packet
            handshake = self._pack_varint(47) + self._pack_string(self.host) + struct.pack('>H', self.port) + self._pack_varint(1)
            packet = self._pack_varint(len(handshake)) + handshake
            writer.write(packet)
            
            # Send status request
            status_request = self._pack_varint(0)
            packet = self._pack_varint(len(status_request)) + status_request
            writer.write(packet)
            await writer.drain()
            
            # Read response
            length = await self._read_varint(reader)
            packet_id = await self._read_varint(reader)
            json_length = await self._read_varint(reader)
            json_data = await reader.read(json_length)
            
            writer.close()
            await writer.wait_closed()
            
            data = json.loads(json_data.decode('utf-8'))
            return {
                'status': 'online',
                'players_online': data.get('players', {}).get('online', 0),
                'players_max': data.get('players', {}).get('max', 0),
                'motd': data.get('description', {}).get('text', '') if isinstance(data.get('description'), dict) else str(data.get('description', '')),
                'version': data.get('version', {}).get('name', ''),
                'sample': data.get('players', {}).get('sample', []),
                'ping': 0
            }
        except Exception:
            return {
                'status': 'offline',
                'players_online': 0,
                'players_max': 0,
                'motd': '',
                'version': '',
                'sample': [],
                'ping': 0
            }
    
    def _pack_varint(self, value: int) -> bytes:
        """Pack integer as varint."""
        data = b''
        while value >= 0x80:
            data += struct.pack('B', value & 0x7F | 0x80)
            value >>= 7
        data += struct.pack('B', value)
        return data
    
    def _pack_string(self, value: str) -> bytes:
        """Pack string with length prefix."""
        encoded = value.encode('utf-8')
        return self._pack_varint(len(encoded)) + encoded
    
    async def _read_varint(self, reader: asyncio.StreamReader) -> int:
        """Read varint from stream."""
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
    """Background service to poll Minecraft server status."""
    
    def __init__(self, settings: WorkerSettings, session: AsyncSession, redis: aioredis.Redis):
        self.settings = settings
        self.session = session
        self.redis = redis
        self.query = MinecraftQuery(settings.minecraft_server_host, settings.minecraft_server_port)
        self._running = False
    
    async def start(self) -> None:
        """Start the polling loop."""
        self._running = True
        while self._running:
            try:
                await self._poll_and_update()
                await asyncio.sleep(10)
            except Exception:
                await asyncio.sleep(min(60, 20))  # Backoff on error
    
    def stop(self) -> None:
        """Stop the polling loop."""
        self._running = False
    
    async def _poll_and_update(self) -> None:
        """Poll server status and update database/Redis."""
        status_data = await self.query.query()
        
        # Update database
        server_status = ServerStatus(
            status=status_data['status'],
            players_online=status_data['players_online'],
            players_max=status_data['players_max'],
            motd=status_data['motd'],
            metadata={
                'version': status_data['version'],
                'sample': status_data['sample'],
                'ping': status_data['ping']
            },
            recorded_at=datetime.now(timezone.utc)
        )
        
        self.session.add(server_status)
        await self.session.commit()
        
        # Publish to Redis
        message = {
            'type': 'server_status',
            'data': {
                'status': status_data['status'],
                'players_online': status_data['players_online'],
                'players_max': status_data['players_max'],
                'motd': status_data['motd'],
                'version': status_data['version'],
                'ping': status_data['ping'],
                'timestamp': server_status.recorded_at.isoformat()
            }
        }
        
        await self.redis.publish('minecraft:status', json.dumps(message))


class RCONService:
    """RCON client for Minecraft server commands."""
    
    def __init__(self, host: str, port: int, password: str):
        self.host = host
        self.port = port
        self.password = password
        self._request_id = 1
    
    async def grant_rank(self, mc_uuid: str, group: str) -> None:
        """Grant a LuckPerms group to a player."""
        command = f"lp user {mc_uuid} parent add {group}"
        await self._execute_command(command)
    
    async def remove_rank(self, mc_uuid: str, group: str) -> None:
        """Remove a LuckPerms group from a player."""
        command = f"lp user {mc_uuid} parent remove {group}"
        await self._execute_command(command)
    
    async def _execute_command(self, command: str) -> str:
        """Execute RCON command and return response."""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port), timeout=10.0
            )
            
            # Authenticate
            auth_packet = self._build_packet(self._request_id, 3, self.password)
            writer.write(auth_packet)
            await writer.drain()
            
            # Read auth response
            auth_response = await self._read_packet(reader)
            if auth_response['id'] != self._request_id:
                raise Exception("RCON authentication failed")
            
            self._request_id += 1
            
            # Send command
            cmd_packet = self._build_packet(self._request_id, 2, command)
            writer.write(cmd_packet)
            await writer.drain()
            
            # Read command response
            response = await self._read_packet(reader)
            
            writer.close()
            await writer.wait_closed()
            
            return response['payload']
            
        except Exception:
            raise
    
    def _build_packet(self, request_id: int, packet_type: int, payload: str) -> bytes:
        """Build RCON packet."""
        import struct
        payload_bytes = payload.encode('utf-8') + b'\x00\x00'
        packet_size = len(payload_bytes) + 10
        
        packet = struct.pack('<i', packet_size - 4)
        packet += struct.pack('<i', request_id)
        packet += struct.pack('<i', packet_type)
        packet += payload_bytes
        
        return packet
    
    async def _read_packet(self, reader: asyncio.StreamReader) -> dict[str, Any]:
        """Read RCON packet from stream."""
        import struct
        
        size_data = await reader.read(4)
        if len(size_data) != 4:
            raise Exception("Failed to read packet size")
        
        packet_size = struct.unpack('<i', size_data)[0]
        packet_data = await reader.read(packet_size)
        if len(packet_data) != packet_size:
            raise Exception("Failed to read complete packet")
        
        request_id = struct.unpack('<i', packet_data[0:4])[0]
        packet_type = struct.unpack('<i', packet_data[4:8])[0]
        payload = packet_data[8:-2].decode('utf-8')
        
        return {
            'id': request_id,
            'type': packet_type,
            'payload': payload
        }