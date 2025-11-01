"""Admin leaderboard management endpoints."""

import csv
import json
import uuid
from io import StringIO
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session
from app.db.models import Leaderboard, User
from app.utils.file_validation import validate_csv_file

router = APIRouter(prefix="/admin/leaderboards")


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_leaderboard(
    season: str,
    leaderboard_type: str,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> Dict[str, Any]:
    """Upload leaderboard data from CSV or JSON file."""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")
    
    file_ext = file.filename.split('.')[-1].lower()
    
    try:
        content = await file.read()
        content_str = content.decode('utf-8')
        
        if file_ext == 'csv':
            entries = parse_csv_leaderboard(content_str)
        elif file_ext == 'json':
            entries = parse_json_leaderboard(content_str)
        else:
            raise HTTPException(status_code=400, detail="Only CSV and JSON files supported")
        
        # Upsert leaderboard
        stmt = select(Leaderboard).where(
            Leaderboard.season == season,
            Leaderboard.leaderboard_type == leaderboard_type
        )
        result = await session.execute(stmt)
        leaderboard = result.scalar_one_or_none()
        
        if leaderboard:
            leaderboard.entries = entries
        else:
            leaderboard = Leaderboard(
                season=season,
                leaderboard_type=leaderboard_type,
                entries=entries
            )
            session.add(leaderboard)
        
        await session.commit()
        
        return {
            "message": f"Leaderboard uploaded successfully",
            "entries_count": len(entries),
            "season": season,
            "type": leaderboard_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")


def parse_csv_leaderboard(content: str) -> List[Dict[str, Any]]:
    """Parse CSV leaderboard data."""
    reader = csv.DictReader(StringIO(content))
    entries = []
    
    for i, row in enumerate(reader, 1):
        if 'player' not in row or 'score' not in row:
            raise ValueError("CSV must have 'player' and 'score' columns")
        
        try:
            score = float(row['score'])
        except ValueError:
            raise ValueError(f"Invalid score on row {i}: {row['score']}")
        
        entry = {
            'player': row['player'],
            'score': score,
            'position': i,
            'metadata': {k: v for k, v in row.items() if k not in ['player', 'score']}
        }
        entries.append(entry)
    
    return entries


def parse_json_leaderboard(content: str) -> List[Dict[str, Any]]:
    """Parse JSON leaderboard data."""
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {str(e)}")
    
    if not isinstance(data, list):
        raise ValueError("JSON must be an array of entries")
    
    entries = []
    for i, entry in enumerate(data, 1):
        if not isinstance(entry, dict):
            raise ValueError(f"Entry {i} must be an object")
        
        if 'player' not in entry or 'score' not in entry:
            raise ValueError(f"Entry {i} must have 'player' and 'score' fields")
        
        try:
            score = float(entry['score'])
        except (ValueError, TypeError):
            raise ValueError(f"Invalid score in entry {i}: {entry['score']}")
        
        processed_entry = {
            'player': str(entry['player']),
            'score': score,
            'position': entry.get('position', i),
            'metadata': entry.get('metadata', {})
        }
        entries.append(processed_entry)
    
    return entries