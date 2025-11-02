"""Entry point for the FastAPI application."""

from __future__ import annotations

import asyncio
from contextlib import suppress

from fastapi import APIRouter, FastAPI
from redis import asyncio as aioredis

from app.api.api import api_router
from app.core.config import get_settings
from app.db.session import SessionFactory
from app.middleware.security import setup_security_middleware
from app.services.minecraft import ServerStatusPoller

router = APIRouter()


@router.get("/health", tags=["health"], summary="Service health check")
async def health() -> dict[str, str]:
    """Return a simple readiness probe payload."""
    return {"status": "ok"}


def create_app() -> FastAPI:
    """Create and configure a FastAPI application instance."""
    application = FastAPI(title="AMZCraft API")
    settings = get_settings()
    setup_security_middleware(application, settings)
    application.include_router(router)
    application.include_router(api_router)

    @application.on_event("startup")
    async def start_background_tasks() -> None:
        settings = get_settings()
        if not settings.enable_status_poller:
            return

        redis_client = aioredis.from_url(settings.redis_url)
        poller = ServerStatusPoller(
            settings=settings,
            session_factory=SessionFactory,
            redis=redis_client,
        )

        application.state.redis_client = redis_client
        application.state.status_poller = poller
        application.state.status_poller_task = asyncio.create_task(poller.run())

    @application.on_event("shutdown")
    async def stop_background_tasks() -> None:
        poller_task = getattr(application.state, "status_poller_task", None)
        poller: ServerStatusPoller | None = getattr(application.state, "status_poller", None)
        redis_client: aioredis.Redis | None = getattr(application.state, "redis_client", None)

        if poller:
            await poller.stop()

        if poller_task:
            with suppress(asyncio.CancelledError):
                await poller_task

        if redis_client:
            await redis_client.close()

    return application


app = create_app()
