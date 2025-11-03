import uuid
from pathlib import Path

import pytest
from unittest.mock import patch

from app.core.enums import RBACRole
from app.db.models import User
from app.services.auth import AuthService


async def _issue_admin_token(db_session, settings) -> tuple[User, str]:
    user = User(
        discord_id=str(uuid.uuid4()),
        username="Uploader",
        email="upload@example.com",
        avatar=None,
        roles=[RBACRole.ADMIN.value],
    )
    db_session.add(user)
    await db_session.flush()

    service = AuthService(session=db_session, settings=settings)
    bundle = await service.issue_tokens(user=user)
    await db_session.commit()
    return user, bundle.access_token


@pytest.mark.asyncio
async def test_admin_media_upload_saves_file(tmp_path, client, db_session, settings_override):
    settings_override.media_root = str(tmp_path)
    settings_override.media_url_path = "/api/media"

    _, token = await _issue_admin_token(db_session, settings_override)

    fake_image = b"\xff\xd8\xff\xdb\x00\x43\x00"  # minimal JPEG header
    with patch("app.utils.file_validation.magic.from_buffer", return_value="image/jpeg"):
        response = await client.post(
            "/admin/media/",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("test.jpg", fake_image, "image/jpeg")},
        )

    assert response.status_code == 201, response.text
    payload = response.json()
    saved_name = payload["filename"]
    assert saved_name.endswith(".jpg")
    saved_path = Path(settings_override.media_root) / saved_name
    assert saved_path.exists()
    assert saved_path.read_bytes() == fake_image
    assert payload["url"] == f"/api/media/{saved_name}"
