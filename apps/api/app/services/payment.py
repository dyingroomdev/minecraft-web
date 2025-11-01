"""Payment processing services."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

import aioredis
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PaymentRequest, Player, RankProduct


class PaymentService:
    """Service for payment processing and validation."""
    
    def __init__(self, session: AsyncSession, redis: aioredis.Redis):
        self.session = session
        self.redis = redis
    
    async def submit_payment(
        self,
        rank_code: str,
        mc_username: str,
        bkash_txid: str,
        amount_bdt: Decimal,
        screenshot_url: str | None = None,
        client_ip: str | None = None,
    ) -> PaymentRequest:
        """Submit a new payment request with validation."""
        
        # Rate limiting
        if client_ip:
            await self._check_rate_limit(client_ip)
        
        # Validate rank product exists and is active
        rank_product = await self._get_rank_product(rank_code)
        if not rank_product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rank not found")
        
        if not rank_product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rank not available")
        
        # Price tolerance check (±5%)
        expected_price = rank_product.price_bdt
        tolerance = expected_price * Decimal("0.05")
        if not (expected_price - tolerance <= amount_bdt <= expected_price + tolerance):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount must be within 5% of {expected_price} BDT"
            )
        
        # Check for duplicate transaction ID
        existing = await self._check_duplicate_txid(bkash_txid)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Transaction ID already used")
        
        # Resolve Minecraft UUID
        mc_uuid = await self._resolve_minecraft_uuid(mc_username)
        
        # Create payment request
        payment_request = PaymentRequest(
            rank_product_id=rank_product.id,
            mc_username=mc_username,
            mc_uuid=mc_uuid,
            bkash_txid=bkash_txid,
            amount_bdt=amount_bdt,
            screenshot_url=screenshot_url,
            status="pending",
        )
        
        self.session.add(payment_request)
        await self.session.commit()
        await self.session.refresh(payment_request)
        
        return payment_request
    
    async def approve_payment(
        self,
        payment_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        idempotency_key: str,
    ) -> PaymentRequest:
        """Approve a payment request with idempotency."""
        
        # Check idempotency
        cache_key = f"payment_approval:{payment_id}:{idempotency_key}"
        if await self.redis.get(cache_key):
            # Already processed, return existing result
            payment = await self._get_payment_request(payment_id)
            if not payment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
            return payment
        
        payment = await self._get_payment_request(payment_id)
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        if payment.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment already processed")
        
        payment.status = "approved"
        payment.processed_at = datetime.now(timezone.utc)
        payment.processed_by_user_id = admin_user_id
        
        await self.session.commit()
        
        # Set idempotency cache (24 hour expiry)
        await self.redis.setex(cache_key, 86400, "processed")
        
        # Queue fulfillment job
        await self.redis.lpush("fulfill_rank_queue", str(payment.id))
        
        return payment
    
    async def reject_payment(
        self,
        payment_id: uuid.UUID,
        admin_user_id: uuid.UUID,
        reason: str,
    ) -> PaymentRequest:
        """Reject a payment request."""
        
        payment = await self._get_payment_request(payment_id)
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        if payment.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment already processed")
        
        payment.status = "rejected"
        payment.rejection_reason = reason
        payment.processed_at = datetime.now(timezone.utc)
        payment.processed_by_user_id = admin_user_id
        
        await self.session.commit()
        
        return payment
    
    async def _check_rate_limit(self, client_ip: str) -> None:
        """Check rate limit for payment submissions."""
        key = f"payment_rate_limit:{client_ip}"
        current = await self.redis.get(key)
        
        if current and int(current) >= 3:  # 3 requests per hour
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many payment requests. Try again later."
            )
        
        # Increment counter with 1 hour expiry
        await self.redis.incr(key)
        await self.redis.expire(key, 3600)
    
    async def _get_rank_product(self, rank_code: str) -> RankProduct | None:
        """Get rank product by code."""
        stmt = select(RankProduct).where(RankProduct.rank_code == rank_code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def _check_duplicate_txid(self, bkash_txid: str) -> PaymentRequest | None:
        """Check for duplicate transaction ID."""
        stmt = select(PaymentRequest).where(PaymentRequest.bkash_txid == bkash_txid)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def _resolve_minecraft_uuid(self, username: str) -> uuid.UUID | None:
        """Resolve Minecraft UUID from username."""
        stmt = select(Player).where(Player.username == username)
        result = await self.session.execute(stmt)
        player = result.scalar_one_or_none()
        return player.minecraft_uuid if player else None
    
    async def _get_payment_request(self, payment_id: uuid.UUID) -> PaymentRequest | None:
        """Get payment request by ID."""
        stmt = select(PaymentRequest).where(PaymentRequest.id == payment_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()