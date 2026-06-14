import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch
import uuid

from worker.jobs.fulfill_rank import expire_ranks
from worker.models import Entitlement


@pytest.mark.asyncio
async def test_expire_ranks_success():
    """Test successful rank expiry job."""
    # Mock expired entitlement
    expired_entitlement = Entitlement(
        id=uuid.uuid4(),
        payment_request_id=uuid.uuid4(),
        mc_uuid=uuid.uuid4(),
        mc_username="testplayer",
        rank_code="vip",
        lp_group="vip",
        stack_mode="SET",
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        is_active=True,
        revoked_at=None,
    )
    
    mock_session = AsyncMock()
    mock_result = AsyncMock()
    mock_result.scalars.return_value.all.return_value = [expired_entitlement]
    mock_session.execute.return_value = mock_result
    
    mock_rcon = AsyncMock()
    
    with patch('worker.jobs.fulfill_rank.get_worker_session') as mock_get_session:
        with patch('worker.jobs.fulfill_rank.RCONService') as mock_rcon_class:
            mock_get_session.return_value.__aenter__.return_value = mock_session
            mock_rcon_class.return_value = mock_rcon
            
            await expire_ranks()
            
            # Verify RCON call
            mock_rcon.remove_rank.assert_called_once_with(
                str(expired_entitlement.mc_uuid), 
                "vip"
            )
            
            # Verify entitlement marked as revoked
            assert not expired_entitlement.is_active
            assert expired_entitlement.revoked_at is not None
            
            mock_session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_expire_ranks_no_expired():
    """Test expiry job with no expired entitlements."""
    mock_session = AsyncMock()
    mock_result = AsyncMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_session.execute.return_value = mock_result
    
    with patch('worker.jobs.fulfill_rank.get_worker_session') as mock_get_session:
        mock_get_session.return_value.__aenter__.return_value = mock_session
        
        await expire_ranks()
        
        # Should not attempt any RCON operations
        mock_session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_expire_ranks_rcon_failure():
    """Test expiry job handles RCON failures gracefully."""
    expired_entitlement = Entitlement(
        id=uuid.uuid4(),
        payment_request_id=uuid.uuid4(),
        mc_uuid=uuid.uuid4(),
        mc_username="testplayer",
        rank_code="vip",
        lp_group="vip",
        stack_mode="SET",
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        is_active=True,
        revoked_at=None,
    )
    
    mock_session = AsyncMock()
    mock_result = AsyncMock()
    mock_result.scalars.return_value.all.return_value = [expired_entitlement]
    mock_session.execute.return_value = mock_result
    
    mock_rcon = AsyncMock()
    mock_rcon.remove_rank.side_effect = Exception("RCON connection failed")
    
    with patch('worker.jobs.fulfill_rank.get_worker_session') as mock_get_session:
        with patch('worker.jobs.fulfill_rank.RCONService') as mock_rcon_class:
            mock_get_session.return_value.__aenter__.return_value = mock_session
            mock_rcon_class.return_value = mock_rcon
            
            await expire_ranks()
            
            # Should still commit (partial success)
            mock_session.commit.assert_called_once()
            
            # Entitlement should not be marked as revoked due to RCON failure
            assert expired_entitlement.is_active
            assert expired_entitlement.revoked_at is None
