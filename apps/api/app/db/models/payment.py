"""Payment and entitlement models."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

JSON_VARIANT = JSON().with_variant(JSONB(astext_type=Text()), "postgresql")


class RankProduct(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Purchasable rank products."""
    
    __tablename__ = "rank_products"
    
    rank_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    price_bdt: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duration_days: Mapped[int | None] = mapped_column(nullable=True)  # None = permanent
    luckperms_group: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    meta_data: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)


class PaymentRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """bKash payment requests."""
    
    __tablename__ = "payment_requests"
    __table_args__ = (
        UniqueConstraint("bkash_txid", name="uq_payment_request_bkash_txid"),
    )
    
    rank_product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rank_products.id"), nullable=False)
    mc_username: Mapped[str] = mapped_column(String(32), nullable=False)
    mc_uuid: Mapped[uuid.UUID | None] = mapped_column(nullable=True)  # Resolved later
    bkash_txid: Mapped[str] = mapped_column(String(64), nullable=False)
    amount_bdt: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    screenshot_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)  # pending, approved, rejected, fulfilled
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    processed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    meta_data: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)
    
    rank_product: Mapped[RankProduct] = relationship("RankProduct")
    processed_by: Mapped["User | None"] = relationship("User")


class Entitlement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Player rank entitlements."""
    
    __tablename__ = "entitlements"
    
    payment_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"), nullable=False)
    mc_uuid: Mapped[uuid.UUID] = mapped_column(nullable=False)
    mc_username: Mapped[str] = mapped_column(String(32), nullable=False)
    rank_code: Mapped[str] = mapped_column(String(64), nullable=False)
    luckperms_group: Mapped[str] = mapped_column(String(64), nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta_data: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)
    
    payment_request: Mapped[PaymentRequest] = relationship("PaymentRequest")