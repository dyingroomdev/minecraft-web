"""Worker entry point and orchestrator."""

from __future__ import annotations

import asyncio
import signal
from contextlib import suppress
from datetime import datetime, timedelta, timezone

import structlog

from worker.jobs import example_job, sync_discord_roles
from worker.jobs.minecraft_poller import start_minecraft_poller
from worker.jobs.fulfill_rank import process_fulfill_rank_queue, expire_ranks
from worker.config import get_worker_settings

logger = structlog.get_logger()

ROLE_SYNC_INTERVAL = timedelta(hours=24)


async def run_worker(stop_event: asyncio.Event) -> None:
    """Continuously run background jobs until a shutdown signal is received."""
    logger.info("worker.startup")
    settings = get_worker_settings()
    next_role_sync = datetime.now(timezone.utc)
    
    # Start background tasks
    background_tasks: list[asyncio.Task[None]] = []
    if settings.enable_background_queues:
        background_tasks = [
            asyncio.create_task(start_minecraft_poller()),
            asyncio.create_task(process_fulfill_rank_queue()),
        ]
    
    try:
        while not stop_event.is_set():
            await example_job()

            current_time = datetime.now(timezone.utc)
            if settings.enable_maintenance_jobs and current_time >= next_role_sync:
                try:
                    await sync_discord_roles()
                    await expire_ranks()  # Run nightly with role sync
                except Exception as exc:
                    logger.error("worker.maintenance_failed", error=str(exc))
                next_role_sync = current_time + ROLE_SYNC_INTERVAL

            try:
                await asyncio.wait_for(stop_event.wait(), timeout=5)
            except asyncio.TimeoutError:
                continue
    finally:
        for task in background_tasks:
            task.cancel()
        for task in background_tasks:
            with suppress(asyncio.CancelledError):
                await task
        logger.info("worker.shutdown")


def _install_signal_handlers(stop_event: asyncio.Event) -> None:
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        with suppress(NotImplementedError):
            loop.add_signal_handler(sig, stop_event.set)


async def _serve() -> None:
    stop_event = asyncio.Event()
    _install_signal_handlers(stop_event)
    await run_worker(stop_event)


def main() -> None:
    """Entrypoint used by the Docker container."""
    asyncio.run(_serve())


if __name__ == "__main__":
    main()
