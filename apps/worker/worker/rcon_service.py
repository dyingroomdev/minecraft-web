"""RCON service for Minecraft server communication."""

from __future__ import annotations

import asyncio
import struct
from typing import Any

import structlog

logger = structlog.get_logger()


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
        logger.info("rcon.grant_rank", uuid=mc_uuid, group=group)
    
    async def remove_rank(self, mc_uuid: str, group: str) -> None:
        """Remove a LuckPerms group from a player."""
        command = f"lp user {mc_uuid} parent remove {group}"
        await self._execute_command(command)
        logger.info("rcon.remove_rank", uuid=mc_uuid, group=group)
    
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
            
        except Exception as e:
            logger.error("rcon.command_failed", command=command, error=str(e))
            raise
    
    def _build_packet(self, request_id: int, packet_type: int, payload: str) -> bytes:
        """Build RCON packet."""
        payload_bytes = payload.encode('utf-8') + b'\x00\x00'
        packet_size = len(payload_bytes) + 10
        
        packet = struct.pack('<i', packet_size - 4)  # Size (excluding size field)
        packet += struct.pack('<i', request_id)      # Request ID
        packet += struct.pack('<i', packet_type)     # Type
        packet += payload_bytes                      # Payload + null terminators
        
        return packet
    
    async def _read_packet(self, reader: asyncio.StreamReader) -> dict[str, Any]:
        """Read RCON packet from stream."""
        # Read packet size
        size_data = await reader.read(4)
        if len(size_data) != 4:
            raise Exception("Failed to read packet size")
        
        packet_size = struct.unpack('<i', size_data)[0]
        
        # Read packet data
        packet_data = await reader.read(packet_size)
        if len(packet_data) != packet_size:
            raise Exception("Failed to read complete packet")
        
        # Parse packet
        request_id = struct.unpack('<i', packet_data[0:4])[0]
        packet_type = struct.unpack('<i', packet_data[4:8])[0]
        payload = packet_data[8:-2].decode('utf-8')  # Remove null terminators
        
        return {
            'id': request_id,
            'type': packet_type,
            'payload': payload
        }