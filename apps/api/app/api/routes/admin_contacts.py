"""Admin management for public contact and support requests."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, require_admin
from app.db.models import AdminUser, Ticket
from app.schemas.content import ContactRequestRead, ContactRequestStatusUpdate

router = APIRouter(prefix="/admin/contact-requests")


def _serialize(ticket: Ticket) -> ContactRequestRead:
    metadata = ticket.meta_data or {}
    return ContactRequestRead(
        id=ticket.id,
        request_type=metadata.get("request_type", "contact"),
        name=metadata.get("name", "Unknown"),
        email=metadata.get("email", ""),
        minecraft_username=metadata.get("minecraft_username"),
        subject=ticket.subject,
        message=ticket.body,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.get("", response_model=list[ContactRequestRead])
async def list_contact_requests(
    request_status: str | None = Query(default=None, alias="status"),
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[ContactRequestRead]:
    statement = select(Ticket).order_by(desc(Ticket.created_at))
    if request_status:
        statement = statement.where(Ticket.status == request_status)
    result = await session.execute(statement)
    return [_serialize(ticket) for ticket in result.scalars().all()]


@router.patch("/{ticket_id}/status", response_model=ContactRequestRead)
async def update_contact_request_status(
    ticket_id: uuid.UUID,
    payload: ContactRequestStatusUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> ContactRequestRead:
    ticket = await session.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact request not found")
    ticket.status = payload.status
    await session.commit()
    await session.refresh(ticket)
    return _serialize(ticket)
