"""Schemas for admin authentication and management."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.core.enums import AdminRole


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminUserRead(BaseModel):
    id: str
    email: str
    role: AdminRole
    is_active: bool


class AdminCreateRequest(BaseModel):
    email: EmailStr
    password: str
    role: AdminRole = AdminRole.ADMIN