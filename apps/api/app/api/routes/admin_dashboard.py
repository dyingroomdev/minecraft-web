"""Admin dashboard endpoints."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.api.deps import get_db_session, require_admin
from app.db.models import AdminUser, AuditLog, Event, NewsPost, PaymentRequest, User

router = APIRouter(prefix="/admin/dashboard")


def _format_uptime_seconds(seconds: int) -> str:
    """Format uptime seconds into human readable format."""
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    
    return " ".join(parts) if parts else "0m"


def _format_uptime_from_diagnostics() -> str:
    """Get uptime from diagnostics and format it."""
    try:
        from app.api.routes.admin_diagnostics import _get_start_time
        import time
        uptime_sec = int(time.time() - _get_start_time())
        return _format_uptime_seconds(uptime_sec)
    except:
        return "Unknown"


@router.get("/stats")
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
):
    """Get dashboard statistics."""
    
    # Payment counts
    payment_counts = await session.execute(
        select(
            PaymentRequest.status,
            func.count(PaymentRequest.id).label('count')
        ).group_by(PaymentRequest.status)
    )
    payment_stats = {row.status: row.count for row in payment_counts}
    
    # Content counts
    news_count = await session.execute(select(func.count(NewsPost.id)))
    events_count = await session.execute(select(func.count(Event.id).filter(Event.is_active == True)))
    users_count = await session.execute(select(func.count(User.id)))
    
    return {
        "server_status": "online",  # Mock for now
        "total_payments": sum(payment_stats.values()),
        "pending_payments": payment_stats.get("pending", 0),
        "approved_payments": payment_stats.get("approved", 0),
        "rejected_payments": payment_stats.get("rejected", 0),
        "total_news": news_count.scalar() or 0,
        "total_events": events_count.scalar() or 0,
        "total_users": users_count.scalar() or 0,
        "uptime": _format_uptime_from_diagnostics()
    }


@router.get("/activity")
async def get_recent_activity(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
):
    """Get recent admin activity."""
    
    # Get recent audit logs
    stmt = (
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    )
    result = await session.execute(stmt)
    logs = result.scalars().all()
    
    activity = []
    for log in logs:
        activity.append({
            "id": str(log.id),
            "action": log.action.replace("_", " ").title(),
            "timestamp": log.created_at.isoformat(),
            "user": None
        })
    
    return activity