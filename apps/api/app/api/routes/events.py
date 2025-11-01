"""Events calendar and ICS export endpoints."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.db.models import Event
from app.schemas.content import EventRead

router = APIRouter(prefix="/api/events")


@router.get("/calendar", response_model=List[EventRead])
async def get_events_calendar(
    session: AsyncSession = Depends(get_db_session),
) -> List[Event]:
    """Get all events for calendar view."""
    stmt = select(Event).order_by(Event.start_at.nullsfirst(), Event.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/calendar.ics")
async def export_events_ics(
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    """Export events as ICS calendar file."""
    stmt = select(Event).where(Event.start_at.is_not(None)).order_by(Event.start_at)
    result = await session.execute(stmt)
    events = result.scalars().all()
    
    ics_content = generate_ics_calendar(events)
    
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": "attachment; filename=amzcraft-events.ics"
        }
    )


def generate_ics_calendar(events: List[Event]) -> str:
    """Generate ICS calendar content from events."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AmzCraft//Events Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]
    
    for event in events:
        if not event.start_at:
            continue
            
        # Format datetime for ICS (UTC)
        start_dt = event.start_at.strftime("%Y%m%dT%H%M%SZ")
        end_dt = event.end_at.strftime("%Y%m%dT%H%M%SZ") if event.end_at else start_dt
        
        # Create unique UID
        uid = f"{event.id}@amzcraft.xyz"
        
        # Escape special characters in text fields
        title = escape_ics_text(event.title)
        description = escape_ics_text(event.description)
        location = escape_ics_text(event.location) if event.location else ""
        
        event_lines = [
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTART:{start_dt}",
            f"DTEND:{end_dt}",
            f"SUMMARY:{title}",
            f"DESCRIPTION:{description}",
        ]
        
        if location:
            event_lines.append(f"LOCATION:{location}")
        
        event_lines.extend([
            f"DTSTAMP:{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}",
            "STATUS:CONFIRMED",
            "END:VEVENT",
        ])
        
        lines.extend(event_lines)
    
    lines.append("END:VCALENDAR")
    
    return "\r\n".join(lines)


def escape_ics_text(text: str) -> str:
    """Escape special characters for ICS format."""
    if not text:
        return ""
    
    # Replace special characters
    text = text.replace("\\", "\\\\")
    text = text.replace(",", "\\,")
    text = text.replace(";", "\\;")
    text = text.replace("\n", "\\n")
    text = text.replace("\r", "")
    
    return text