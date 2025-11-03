"""Core enumerations used across the API service."""

from __future__ import annotations

from enum import Enum


class RBACRole(str, Enum):
    """Role-based access control roles recognised by the platform."""

    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MOD = "MOD"
    PLAYER = "PLAYER"


class AdminRole(str, Enum):
    """Admin user roles for the admin panel."""

    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


RBAC_DEFAULT_ROLE = RBACRole.PLAYER
