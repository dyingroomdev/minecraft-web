"""Admin dashboard endpoints."""

from __future__ import annotations

import json
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from redis import asyncio as aioredis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_redis, get_settings_dependency, require_admin
from app.core.config import Settings
from app.db.models import (
    AdminUser,
    AuditLog,
    Entitlement,
    Event,
    NewsPost,
    PaymentRequest,
    RankProduct,
    ServerStatus,
    User,
)
from app.services.status_service import build_snapshot

router = APIRouter(prefix="/admin/dashboard")
STATUS_KEY = "amz:status:snapshot"


def _format_uptime_seconds(seconds: int) -> str:
    days, remainder = divmod(max(0, seconds), 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, secs = divmod(remainder, 60)
    if days:
        return f"{days}d {hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def _format_uptime_from_diagnostics() -> str:
    try:
        from app.api.routes.admin_diagnostics import _get_start_time

        return _format_uptime_seconds(int(time.time() - _get_start_time()))
    except Exception:
        return "Unknown"


@router.get("/stats")
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_db_session),
    redis: aioredis.Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings_dependency),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    now = datetime.now(timezone.utc)
    today = now.date()
    seven_days_ago = now - timedelta(days=6)

    payment_counts_result = await session.execute(
        select(PaymentRequest.status, func.count(PaymentRequest.id)).group_by(PaymentRequest.status)
    )
    payment_stats = {str(status): int(count) for status, count in payment_counts_result.all()}

    latest_status_result = await session.execute(
        select(ServerStatus).order_by(ServerStatus.recorded_at.desc()).limit(1)
    )
    latest_status = latest_status_result.scalar_one_or_none()
    live_status: dict | None = None
    try:
        cached_status = await redis.get(STATUS_KEY)
        if cached_status:
            live_status = json.loads(cached_status)
        else:
            live_status = await build_snapshot(
                settings.mc_java_host,
                settings.mc_bedrock_host,
                settings.mcsrv_base,
            )
            await redis.setex(STATUS_KEY, settings.status_ttl_seconds, json.dumps(live_status))
    except Exception:
        # SQL snapshots remain a useful fallback when Redis or the external
        # status provider is temporarily unavailable.
        live_status = None

    news_count = await session.scalar(select(func.count(NewsPost.id)))
    active_events = await session.scalar(
        select(func.count(Event.id)).where(
            Event.is_active.is_(True),
            (Event.end_at.is_(None)) | (Event.end_at >= now),
        )
    )
    upcoming_events = await session.scalar(
        select(func.count(Event.id)).where(Event.start_at.is_not(None), Event.start_at > now)
    )
    users_count = await session.scalar(select(func.count(User.id)))
    premium_members = await session.scalar(
        select(func.count(Entitlement.id)).where(
            Entitlement.is_active.is_(True),
            (Entitlement.expires_at.is_(None)) | (Entitlement.expires_at > now),
        )
    )
    revenue = await session.scalar(
        select(func.coalesce(func.sum(PaymentRequest.amount_bdt), 0)).where(
            PaymentRequest.status.in_(("approved", "fulfilled"))
        )
    )

    revenue_rows = await session.execute(
        select(
            func.date(PaymentRequest.created_at).label("payment_date"),
            func.coalesce(func.sum(PaymentRequest.amount_bdt), 0).label("total"),
        )
        .where(
            PaymentRequest.status.in_(("approved", "fulfilled")),
            PaymentRequest.created_at >= seven_days_ago,
        )
        .group_by(func.date(PaymentRequest.created_at))
    )
    revenue_by_date = {str(row.payment_date): float(row.total or 0) for row in revenue_rows}
    revenue_last_7_days = [
        {
            "date": (today - timedelta(days=offset)).isoformat(),
            "total": revenue_by_date.get((today - timedelta(days=offset)).isoformat(), 0),
        }
        for offset in range(6, -1, -1)
    ]

    rank_rows = await session.execute(
        select(RankProduct.display_name, func.count(Entitlement.id))
        .join(Entitlement, Entitlement.rank_code == RankProduct.rank_code)
        .where(
            Entitlement.is_active.is_(True),
            (Entitlement.expires_at.is_(None)) | (Entitlement.expires_at > now),
        )
        .group_by(RankProduct.display_name)
        .order_by(func.count(Entitlement.id).desc())
    )

    metadata = latest_status.meta_data if latest_status else {}
    if live_status is not None:
        server_status = "online" if live_status.get("online") else "offline"
        players_online = int(live_status.get("player_count") or 0)
        players_max = int(live_status.get("max_players") or 0)
        server_version = live_status.get("version")
    else:
        server_status = latest_status.status if latest_status else "offline"
        players_online = latest_status.players_online if latest_status else 0
        players_max = latest_status.players_max if latest_status else 0
        server_version = metadata.get("version") if metadata else None

    return {
        "server_status": server_status,
        "players_online": players_online,
        "players_max": players_max,
        "server_version": server_version,
        "total_payments": sum(payment_stats.values()),
        "pending_payments": payment_stats.get("pending", 0),
        "approved_payments": payment_stats.get("approved", 0) + payment_stats.get("fulfilled", 0),
        "rejected_payments": payment_stats.get("rejected", 0),
        "total_news": int(news_count or 0),
        "total_events": int(active_events or 0),
        "upcoming_events": int(upcoming_events or 0),
        "total_users": int(users_count or 0),
        "total_revenue": float(revenue or 0),
        "premium_members": int(premium_members or 0),
        "uptime": _format_uptime_from_diagnostics(),
        "revenue_last_7_days": revenue_last_7_days,
        "rank_distribution": [
            {"name": str(display_name), "count": int(count)}
            for display_name, count in rank_rows.all()
        ],
    }


@router.get("/activity")
async def get_recent_activity(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[dict]:
    result = await session.execute(
        select(AuditLog, User.username)
        .outerjoin(User, User.id == AuditLog.user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    )
    return [
        {
            "id": str(log.id),
            "action": log.action.replace("_", " ").title(),
            "timestamp": log.created_at.isoformat(),
            "user": username,
            "notes": log.notes,
            "metadata": log.meta_data or {},
        }
        for log, username in result.all()
    ]
