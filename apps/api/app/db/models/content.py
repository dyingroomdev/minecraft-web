"""Additional domain models for guilds, content, and status."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

JSON_VARIANT = JSON().with_variant(JSONB(astext_type=Text()), "postgresql")


class Rank(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Rank metadata applied to players."""

    __tablename__ = "ranks"

    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(96), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    meta_data: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)

    players: Mapped[list["Player"]] = relationship("Player", back_populates="rank")


class Guild(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Player-organised guilds."""

    __tablename__ = "guilds"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    tag: Mapped[str] = mapped_column(String(8), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_player_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("players.id", ondelete="SET NULL"), nullable=True
    )

    owner: Mapped["Player | None"] = relationship(
        "Player", foreign_keys=[owner_player_id], back_populates="owned_guild"
    )
    members: Mapped[list["GuildMember"]] = relationship(
        "GuildMember", back_populates="guild", cascade="all, delete-orphan"
    )


class Player(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Minecraft player tracked by the platform."""

    __tablename__ = "players"

    minecraft_uuid: Mapped[uuid.UUID] = mapped_column(nullable=False, unique=True)
    username: Mapped[str] = mapped_column(String(32), nullable=False)
    rank_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("ranks.id", ondelete="SET NULL"), nullable=True
    )
    guild_memberships: Mapped[list["GuildMember"]] = relationship(
        "GuildMember", back_populates="player", cascade="all, delete-orphan"
    )
    rank: Mapped[Rank | None] = relationship("Rank", back_populates="players")
    owned_guild: Mapped[Guild | None] = relationship(
        "Guild", back_populates="owner", uselist=False
    )
    stats: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)


class GuildMember(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Join table describing a player's membership within a guild."""

    __tablename__ = "guild_members"
    __table_args__ = (
        UniqueConstraint("player_id", "guild_id", name="uq_guild_member_player_guild"),
    )

    guild_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False)
    player_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="member", nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    guild: Mapped[Guild] = relationship("Guild", back_populates="members")
    player: Mapped[Player] = relationship("Player", back_populates="guild_memberships")


class ServerStatus(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Latest Minecraft server status snapshot."""

    __tablename__ = "server_status"

    status: Mapped[str] = mapped_column(String(32), default="offline", nullable=False)
    players_online: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    players_max: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    motd: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_data: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class NewsPost(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """News posts displayed on the public site."""

    __tablename__ = "news_posts"

    slug: Mapped[str] = mapped_column(String(140), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    summary: Mapped[str | None] = mapped_column(String(280), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_publish_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_draft: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Event(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Server events and competitions."""

    __tablename__ = "events"

    slug: Mapped[str] = mapped_column(String(140), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[str | None] = mapped_column(String(140), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Rule(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Server rules displayed to players."""

    __tablename__ = "rules"

    slug: Mapped[str] = mapped_column(String(140), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Leaderboard(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Leaderboard entries per season and category."""

    __tablename__ = "leaderboards"
    __table_args__ = (
        UniqueConstraint("season", "leaderboard_type", name="uq_leaderboard_season_type"),
    )

    season: Mapped[str] = mapped_column(String(32), nullable=False)
    leaderboard_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str | None] = mapped_column(String(140), nullable=True)
    entries: Mapped[list[dict[str, Any]]] = mapped_column(MutableList.as_mutable(JSON_VARIANT), default=list)
    meta_data: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)


class Ticket(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Support tickets submitted by players."""

    __tablename__ = "tickets"

    player_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("players.id", ondelete="SET NULL"), nullable=True)
    subject: Mapped[str] = mapped_column(String(140), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="open", nullable=False)
    meta_data: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON_VARIANT), default=dict)

    player: Mapped["Player | None"] = relationship("Player")


class SocialLink(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Social platforms exposed via the public API."""

    __tablename__ = "social_links"

    platform: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    url: Mapped[str] = mapped_column(String(255), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class VoteLink(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Vote links and rewards displayed to players."""

    __tablename__ = "vote_links"

    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(255), nullable=False)
    button_text: Mapped[str] = mapped_column(String(64), nullable=False, default="Vote")
    rewards: Mapped[list[str]] = mapped_column(MutableList.as_mutable(JSON_VARIANT), default=list)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class HeroSlide(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Hero slider entries for the homepage."""

    __tablename__ = "hero_slides"

    title: Mapped[str] = mapped_column(String(140), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(280), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    button_text: Mapped[str | None] = mapped_column(String(64), nullable=True)
    button_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ServerFeature(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Server feature highlights shown on the homepage."""

    __tablename__ = "server_features"

    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(64), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
