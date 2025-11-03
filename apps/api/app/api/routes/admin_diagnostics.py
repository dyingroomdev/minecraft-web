"""Admin diagnostics endpoints."""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict

from redis import asyncio as aioredis
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session, get_settings_dependency
from app.core.config import Settings
from app.db.models import User

router = APIRouter(prefix="/admin/diagnostics")


@router.get("/")
async def run_diagnostics(
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
    _: User = Depends(get_admin_user),
) -> Dict[str, Any]:
    """Run comprehensive system diagnostics."""

    db_result = await check_database(session)
    redis_result = await check_redis(settings)
    rcon_result = await check_rcon(settings)

    results: Dict[str, Any] = {
        "timestamp": time.time(),
        "database": db_result,
        "redis": redis_result,
        "rcon": rcon_result,
    }

    components = [db_result, redis_result, rcon_result]
    all_healthy = all(item.get("status") == "healthy" for item in components if "status" in item)
    results["overall_status"] = "healthy" if all_healthy else "degraded"
    return results


async def check_database(session: AsyncSession) -> Dict[str, Any]:
    """Check database connectivity and performance."""
    start_time = time.monotonic()
    try:
        await session.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - captured in tests
        return {"status": "unhealthy", "error": str(exc), "response_time_ms": None, "top_tables": []}

    response_ms = round((time.monotonic() - start_time) * 1000, 2)
    payload: Dict[str, Any] = {"status": "healthy", "response_time_ms": response_ms, "top_tables": []}

    bind = session.get_bind()
    dialect_name = getattr(getattr(bind, "dialect", None), "name", None)
    if dialect_name == "postgresql":
        try:
            stmt = text(
                """
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins + n_tup_upd + n_tup_del AS total_operations
                FROM pg_stat_user_tables
                ORDER BY total_operations DESC
                LIMIT 5
                """
            )
            result = await session.execute(stmt)
            payload["top_tables"] = [
                {"schema": row[0], "table": row[1], "operations": row[2] or 0} for row in result.fetchall()
            ]
        except Exception:  # pragma: no cover - postgres specific optional diagnostic
            payload["top_tables"] = []

    return payload


async def check_redis(settings: Settings) -> Dict[str, Any]:
    """Check Redis connectivity and performance."""
    start_time = time.monotonic()
    try:
        redis = aioredis.from_url(settings.redis_url)
        try:
            await redis.ping()
            info = await redis.info(section="server")
        finally:
            await redis.close()
    except Exception as exc:
        return {"status": "unhealthy", "error": str(exc), "response_time_ms": None}

    response_ms = round((time.monotonic() - start_time) * 1000, 2)
    return {
        "status": "healthy",
        "response_time_ms": response_ms,
        "version": info.get("redis_version"),
        "mode": info.get("redis_mode"),
    }


async def check_rcon(settings: Settings) -> Dict[str, Any]:
    """Check RCON connectivity."""
    if not settings.minecraft_rcon_password:
        return {
            "status": "skipped",
            "error": "MINECRAFT_RCON_PASSWORD is not configured; skipping RCON diagnostics",
        }

    start_time = time.monotonic()
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(settings.minecraft_server_host, settings.minecraft_rcon_port),
            timeout=5.0,
        )
        writer.close()
        await writer.wait_closed()
    except Exception as exc:
        return {"status": "unhealthy", "error": str(exc), "response_time_ms": None}

    return {"status": "healthy", "response_time_ms": round((time.monotonic() - start_time) * 1000, 2)}
