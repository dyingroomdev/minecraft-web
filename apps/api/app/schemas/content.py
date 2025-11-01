"""Pydantic schemas for public content and admin management."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import RBACRole


class ServerStatusRead(BaseModel):
    status: str
    players_online: int
    players_max: int
    motd: str | None = None
    recorded_at: datetime
    metadata: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class NewsSummary(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    summary: str | None = None
    published_at: datetime | None = None
    scheduled_publish_at: datetime | None = None
    cover_image_url: str | None = None
    is_pinned: bool

    model_config = ConfigDict(from_attributes=True)


class NewsDetail(NewsSummary):
    content: str


class NewsCreate(BaseModel):
    slug: str | None = None  # Auto-generated if not provided
    title: str
    content: str
    summary: str | None = None
    published_at: datetime | None = None
    scheduled_publish_at: datetime | None = None
    cover_image_url: str | None = None
    is_pinned: bool = False
    is_draft: bool = False


class NewsUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    summary: str | None = None
    published_at: datetime | None = None
    scheduled_publish_at: datetime | None = None
    cover_image_url: str | None = None
    is_pinned: bool | None = None
    is_draft: bool | None = None


class RuleRead(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    content: str
    category: str | None = None
    display_order: int
    is_pinned: bool

    model_config = ConfigDict(from_attributes=True)


class RuleCreate(BaseModel):
    slug: str
    title: str
    content: str
    category: str | None = None
    display_order: int = 0
    is_pinned: bool = False


class RuleUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category: str | None = None
    display_order: int | None = None
    is_pinned: bool | None = None


class EventRead(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    description: str
    start_at: datetime | None = None
    end_at: datetime | None = None
    location: str | None = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class EventCreate(BaseModel):
    slug: str
    title: str
    description: str
    start_at: datetime | None = None
    end_at: datetime | None = None
    location: str | None = None
    is_active: bool = False


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    location: str | None = None
    is_active: bool | None = None


class LeaderboardEntry(BaseModel):
    player: str
    score: float | int
    position: int
    metadata: dict[str, Any] = Field(default_factory=dict)


class LeaderboardRead(BaseModel):
    id: uuid.UUID
    season: str
    leaderboard_type: str
    title: str | None = None
    entries: list[LeaderboardEntry]
    metadata: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class PlayerGuild(BaseModel):
    id: uuid.UUID
    name: str
    tag: str

    model_config = ConfigDict(from_attributes=True)


class PlayerRank(BaseModel):
    id: uuid.UUID
    name: str
    display_name: str
    priority: int

    model_config = ConfigDict(from_attributes=True)


class PlayerRead(BaseModel):
    id: uuid.UUID
    minecraft_uuid: uuid.UUID
    username: str
    rank: PlayerRank | None = None
    guild: PlayerGuild | None = None
    stats: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class SocialLinksRead(BaseModel):
    facebook: str | None = None
    twitter: str | None = None
    discord: str | None = None
    youtube: str | None = None
    tiktok: str | None = None
    instagram: str | None = None


class SocialLinksUpdate(BaseModel):
    facebook: str | None = None
    twitter: str | None = None
    discord: str | None = None
    youtube: str | None = None
    tiktok: str | None = None
    instagram: str | None = None

*** End of File
