"""Payment processing endpoints."""

from __future__ import annotations

import uuid

import aioredis
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session, get_settings_dependency
from app.core.config import Settings
from app.db.models import PaymentRequest, RankProduct, User
from app.schemas.payment import (
    PaymentApprovalRequest,
    PaymentRejectionRequest,
    PaymentRequestRead,
    PaymentSubmitRequest,
    RankProductRead,
)
from app.services.payment import PaymentService

router = APIRouter()


async def get_redis(settings: Settings = Depends(get_settings_dependency)) -> aioredis.Redis:
    """Get Redis connection."""
    return aioredis.from_url(settings.redis_url)


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


@router.get("/admin/payments", response_model=list[PaymentRequestRead])
async def list_payments(
    status_filter: str = "pending",
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> list[PaymentRequest]:
    """List payment requests by status."""
    stmt = (
        select(PaymentRequest)
        .where(PaymentRequest.status == status_filter)
        .order_by(PaymentRequest.created_at.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/admin/payments/{payment_id}/approve", response_model=PaymentRequestRead)
async def approve_payment(
    payment_id: uuid.UUID,
    approval_data: PaymentApprovalRequest,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    session: AsyncSession = Depends(get_db_session),
    redis: aioredis.Redis = Depends(get_redis),
    admin_user: User = Depends(get_admin_user),
) -> PaymentRequest:
    """Approve a payment request."""
    if not idempotency_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Idempotency-Key header required")
    
    payment_service = PaymentService(session, redis)
    return await payment_service.approve_payment(payment_id, admin_user.id, idempotency_key)


@router.post("/admin/payments/{payment_id}/reject", response_model=PaymentRequestRead)
async def reject_payment(
    payment_id: uuid.UUID,
    rejection_data: PaymentRejectionRequest,
    session: AsyncSession = Depends(get_db_session),
    redis: aioredis.Redis = Depends(get_redis),
    admin_user: User = Depends(get_admin_user),
) -> PaymentRequest:
    """Reject a payment request."""
    payment_service = PaymentService(session, redis)
    return await payment_service.reject_payment(payment_id, admin_user.id, rejection_data.reason)