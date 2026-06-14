"""Background status poller for mcsrvstat.us integration."""

import asyncio
import json
from datetime import datetime, timezone

from app.services.status_service import build_snapshot
from app.services.luckperms import LuckPermsService
from app.core.config import Settings
import redis.asyncio as aioredis

STATUS_KEY = "amz:status:snapshot"
STATUS_CH = "amz:status:channel"
ACTIVITY_KEY = "amz:minecraft:activity"
ACTIVITY_TTL_SECONDS = 86400


def _parse_online_players(output: str) -> set[str]:
    """Parse the player names returned by the Minecraft `list` command."""

    _, separator, names = output.partition(":")
    if not separator or not names.strip():
        return set()
    return {name.strip() for name in names.split(",") if name.strip()}


async def _record_activity(
    redis: aioredis.Redis,
    *,
    event_type: str,
    player: str,
) -> None:
    event = {
        "type": event_type,
        "player": player,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    }
    encoded = json.dumps(event)
    await redis.lpush(ACTIVITY_KEY, encoded)
    await redis.ltrim(ACTIVITY_KEY, 0, 19)
    await redis.expire(ACTIVITY_KEY, ACTIVITY_TTL_SECONDS)
    await redis.publish(STATUS_CH, json.dumps({"type": "minecraft_activity", "payload": event}))


async def status_poller(redis_url: str, settings: Settings) -> None:
    """Background task to poll server status and broadcast updates."""
    r = aioredis.from_url(redis_url)
    previous_players: set[str] | None = None
    rcon = LuckPermsService(
        settings.minecraft_rcon_host,
        settings.minecraft_rcon_port,
        settings.minecraft_rcon_password,
    )

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

            try:
                current_players = _parse_online_players(await rcon._execute("list"))
                if previous_players is not None:
                    for player in sorted(current_players - previous_players):
                        await _record_activity(r, event_type="join", player=player)
                    for player in sorted(previous_players - current_players):
                        await _record_activity(r, event_type="leave", player=player)
                previous_players = current_players
            except Exception:
                # Keep the last successful snapshot so a temporary RCON outage does
                # not make every connected player appear to leave.
                pass

            await asyncio.sleep(settings.status_ttl_seconds)
    finally:
        await r.close()
