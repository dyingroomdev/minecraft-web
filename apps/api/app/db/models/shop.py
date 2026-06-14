"""Shop models for products, cart, and orders."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Numeric,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

JSON_VARIANT = JSON().with_variant(JSONB(astext_type=Text()), "postgresql")


class PaymentMethod(str, Enum):
    BKASH = "bkash"
    NAGAD = "nagad"


class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Shop products (coin packs)."""

    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    price_bdt: Mapped[int] = mapped_column(Integer, nullable=False)  # Price in BDT
    coins: Mapped[int] = mapped_column(Integer, nullable=False)  # Number of coins
    bonus_coins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="product")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")


class CartItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Shopping cart items."""

    __tablename__ = "cart_items"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="cart_items")
    product: Mapped[Product] = relationship("Product", back_populates="cart_items")


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Customer orders."""

    __tablename__ = "orders"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # Total in BDT
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    transaction_id: Mapped[str] = mapped_column(String(100), nullable=False)
    minecraft_username: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=OrderStatus.PENDING.value, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Items within an order."""

    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)  # Price at time of purchase
    coins: Mapped[int] = mapped_column(Integer, nullable=False)  # Coins at time of purchase

    order: Mapped[Order] = relationship("Order", back_populates="items")
    product: Mapped[Product] = relationship("Product", back_populates="order_items")