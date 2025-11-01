"""Database session for worker."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from worker.config import get_worker_settings


def create_session_factory() -> async_sessionmaker[AsyncSession]:
    """Create database session factory."""
    settings = get_worker_settings()
    engine = create_async_engine(settings.database_url)
    return async_sessionmaker(engine, expire_on_commit=False)


@asynccontextmanager
async def get_worker_session() -> AsyncIterator[AsyncSession]:
    """Get database session for worker."""
    session_factory = create_session_factory()
    async with session_factory() as session:
        yield session