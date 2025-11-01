import pytest
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock

from app.core.enums import RBACRole
from app.db.models import PaymentRequest, RankProduct, User
from app.db.session import SessionFactory
from app.services.auth import AuthService


@pytest.mark.asyncio
async def test_approve_payment_idempotency(client, settings_override):
    """Test payment approval idempotency prevents double processing."""
    async with SessionFactory() as session:
        # Create admin user
        admin_user = User(
            discord_id="456",
            username="Admin",
            email="admin@example.com",
            roles=[RBACRole.ADMIN.value],
        )
        session.add(admin_user)
        
        # Create rank product
        rank_product = RankProduct(
            rank_code="vip",
            display_name="VIP Rank",
            price_bdt=Decimal("500.00"),
            luckperms_group="vip",
            is_active=True,
        )
        session.add(rank_product)
        
        # Create payment request
        payment_request = PaymentRequest(
            rank_product_id=rank_product.id,
            mc_username="testplayer",
            bkash_txid="TXN123456789",
            amount_bdt=Decimal("500.00"),
            status="pending",
        )
        session.add(payment_request)
        await session.flush()
        
        auth_service = AuthService(session=session, settings=settings_override)
        bundle = await auth_service.issue_tokens(user=admin_user)
        await session.commit()

    headers = {
        "Authorization": f"Bearer {bundle.access_token}",
        "Idempotency-Key": "test-key-123",
    }
    
    # First approval
    response1 = await client.post(
        f"/admin/payments/{payment_request.id}/approve",
        headers=headers,
    )
    assert response1.status_code == 200
    
    # Second approval with same idempotency key
    response2 = await client.post(
        f"/admin/payments/{payment_request.id}/approve",
        headers=headers,
    )
    assert response2.status_code == 200
    assert response1.json()["id"] == response2.json()["id"]


@pytest.mark.asyncio
async def test_approve_payment_missing_idempotency_key(client, settings_override):
    """Test payment approval requires idempotency key."""
    async with SessionFactory() as session:
        admin_user = User(
            discord_id="456",
            username="Admin",
            email="admin@example.com",
            roles=[RBACRole.ADMIN.value],
        )
        session.add(admin_user)
        await session.flush()
        
        auth_service = AuthService(session=session, settings=settings_override)
        bundle = await auth_service.issue_tokens(user=admin_user)
        await session.commit()

    headers = {"Authorization": f"Bearer {bundle.access_token}"}
    
    response = await client.post(
        f"/admin/payments/{uuid.uuid4()}/approve",
        headers=headers,
    )
    assert response.status_code == 400
    assert "Idempotency-Key" in response.json()["detail"]