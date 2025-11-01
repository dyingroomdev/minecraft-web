"""Authentication related schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_at: datetime
    refresh_expires_at: datetime
    roles: list[str]


class LogoutResponse(BaseModel):
    detail: str
