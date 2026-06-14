"""Database models for users, refresh tokens, and audit logs."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


JSON_VARIANT = JSON().with_variant(JSONB(astext_type=Text()), "postgresql")


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Registered user with credentials and optional social identities."""

    __tablename__ = "users"

    discord_id: Mapped[str | None] = mapped_column(String(32), unique=True, index=True, nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    username: Mapped[str] = mapped_column(String(150))
    email: Mapped[str | None] = mapped_column(String(254), unique=True, index=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    roles: Mapped[list[str]] = mapped_column(JSON_VARIANT, default=list)

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    audits: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    cart_items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="user", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Stored refresh tokens for rotation and revocation."""

    __tablename__ = "refresh_tokens"

    user_id: Mapped[Any] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    jwt_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(nullable=True)
    replaced_by_token_id: Mapped[Any] = mapped_column(
        ForeignKey("refresh_tokens.id", ondelete="SET NULL"), nullable=True
    )

    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")
    replaced_by_token: Mapped["RefreshToken | None"] = relationship(
        "RefreshToken", remote_side="RefreshToken.id"
    )


class AuditLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Audit log entries describing user-facing events."""

    __tablename__ = "audit_logs"

    user_id: Mapped[Any] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(128))
    meta_data: Mapped[dict[str, Any]] = mapped_column("metadata", MutableDict.as_mutable(JSON_VARIANT), default=dict)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(20), nullable=True)

    user: Mapped["User | None"] = relationship("User", back_populates="audits")


class AdminUser(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Admin users for the admin panel with email/password authentication."""

    __tablename__ = "admin_users"

    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    discord_id: Mapped[str | None] = mapped_column(String(32), unique=True, index=True, nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="ADMIN")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        CheckConstraint("role IN ('ADMIN', 'SUPER_ADMIN')", name="ck_admin_users_role"),
    )
