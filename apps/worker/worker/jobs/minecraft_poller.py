"""Minecraft server status polling job."""

from __future__ import annotations

import asyncio

from redis import asyncio as aioredis
import structlog

from worker.config import get_worker_settings
from worker.database import get_worker_session
from worker.services import MinecraftQuery, ServerStatusPoller

logger = structlog.get_logger()


async def start_minecraft_poller() -> None:
    """Start the Minecraft server status poller."""
    settings = get_worker_settings()
    redis = aioredis.from_url(settings.redis_url)
    
    try:
        async with get_worker_session() as session:
            poller = ServerStatusPoller(settings, session, redis)
            logger.info("minecraft_poller.started")
            await poller.start()
    except Exception as e:
        logger.error("minecraft_poller.error", error=str(e))
    finally:
        await redis.close()
        logger.info("minecraft_poller.stopped")
