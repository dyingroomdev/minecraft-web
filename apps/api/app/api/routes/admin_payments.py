"""Admin payment management endpoints."""

import csv
import io
import uuid
from datetime import datetime
from typing import List

import aioredis
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session, get_settings_dependency
from app.core.config import Settings
from app.db.models import AuditLog, PaymentRequest, User

router = APIRouter(prefix="/admin")


@router.post("/retry/{payment_request_id}")
async def retry_payment_fulfillment(
    payment_request_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
    admin_user: User = Depends(get_admin_user),
) -> dict:
    """Re-enqueue payment fulfillment for retry."""
    
    # Verify payment exists and is in approved status
    stmt = select(PaymentRequest).where(PaymentRequest.id == payment_request_id)
    result = await session.execute(stmt)
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    if payment.status not in ["approved", "failed"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot retry payment with status: {payment.status}"
        )
    
    # Re-enqueue in Redis
    redis = aioredis.from_url(settings.redis_url)
    try:
        await redis.lpush("fulfill_rank_queue", str(payment_request_id))
        
        # Create audit log
        audit = AuditLog(
            user_id=admin_user.id,
            action="payment_retry",
            metadata={
                "payment_request_id": str(payment_request_id),
                "previous_status": payment.status,
                "mc_username": payment.mc_username,
                "rank_code": payment.rank_product.rank_code if payment.rank_product else None
            },
            notes=f"Payment fulfillment re-enqueued by {admin_user.username}"
        )
        session.add(audit)
        await session.commit()
        
        return {
            "message": "Payment fulfillment re-enqueued successfully",
            "payment_id": str(payment_request_id),
            "status": payment.status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enqueue: {str(e)}")
    finally:
        await redis.close()


@router.get("/audit/export")
async def export_audit_logs(
    limit: int = 1000,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> Response:
    """Export audit logs as CSV."""
    
    stmt = (
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    audit_logs = result.scalars().all()
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "timestamp",
        "user_id", 
        "username",
        "action",
        "metadata",
        "notes"
    ])
    
    # Data rows
    for log in audit_logs:
        writer.writerow([
            log.created_at.isoformat(),
            str(log.user_id) if log.user_id else "",
            log.user.username if log.user else "",
            log.action,
            str(log.metadata) if log.metadata else "",
            log.notes or ""
        ])
    
    csv_content = output.getvalue()
    output.close()
    
    # Create audit log for export
    export_audit = AuditLog(
        user_id=admin_user.id,
        action="audit_export",
        metadata={"exported_count": len(audit_logs), "limit": limit},
        notes=f"Audit logs exported by {admin_user.username}"
    )
    session.add(export_audit)
    await session.commit()
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )