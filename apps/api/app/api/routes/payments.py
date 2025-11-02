"""Payment processing endpoints."""

from __future__ import annotations

import uuid

from redis import asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db_session, get_settings_dependency
from app.core.config import Settings
from app.db.models import PaymentRequest, RankProduct
from app.schemas.payment import PaymentRequestRead, PaymentSubmitRequest, RankProductRead
from app.services.payment import PaymentService

router = APIRouter()


async def get_redis(settings: Settings = Depends(get_settings_dependency)):
    """Yield a Redis connection for payment operations."""
    redis = aioredis.from_url(settings.redis_url)
    try:
        yield redis
    finally:
        await redis.close()


@router.get("/products", response_model=list[RankProductRead])
async def list_rank_products(session: AsyncSession = Depends(get_db_session)) -> list[RankProduct]:
    """List available rank products."""
    stmt = select(RankProduct).where(RankProduct.is_active.is_(True)).order_by(RankProduct.price_bdt)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/bkash/submit", response_model=PaymentRequestRead, status_code=status.HTTP_201_CREATED)
async def submit_bkash_payment(
    payment_data: PaymentSubmitRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    redis: aioredis.Redis = Depends(get_redis),
) -> PaymentRequest:
    """Submit a bKash payment request."""
    client_ip = request.client.host if request.client else None

    payment_service = PaymentService(session, redis)
    payment_request = await payment_service.submit_payment(
        rank_code=payment_data.rank_code,
        mc_username=payment_data.mc_username,
        bkash_txid=payment_data.bkash_txid,
        amount_bdt=payment_data.amount_bdt,
        screenshot_url=payment_data.screenshot_url,
        client_ip=client_ip,
    )

    return payment_request


@router.get("/payments/requests/{payment_id}", response_model=PaymentRequestRead)
async def get_payment_request(
    payment_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> PaymentRequest:
    stmt = (
        select(PaymentRequest)
        .options(selectinload(PaymentRequest.rank_product))
        .where(PaymentRequest.id == payment_id)
    )
    result = await session.execute(stmt)
    payment = result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment request not found")
    return payment
