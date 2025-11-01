"""Rank fulfillment worker job."""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone

import aioredis
import structlog
from sqlalchemy import select

from worker.config import get_worker_settings
from worker.database import get_worker_session
from worker.models import Entitlement, PaymentRequest, RankProduct
from worker.services import RCONService

logger = structlog.get_logger()


async def process_fulfill_rank_queue() -> None:
    """Process rank fulfillment queue."""
    settings = get_worker_settings()
    redis = aioredis.from_url(settings.redis_url)
    
    try:
        while True:
            # Block for up to 5 seconds waiting for jobs
            result = await redis.brpop("fulfill_rank_queue", timeout=5)
            if not result:
                continue
            
            _, payment_id_bytes = result
            payment_id = payment_id_bytes.decode('utf-8')
            
            try:
                await fulfill_rank(uuid.UUID(payment_id))
            except Exception as e:
                logger.error("fulfill_rank.error", payment_id=payment_id, error=str(e))
                # Add to DLQ for manual review
                await redis.lpush("fulfill_rank_dlq", payment_id)
    
    except Exception as e:
        logger.error("fulfill_rank_queue.error", error=str(e))
    finally:
        await redis.close()


async def fulfill_rank(payment_request_id: uuid.UUID) -> None:
    """Fulfill a rank purchase."""
    logger.info("fulfill_rank.start", payment_id=str(payment_request_id))
    
    async with get_worker_session() as session:
        # Get payment request with rank product
        stmt = (
            select(PaymentRequest)
            .join(RankProduct)
            .where(PaymentRequest.id == payment_request_id)
        )
        result = await session.execute(stmt)
        payment = result.scalar_one_or_none()
        
        if not payment:
            logger.error("fulfill_rank.payment_not_found", payment_id=str(payment_request_id))
            return
        
        if payment.status != "approved":
            logger.error("fulfill_rank.invalid_status", payment_id=str(payment_request_id), status=payment.status)
            return
        
        if not payment.mc_uuid:
            logger.error("fulfill_rank.no_uuid", payment_id=str(payment_request_id))
            return
        
        try:
            # Grant rank via RCON
            settings = get_worker_settings()
            rcon = RCONService(
                host=settings.minecraft_server_host,
                port=settings.minecraft_rcon_port,
                password=settings.minecraft_rcon_password,
            )
            
            await rcon.grant_rank(str(payment.mc_uuid), payment.rank_product.luckperms_group)
            
            # Create entitlement record
            expires_at = None
            if payment.rank_product.duration_days:
                expires_at = datetime.now(timezone.utc) + timedelta(days=payment.rank_product.duration_days)
            
            entitlement = Entitlement(
                payment_request_id=payment.id,
                mc_uuid=payment.mc_uuid,
                mc_username=payment.mc_username,
                rank_code=payment.rank_product.rank_code,
                luckperms_group=payment.rank_product.luckperms_group,
                expires_at=expires_at,
            )
            
            session.add(entitlement)
            
            # Mark payment as fulfilled
            payment.status = "fulfilled"
            
            await session.commit()
            
            # Send Discord notification
            await send_discord_notification(payment)
            
            logger.info("fulfill_rank.success", payment_id=str(payment_request_id))
            
        except Exception as e:
            logger.error("fulfill_rank.failed", payment_id=str(payment_request_id), error=str(e))
            # Retry logic could be added here
            raise


async def send_discord_notification(payment: PaymentRequest) -> None:
    """Send Discord notification for fulfilled rank."""
    # Placeholder for Discord webhook notification
    logger.info("discord_notification.sent", 
                username=payment.mc_username, 
                rank=payment.rank_product.rank_code)


async def expire_ranks() -> None:
    """Nightly job to expire temporary ranks."""
    logger.info("expire_ranks.start")
    
    async with get_worker_session() as session:
        now = datetime.now(timezone.utc)
        
        # Find expired entitlements
        stmt = (
            select(Entitlement)
            .where(
                Entitlement.expires_at <= now,
                Entitlement.is_active.is_(True),
                Entitlement.revoked_at.is_(None),
            )
        )
        result = await session.execute(stmt)
        expired_entitlements = result.scalars().all()
        
        if not expired_entitlements:
            logger.info("expire_ranks.none_found")
            return
        
        settings = get_worker_settings()
        rcon = RCONService(
            host=settings.minecraft_server_host,
            port=settings.minecraft_rcon_port,
            password=settings.minecraft_rcon_password,
        )
        
        for entitlement in expired_entitlements:
            try:
                # Remove rank via RCON
                await rcon.remove_rank(str(entitlement.mc_uuid), entitlement.luckperms_group)
                
                # Mark as revoked
                entitlement.is_active = False
                entitlement.revoked_at = now
                
                logger.info("expire_ranks.revoked", 
                           username=entitlement.mc_username,
                           rank=entitlement.rank_code)
                
            except Exception as e:
                logger.error("expire_ranks.failed", 
                           entitlement_id=str(entitlement.id),
                           error=str(e))
        
        await session.commit()
        logger.info("expire_ranks.complete", count=len(expired_entitlements))