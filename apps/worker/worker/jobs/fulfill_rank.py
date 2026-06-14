"""Rank fulfillment worker job."""

from __future__ import annotations

import asyncio
import inspect
import json
import uuid
from datetime import datetime, timedelta, timezone
import hashlib

from redis import asyncio as aioredis
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

        identifier_uuid = payment.mc_uuid
        if identifier_uuid is None:
            identifier_uuid = _offline_uuid(payment.mc_username)
            payment.mc_uuid = identifier_uuid
            await session.commit()

        target_group = payment.rank_product.lp_group
        if not target_group:
            logger.error("fulfill_rank.missing_lp_group", payment_id=str(payment_request_id))
            return

        command_log: list[str] = []

        try:
            # Grant rank via RCON
            settings = get_worker_settings()
            rcon = RCONService(
                host=settings.minecraft_rcon_host,
                port=settings.minecraft_rcon_port,
                password=settings.minecraft_rcon_password,
            )

            if payment.rank_product.stack_mode == "SET":
                lower_tiers = (payment.rank_product.meta_data or {}).get("lower_tiers", [])
                for group in lower_tiers:
                    response = await rcon.remove_rank(str(identifier_uuid), group)
                    command_log.append(f"lp user {identifier_uuid} parent remove {group}: {response}")

            response = await rcon.grant_rank(
                str(identifier_uuid),
                target_group,
                duration_days=payment.rank_product.duration_days,
            )
            grant_command = (
                f"lp user {identifier_uuid} parent addtemp {target_group} {payment.rank_product.duration_days}d"
                if payment.rank_product.duration_days
                else f"lp user {identifier_uuid} parent add {target_group}"
            )
            command_log.append(f"{grant_command}: {response}")

            # Create entitlement record
            expires_at = None
            if payment.rank_product.duration_days:
                expires_at = datetime.now(timezone.utc) + timedelta(days=payment.rank_product.duration_days)
            
            entitlement = Entitlement(
                payment_request_id=payment.id,
                mc_uuid=payment.mc_uuid,
                mc_username=payment.mc_username,
                rank_code=payment.rank_product.rank_code,
                luckperms_group=target_group,
                expires_at=expires_at,
            )
            
            session.add(entitlement)
            
            # Mark payment as fulfilled
            now = datetime.now(timezone.utc)
            payment.status = "fulfilled"
            payment.fulfillment_status = "success"
            payment.fulfilled_at = now
            payment.fulfillment_log = "\n".join(command_log)
            
            await session.commit()
            
            # Send Discord notification
            await send_discord_notification(payment)
            
            logger.info("fulfill_rank.success", payment_id=str(payment_request_id))
            
        except Exception as e:
            logger.error("fulfill_rank.failed", payment_id=str(payment_request_id), error=str(e))
            now = datetime.now(timezone.utc)
            payment.status = "failed"
            payment.fulfillment_status = "failed"
            payment.fulfilled_at = now
            log = command_log + [f"ERROR: {e}"]
            payment.fulfillment_log = "\n".join(log)
            await session.commit()
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
        scalars = result.scalars()
        if inspect.isawaitable(scalars):
            scalars = await scalars
        expired_entitlements = scalars.all()
        if inspect.isawaitable(expired_entitlements):
            expired_entitlements = await expired_entitlements
        
        if not expired_entitlements:
            logger.info("expire_ranks.none_found")
            await session.commit()
            return
        
        settings = get_worker_settings()
        rcon = RCONService(
            host=settings.minecraft_rcon_host,
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


def _offline_uuid(username: str) -> uuid.UUID:
    """Generate offline-mode UUID using Mojang's algorithm."""

    namespace = f"OfflinePlayer:{username}".encode("utf-8")
    digest = hashlib.md5(namespace).digest()
    data = bytearray(digest)
    data[6] &= 0x0F
    data[6] |= 0x30
    data[8] &= 0x3F
    data[8] |= 0x80
    return uuid.UUID(bytes=bytes(data))
