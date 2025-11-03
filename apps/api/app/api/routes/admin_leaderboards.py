"""Admin leaderboard management endpoints."""

from __future__ import annotations

import csv
import json
from io import StringIO
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session
from app.db.models import Leaderboard, User
from app.middleware.security import sanitize_text
from app.schemas.content import LeaderboardRead
from app.services import leaderboard_cache

router = APIRouter(prefix="/admin/leaderboards")


@router.post("/upload", response_model=LeaderboardRead, status_code=status.HTTP_201_CREATED)
async def upload_leaderboard(
    season: str = Form(...),
    leaderboard_type: str = Form(...),
    title: str | None = Form(default=None),
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(get_admin_user),
) -> LeaderboardRead:
    """Upload leaderboard data from CSV or JSON file."""

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename required")

    extension = file.filename.rsplit(".", 1)[-1].lower()
    raw_content = await file.read()

    try:
        content = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to decode file as UTF-8") from exc

    try:
        if extension == "csv":
            entries = _parse_csv(content)
        elif extension == "json":
            entries = _parse_json(content)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV and JSON files supported")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    stmt = select(Leaderboard).where(
        Leaderboard.season == season,
        Leaderboard.leaderboard_type == leaderboard_type,
    )
    result = await session.execute(stmt)
    leaderboard = result.scalar_one_or_none()

    if leaderboard is None:
        leaderboard = Leaderboard(season=season, leaderboard_type=leaderboard_type, entries=entries)
        session.add(leaderboard)
    else:
        leaderboard.entries = entries

    if title:
        leaderboard.title = sanitize_text(title)

    meta = dict(leaderboard.meta_data)
    meta["imported_from"] = extension
    leaderboard.meta_data = meta

    await session.flush()
    await _refresh_available_types(session, season)
    await session.commit()

    leaderboard_cache.invalidate_season(season)
    return LeaderboardRead.model_validate(leaderboard)


def _parse_csv(content: str) -> List[Dict[str, Any]]:
    reader = csv.DictReader(StringIO(content))
    entries: List[Dict[str, Any]] = []

    for index, row in enumerate(reader, start=1):
        if "player" not in row or "score" not in row:
            raise ValueError("CSV must include 'player' and 'score' columns")

        try:
            score = float(row["score"])
        except ValueError as exc:
            raise ValueError(f"Invalid score on row {index}: {row['score']}") from exc

        entry = {
            "player": str(row["player"]),
            "score": score,
            "position": index,
            "metadata": {key: value for key, value in row.items() if key not in {"player", "score"}},
        }
        entries.append(entry)

    if not entries:
        raise ValueError("Leaderboard file contained no rows")
    return entries


def _parse_json(content: str) -> List[Dict[str, Any]]:
    try:
        payload = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON: {exc}") from exc

    if not isinstance(payload, list):
        raise ValueError("JSON payload must be an array of entries")

    entries: List[Dict[str, Any]] = []
    for index, raw_entry in enumerate(payload, start=1):
        if not isinstance(raw_entry, dict):
            raise ValueError(f"Entry {index} must be an object")

        if "player" not in raw_entry or "score" not in raw_entry:
            raise ValueError(f"Entry {index} must include 'player' and 'score'")

        try:
            score = float(raw_entry["score"])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Invalid score in entry {index}: {raw_entry['score']}") from exc

        entry = {
            "player": str(raw_entry["player"]),
            "score": score,
            "position": int(raw_entry.get("position") or index),
            "metadata": raw_entry.get("metadata", {}),
        }
        entries.append(entry)

    if not entries:
        raise ValueError("Leaderboard file contained no entries")
    return entries


async def _refresh_available_types(session: AsyncSession, season: str) -> None:
    result = await session.execute(select(Leaderboard).where(Leaderboard.season == season))
    leaderboards = result.scalars().all()
    types = sorted({item.leaderboard_type for item in leaderboards})

    for item in leaderboards:
        meta = dict(item.meta_data)
        meta["available_types"] = types
        item.meta_data = meta
