"""Admin diagnostics endpoints."""

import asyncio
import time
from typing import Dict, Any

import aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session, get_settings_dependency
from app.core.config import Settings
from app.db.models import User
from worker.services import RCONService

router = APIRouter(prefix="/admin/diagnostics")


@router.get("/")
async def run_diagnostics(
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
    admin_user: User = Depends(get_admin_user),
) -> Dict[str, Any]:
    """Run comprehensive system diagnostics."""
    
    results = {
        "timestamp": time.time(),
        "database": await check_database(session),
        "redis": await check_redis(settings),
        "rcon": await check_rcon(settings),
    }
    
    # Overall health
    all_healthy = all(
        result.get("status") == "healthy" 
        for result in results.values() 
        if isinstance(result, dict) and "status" in result
    )
    
    results["overall_status"] = "healthy" if all_healthy else "degraded"
    
    return results


async def check_database(session: AsyncSession) -> Dict[str, Any]:
    """Check database connectivity and performance."""
    try:
        start_time = time.time()
        
        # Simple query
        result = await session.execute(text("SELECT 1"))
        result.scalar()
        
        # Check table counts
        tables_result = await session.execute(text("""
            SELECT 
                schemaname,
                tablename,
                n_tup_ins + n_tup_upd + n_tup_del as total_operations
            FROM pg_stat_user_tables 
            ORDER BY total_operations DESC 
            LIMIT 5
        """))
        
        response_time = (time.time() - start_time) * 1000
        
        return {
            "status": "healthy",
            "response_time_ms": round(response_time, 2),
            "top_tables": [
                {"schema": row[0], "table": row[1], "operations": row[2]}
                for row in tables_result.fetchall()
            ]
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "response_time_ms": None
        }


async def check_redis(settings: Settings) -> Dict[str, Any]:
    """Check Redis connectivity and performance."""
    try:
        start_time = time.time()
        redis = aioredis.from_url(settings.redis_url)
        
        # Ping test
        await redis.ping()
        
        # Set/get test
        test_key = "diagnostic_test"
        await redis.set(test_key, "test_value", ex=10)
        value = await redis.get(test_key)
        await redis.delete(test_key)
        
        # Get info
        info = await redis.info()
        
        await redis.close()
        response_time = (time.time() - start_time) * 1000
        
        return {
            "status": "healthy",
            "response_time_ms": round(response_time, 2),
            "memory_used": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "test_result": value.decode() if value else None
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "response_time_ms": None
        }


async def check_rcon(settings: Settings) -> Dict[str, Any]:
    """Check RCON connectivity."""
    try:
        start_time = time.time()
        
        rcon = RCONService(
            settings.minecraft_server_host,
            settings.minecraft_rcon_port,
            settings.minecraft_rcon_password
        )
        
        # Simple command test
        result = await rcon._execute_command("list")
        response_time = (time.time() - start_time) * 1000
        
        return {
            "status": "healthy",
            "response_time_ms": round(response_time, 2),
            "server_response": result[:100] + "..." if len(result) > 100 else result
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "response_time_ms": None
        }