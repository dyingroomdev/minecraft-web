"""Brand and SEO settings models."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BrandSettings(Base):
    """Brand settings singleton table."""

    __tablename__ = "brand_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    site_name: Mapped[str] = mapped_column(Text, nullable=False, default="AmzCraft")
    tagline: Mapped[str] = mapped_column(Text, nullable=False, default="Experience the ultimate Minecraft adventure")
    logo_url_light: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url_dark: Mapped[str | None] = mapped_column(Text, nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    theme_primary: Mapped[str] = mapped_column(String(7), nullable=False, default="#46C93A")
    theme_bg: Mapped[str] = mapped_column(String(7), nullable=False, default="#0B1A0B")
    theme_surface: Mapped[str] = mapped_column(String(7), nullable=False, default="#112412")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class SEOSettings(Base):
    """SEO settings singleton table."""

    __tablename__ = "seo_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    default_title: Mapped[str] = mapped_column(Text, nullable=False, default="AmzCraft")
    title_template: Mapped[str] = mapped_column(Text, nullable=False, default="%s | AmzCraft")
    meta_description: Mapped[str] = mapped_column(Text, nullable=False, default="Low-latency Minecraft with seasons, ranks, and live events.")
    canonical_base_url: Mapped[str] = mapped_column(Text, nullable=False, default="https://amzcraft.xyz")
    og_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    twitter_handle: Mapped[str | None] = mapped_column(String(50), nullable=True)
    robots_policy: Mapped[str] = mapped_column(String(50), nullable=False, default="index,follow")
    sitemap_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)