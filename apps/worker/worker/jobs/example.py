"""Example job demonstrating the asynchronous worker structure."""

from __future__ import annotations

import asyncio

import structlog

logger = structlog.get_logger()


async def example_job() -> None:
    """Simulate work handled by the worker queue."""
    logger.info("worker.job.start", job="example")
    await asyncio.sleep(0.1)
    logger.info("worker.job.complete", job="example")
