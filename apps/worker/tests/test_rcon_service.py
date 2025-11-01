import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from worker.services import RCONService


@pytest.mark.asyncio
async def test_rcon_grant_rank_success():
    """Test successful rank granting via RCON."""
    rcon = RCONService("localhost", 25575, "password")
    
    with patch.object(rcon, '_execute_command', new_callable=AsyncMock) as mock_execute:
        mock_execute.return_value = "User testuser added to group vip"
        
        await rcon.grant_rank("550e8400-e29b-41d4-a716-446655440000", "vip")
        
        mock_execute.assert_called_once_with("lp user 550e8400-e29b-41d4-a716-446655440000 parent add vip")


@pytest.mark.asyncio
async def test_rcon_remove_rank_success():
    """Test successful rank removal via RCON."""
    rcon = RCONService("localhost", 25575, "password")
    
    with patch.object(rcon, '_execute_command', new_callable=AsyncMock) as mock_execute:
        mock_execute.return_value = "User testuser removed from group vip"
        
        await rcon.remove_rank("550e8400-e29b-41d4-a716-446655440000", "vip")
        
        mock_execute.assert_called_once_with("lp user 550e8400-e29b-41d4-a716-446655440000 parent remove vip")


@pytest.mark.asyncio
async def test_rcon_connection_failure():
    """Test RCON connection failure handling."""
    rcon = RCONService("invalid-host", 25575, "password")
    
    with patch('asyncio.open_connection', side_effect=ConnectionRefusedError()):
        with pytest.raises(Exception):
            await rcon._execute_command("test command")


@pytest.mark.asyncio
async def test_rcon_authentication_failure():
    """Test RCON authentication failure."""
    rcon = RCONService("localhost", 25575, "wrong-password")
    
    mock_reader = AsyncMock()
    mock_writer = AsyncMock()
    
    # Mock failed auth response
    with patch('asyncio.open_connection', return_value=(mock_reader, mock_writer)):
        with patch.object(rcon, '_read_packet', return_value={'id': -1, 'type': 2, 'payload': ''}):
            with pytest.raises(Exception, match="authentication failed"):
                await rcon._execute_command("test command")