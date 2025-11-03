"""Administrative media upload endpoints."""

from __future__ import annotations

import os
import secrets
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.api.deps import require_admin, get_settings_dependency
from app.core.config import Settings
from app.db.models import AdminUser
from app.utils.file_validation import sanitize_filename, validate_image_file


router = APIRouter(prefix="/admin/media", tags=["admin-media"])


def _ensure_directory(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_media_file(
    file: UploadFile = File(...),
    _: AdminUser = Depends(require_admin()),
    settings: Settings = Depends(get_settings_dependency),
) -> dict[str, Any]:
    """Upload an image file and return its accessible URL."""

    validate_image_file(file)
    _ensure_directory(settings.media_root_path)

    original_name = sanitize_filename(file.filename or "upload")
    random_suffix = secrets.token_hex(8)
    name, ext = os.path.splitext(original_name)
    saved_name = f"{name}-{random_suffix}{ext}"
    destination = Path(settings.media_root_path) / saved_name

    try:
        contents = await file.read()
        destination.write_bytes(contents)
    except Exception as exc:  # pragma: no cover - defensive, file system errors
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to store file") from exc

    # Return full URL instead of relative path
    base_url = "http://localhost:8001"  # TODO: Make this configurable
    url = f"{base_url}{settings.media_url_path.rstrip('/')}/{saved_name}"
    return {
        "filename": saved_name,
        "url": url,
        "content_type": file.content_type,
        "size": len(contents),
    }
