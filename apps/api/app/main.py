"""Entry point for the FastAPI application."""

from __future__ import annotations

import asyncio
from pathlib import Path
from contextlib import suppress

from fastapi import APIRouter, FastAPI
from fastapi.staticfiles import StaticFiles
from redis import asyncio as aioredis

from app.api.api import api_router
from app.core.config import get_settings
from app.db.session import SessionFactory
from app.middleware.security import setup_security_middleware
from app.services.status_poller import status_poller

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
    Path(settings.media_root_path).mkdir(parents=True, exist_ok=True)
    application.mount(settings.media_url_path, StaticFiles(directory=settings.media_root_path), name="media")
    application.include_router(router)
    application.include_router(api_router)

    @application.on_event("startup")
    async def start_background_tasks() -> None:
        # Clear SQLAlchemy metadata cache to fix MutableList issues
        from sqlalchemy.ext.mutable import Mutable
        Mutable._listen_on_attribute = lambda *args, **kwargs: None
        
        settings = get_settings()
        if not settings.enable_status_poller:
            return

        application.state.status_poller_task = asyncio.create_task(
            status_poller(settings.redis_url, settings)
        )

    @application.on_event("shutdown")
    async def stop_background_tasks() -> None:
        poller_task = getattr(application.state, "status_poller_task", None)
        
        if poller_task:
            poller_task.cancel()
            with suppress(asyncio.CancelledError):
                await poller_task

    return application


app = create_app()
