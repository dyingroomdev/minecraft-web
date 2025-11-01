"""Entry point for the FastAPI application."""

from fastapi import APIRouter, FastAPI

from app.api.api import api_router
from app.middleware.security import setup_security_middleware

router = APIRouter()


@router.get("/health", tags=["health"], summary="Service health check")
async def health() -> dict[str, str]:
    """Return a simple readiness probe payload."""
    return {"status": "ok"}


def create_app() -> FastAPI:
    """Create and configure a FastAPI application instance."""
    application = FastAPI(title="AMZCraft API")
    setup_security_middleware(application)
    application.include_router(router)
    application.include_router(api_router)
    return application


app = create_app()
