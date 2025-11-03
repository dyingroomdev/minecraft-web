"""Server status service using mcsrvstat.us API."""

import asyncio
import httpx
import json
from datetime import datetime, timezone
from typing import Any

MCSRV_TIMEOUT = 4.0
HEADERS = {"User-Agent": "AmzCraft/StatusPoller (+amzcraft.xyz)"}


def _motd_from(v: dict | None) -> str | None:
    """Extract MOTD from mcsrvstat response."""
    if not v:
        return None
    # mcsrvstat.us returns MOTD as {raw:[], clean:[], html:[]}
    lines = v.get("clean") or v.get("raw") or []
    return " ".join(lines).strip() or None


async def fetch_mcsrv_java(client: httpx.AsyncClient, host: str, base_url: str) -> dict:
    """Fetch Java server status from mcsrvstat.us."""
    r = await client.get(f"{base_url}/3/{host}", timeout=MCSRV_TIMEOUT, headers=HEADERS)
    r.raise_for_status()
    return r.json()


async def fetch_mcsrv_bedrock(client: httpx.AsyncClient, host: str, base_url: str) -> dict:
    """Fetch Bedrock server status from mcsrvstat.us."""
    r = await client.get(f"{base_url}/bedrock/3/{host}", timeout=MCSRV_TIMEOUT, headers=HEADERS)
    r.raise_for_status()
    return r.json()


async def build_snapshot(java_host: str, bedrock_host: str, base_url: str = "https://api.mcsrvstat.us") -> dict[str, Any]:
    """Build server status snapshot from mcsrvstat.us data."""
    async with httpx.AsyncClient() as client:
        j_task = fetch_mcsrv_java(client, java_host, base_url)
        b_task = fetch_mcsrv_bedrock(client, bedrock_host, base_url)
        j, b = await asyncio.gather(j_task, b_task, return_exceptions=True)

    # Defaults
    online = False
    players = 0
    motd = None
    version = None

    if isinstance(j, dict) and j.get("online"):
        online = True
        players = max(players, j.get("players", {}).get("online", 0) or 0)
        motd = _motd_from(j.get("motd")) or motd
        version = j.get("version") or version

    if isinstance(b, dict) and b.get("online"):
        online = True
        players = max(players, b.get("players", {}).get("online", 0) or 0)
        motd = _motd_from(b.get("motd")) or motd
        version = b.get("version") or version

    now = datetime.now(timezone.utc)
    return {
        "online": online,
        "player_count": players,
        "motd": motd,
        "version": version,
        "java_ip": java_host,
        "bedrock_ip": bedrock_host,
        "last_poll_utc": now.isoformat(),
    }