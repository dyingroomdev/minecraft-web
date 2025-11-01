import pytest
import asyncio
from unittest.mock import MagicMock

from app.middleware.security import RateLimitMiddleware


@pytest.mark.asyncio
async def test_rate_limit_allows_normal_requests():
    """Test rate limiter allows normal request volume."""
    middleware = RateLimitMiddleware(requests_per_minute=10)
    
    mock_request = MagicMock()
    mock_request.client.host = "127.0.0.1"
    
    async def mock_call_next(request):
        return MagicMock()
    
    # Should allow first few requests
    for _ in range(5):
        response = await middleware(mock_request, mock_call_next)
        assert response is not None


@pytest.mark.asyncio
async def test_rate_limit_blocks_excessive_requests():
    """Test rate limiter blocks excessive requests."""
    middleware = RateLimitMiddleware(requests_per_minute=3)
    
    mock_request = MagicMock()
    mock_request.client.host = "127.0.0.1"
    
    async def mock_call_next(request):
        return MagicMock()
    
    # First 3 requests should succeed
    for _ in range(3):
        await middleware(mock_request, mock_call_next)
    
    # 4th request should be rate limited
    with pytest.raises(Exception) as exc_info:
        await middleware(mock_request, mock_call_next)
    
    assert "Rate limit exceeded" in str(exc_info.value)


@pytest.mark.asyncio
async def test_rate_limit_per_ip():
    """Test rate limiter works per IP address."""
    middleware = RateLimitMiddleware(requests_per_minute=2)
    
    mock_request1 = MagicMock()
    mock_request1.client.host = "127.0.0.1"
    
    mock_request2 = MagicMock()
    mock_request2.client.host = "192.168.1.1"
    
    async def mock_call_next(request):
        return MagicMock()
    
    # Each IP should have its own limit
    for _ in range(2):
        await middleware(mock_request1, mock_call_next)
        await middleware(mock_request2, mock_call_next)
    
    # Both IPs should now be at limit
    with pytest.raises(Exception):
        await middleware(mock_request1, mock_call_next)
    
    with pytest.raises(Exception):
        await middleware(mock_request2, mock_call_next)