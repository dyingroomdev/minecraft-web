"""Background status poller for mcsrvstat.us integration."""

import asyncio
import json
from app.services.status_service import build_snapshot
from app.core.config import Settings
import redis.asyncio as aioredis

STATUS_KEY = "amz:status:snapshot"
STATUS_CH = "amz:status:channel"


async def status_poller(redis_url: str, settings: Settings) -> None:
    """Background task to poll server status and broadcast updates."""
    r = aioredis.from_url(redis_url)
    
    try:
        while True:
            try:
                snap = await build_snapshot(
                    settings.mc_java_host, 
                    settings.mc_bedrock_host, 
                    settings.mcsrv_base
                )
                await r.setex(STATUS_KEY, settings.status_ttl_seconds, json.dumps(snap))
                await r.publish(STATUS_CH, json.dumps({"type": "server_status", "payload": snap}))
            except Exception:
                # Continue polling on errors
                pass
            
            await asyncio.sleep(settings.status_ttl_seconds)
    finally:
        await r.close()