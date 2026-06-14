"""Simplified models for worker."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import JSON


class Base(DeclarativeBase):
    """Base model class."""
    pass


JSON_VARIANT = JSON().with_variant(JSONB(astext_type=Text()), "postgresql")


class ServerStatus(Base):
    """Server status model for worker."""
    
    __tablename__ = "server_status"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String(32), default="offline", nullable=False)
    players_online: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    players_max: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    motd: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_data: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RankProduct(Base):
    """Rank products for worker."""
    
    __tablename__ = "rank_products"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rank_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    price_bdt: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duration_days: Mapped[int | None] = mapped_column(nullable=True)
    lp_group: Mapped[str | None] = mapped_column(String(64), nullable=True)
    stack_mode: Mapped[str] = mapped_column(String(8), default="SET", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    meta_data: Mapped[dict[str, Any]] = mapped_column("metadata", MutableDict.as_mutable(JSON_VARIANT), default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PaymentRequest(Base):
    """Payment requests for worker."""
    
    __tablename__ = "payment_requests"
    __table_args__ = (
        UniqueConstraint("bkash_txid", name="uq_payment_request_bkash_txid"),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rank_product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rank_products.id"), nullable=False)
    mc_username: Mapped[str] = mapped_column(String(32), nullable=False)
    mc_uuid: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    platform: Mapped[str | None] = mapped_column(String(16), nullable=True)
    bkash_txid: Mapped[str] = mapped_column(String(64), nullable=False)
    amount_bdt: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    screenshot_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    processed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fulfillment_status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)
    fulfillment_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_data: Mapped[dict[str, Any]] = mapped_column("metadata", MutableDict.as_mutable(JSON_VARIANT), default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    rank_product: Mapped[RankProduct] = relationship("RankProduct")


class Entitlement(Base):
    """Player entitlements for worker."""
    
    __tablename__ = "entitlements"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"), nullable=False)
    mc_uuid: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    mc_username: Mapped[str] = mapped_column(String(32), nullable=False)
    rank_code: Mapped[str] = mapped_column(String(64), nullable=False)
    luckperms_group: Mapped[str] = mapped_column(String(64), nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta_data: Mapped[dict[str, Any]] = mapped_column("metadata", MutableDict.as_mutable(JSON_VARIANT), default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    payment_request: Mapped[PaymentRequest] = relationship("PaymentRequest")

    def __init__(self, **kwargs: Any) -> None:
        # Backward-compatible aliases used by older tests/job code.
        if "lp_group" in kwargs and "luckperms_group" not in kwargs:
            kwargs["luckperms_group"] = kwargs.pop("lp_group")
        kwargs.pop("stack_mode", None)
        super().__init__(**kwargs)
