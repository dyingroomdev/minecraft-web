"""Stub job for nightly Discord role synchronization."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import structlog

logger = structlog.get_logger()


async def sync_discord_roles() -> None:
    """Placeholder implementation that will map Discord guild roles to RBAC roles."""

    start = datetime.now(timezone.utc)
    logger.info("worker.discord_role_sync.start", started_at=start.isoformat())
    await asyncio.sleep(0.1)
    logger.info(
        "worker.discord_role_sync.complete",
        finished_at=datetime.now(timezone.utc).isoformat(),
        note="stub implementation",
    )
