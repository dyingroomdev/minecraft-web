import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.minecraft import MinecraftQuery, ServerStatusPoller


@pytest.mark.asyncio
async def test_minecraft_query_online_server():
    """Test successful server query."""
    query = MinecraftQuery("localhost", 25565)
    
    # Mock successful connection and response
    mock_reader = AsyncMock()
    mock_writer = AsyncMock()
    
    # Mock server response
    server_data = {
        "players": {"online": 5, "max": 20, "sample": []},
        "description": {"text": "Test Server"},
        "version": {"name": "1.20.1"}
    }
    
    mock_reader.read.return_value = json.dumps(server_data).encode('utf-8')
    
    with patch('asyncio.open_connection', return_value=(mock_reader, mock_writer)):
        with patch.object(query, '_read_varint', side_effect=[50, 0, len(json.dumps(server_data))]):
            result = await query.query()
    
    assert result['status'] == 'online'
    assert result['players_online'] == 5
    assert result['players_max'] == 20
    assert result['motd'] == 'Test Server'


@pytest.mark.asyncio
async def test_minecraft_query_offline_server():
    """Test query when server is offline."""
    query = MinecraftQuery("localhost", 25565)
    
    # Mock connection timeout
    with patch('asyncio.open_connection', side_effect=asyncio.TimeoutError()):
        result = await query.query()
    
    assert result['status'] == 'offline'
    assert result['players_online'] == 0
    assert result['players_max'] == 0


@pytest.mark.asyncio
async def test_server_status_poller_backoff():
    """Test poller handles errors with backoff."""
    settings = MagicMock()
    settings.minecraft_server_host = "localhost"
    settings.minecraft_server_port = 25565
    
    session = AsyncMock()
    redis = AsyncMock()
    
    poller = ServerStatusPoller(settings, session, redis)
    
    # Mock query to raise exception
    with patch.object(poller.query, 'query', side_effect=Exception("Connection failed")):
        with patch('asyncio.sleep') as mock_sleep:
            # Start poller and let it run briefly
            task = asyncio.create_task(poller.start())
            await asyncio.sleep(0.1)  # Let it run briefly
            poller.stop()
            
            try:
                await asyncio.wait_for(task, timeout=1.0)
            except asyncio.TimeoutError:
                task.cancel()
            
            # Verify backoff sleep was called
            mock_sleep.assert_called()


@pytest.mark.asyncio
async def test_server_status_poller_success():
    """Test successful polling and Redis publishing."""
    settings = MagicMock()
    settings.minecraft_server_host = "localhost"
    settings.minecraft_server_port = 25565
    
    session = AsyncMock()
    redis = AsyncMock()
    
    poller = ServerStatusPoller(settings, session, redis)
    
    # Mock successful query
    mock_status = {
        'status': 'online',
        'players_online': 10,
        'players_max': 20,
        'motd': 'Test Server',
        'version': '1.20.1',
        'sample': [],
        'ping': 50
    }
    
    with patch.object(poller.query, 'query', return_value=mock_status):
        await poller._poll_and_update()
    
    # Verify database update
    session.add.assert_called_once()
    session.commit.assert_called_once()
    
    # Verify Redis publish
    redis.publish.assert_called_once()
    call_args = redis.publish.call_args
    assert call_args[0][0] == 'minecraft:status'
    
    message = json.loads(call_args[0][1])
    assert message['type'] == 'server_status'
    assert message['data']['status'] == 'online'
    assert message['data']['players_online'] == 10