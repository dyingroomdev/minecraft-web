"""Database engine and session utilities."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


def _create_engine() -> AsyncEngine:
    settings = get_settings()
    url = settings.database_url
    if url.startswith(("postgresql://", "postgres://")):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1).replace(
            "postgresql://", "postgresql+asyncpg://", 1
        )
    return create_async_engine(url, future=True)


engine: AsyncEngine = _create_engine()
SessionFactory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


@asynccontextmanager
async def lifespan_session() -> AsyncIterator[AsyncSession]:
    """Provide an async session context manager for lifespan events."""

    async with SessionFactory() as session:
        yield session


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency that yields an async database session."""

    async with SessionFactory() as session:
        yield session
