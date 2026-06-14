import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from app.core.enums import RBACRole
from app.db.models import RankProduct, User
from app.db.session import SessionFactory
from app.services.auth import AuthService


@pytest.mark.asyncio
async def test_submit_payment_success(client, settings_override):
    """Test successful payment submission."""
    async with SessionFactory() as session:
        # Create rank product
        rank_product = RankProduct(
            rank_code="vip",
            display_name="VIP Rank",
            price_bdt=Decimal("500.00"),
            duration_days=30,
            lp_group="vip",
            stack_mode="SET",
            is_active=True,
        )
        session.add(rank_product)
        await session.commit()

    response = await client.post(
        "/api/payments/bkash/submit",
        json={
            "rank_code": "vip",
            "mc_username": "testplayer",
            "bkash_txid": "TXN123456789",
            "amount_bdt": "500.00",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["bkash_txid"] == "TXN123456789"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_submit_payment_duplicate_txid(client, settings_override):
    """Test duplicate transaction ID rejection."""
    async with SessionFactory() as session:
        rank_product = RankProduct(
            rank_code="vip",
            display_name="VIP Rank",
            price_bdt=Decimal("500.00"),
            lp_group="vip",
            stack_mode="SET",
            is_active=True,
        )
        session.add(rank_product)
        await session.commit()

    # First submission
    await client.post(
        "/api/payments/bkash/submit",
        json={
            "rank_code": "vip",
            "mc_username": "testplayer",
            "bkash_txid": "TXN123456789",
            "amount_bdt": "500.00",
        },
    )

    # Duplicate submission
    response = await client.post(
        "/api/payments/bkash/submit",
        json={
            "rank_code": "vip",
            "mc_username": "testplayer2",
            "bkash_txid": "TXN123456789",
            "amount_bdt": "500.00",
        },
    )

    assert response.status_code == 409
    assert "already used" in response.json()["detail"]


@pytest.mark.asyncio
async def test_approve_payment_requires_admin(client, settings_override):
    """Test payment approval requires admin role."""
    async with SessionFactory() as session:
        user = User(
            discord_id="123",
            username="Player",
            email="player@example.com",
            roles=[RBACRole.PLAYER.value],
        )
        session.add(user)
        await session.flush()

        auth_service = AuthService(session=session, settings=settings_override)
        bundle = await auth_service.issue_tokens(user=user)
        await session.commit()

    headers = {
        "Authorization": f"Bearer {bundle.access_token}",
        "Idempotency-Key": "test-key-123",
    }
    
    response = await client.post(
        "/admin/payments/550e8400-e29b-41d4-a716-446655440000/approve",
        headers=headers,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_payment_price_tolerance(client, settings_override):
    """Test payment price tolerance validation."""
    async with SessionFactory() as session:
        rank_product = RankProduct(
            rank_code="vip",
            display_name="VIP Rank",
            price_bdt=Decimal("500.00"),
            lp_group="vip",
            stack_mode="SET",
            is_active=True,
        )
        session.add(rank_product)
        await session.commit()

    # Amount too low (more than 5% below)
    response = await client.post(
        "/api/payments/bkash/submit",
        json={
            "rank_code": "vip",
            "mc_username": "testplayer",
            "bkash_txid": "TXN123456789",
            "amount_bdt": "450.00",  # 10% below
        },
    )

    assert response.status_code == 400
    assert "within 5%" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_payment_request_endpoint(client, settings_override):
    async with SessionFactory() as session:
        rank_product = RankProduct(
            rank_code="vip",
            display_name="VIP Rank",
            price_bdt=Decimal("500.00"),
            lp_group="vip",
            stack_mode="SET",
            is_active=True,
        )
        session.add(rank_product)
        await session.flush()

        payment_request = PaymentRequest(
            rank_product_id=rank_product.id,
            mc_username="testplayer",
            bkash_txid="TXN-LOOKUP",
            amount_bdt=Decimal("500.00"),
            status="pending",
        )
        session.add(payment_request)
        await session.commit()

    response = await client.get(f"/api/payments/requests/{payment_request.id}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(payment_request.id)
    assert payload["rank_product"]["rank_code"] == "vip"
