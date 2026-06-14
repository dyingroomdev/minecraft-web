"""Pydantic schemas for public content and admin management."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.enums import RBACRole


class ServerStatusRead(BaseModel):
    online: bool
    player_count: int = 0
    max_players: int = 0
    motd: str | None = None
    version: str | None = None
    java_ip: str | None = None
    bedrock_ip: str | None = None
    last_poll_utc: datetime
    ws_clients: int | None = None

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
    slug: str | None = None
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


class RuleReorder(BaseModel):
    order: list[uuid.UUID]


class EventRead(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    description: str
    featured_image_url: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    location: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventCreate(BaseModel):
    slug: str
    title: str
    description: str
    featured_image_url: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    location: str | None = None
    is_active: bool = False


class EventUpdate(BaseModel):
    slug: str | None = None
    title: str | None = None
    description: str | None = None
    featured_image_url: str | None = None
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
    metadata: dict[str, Any] = Field(alias="meta_data", serialization_alias="metadata")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class MinecraftDashboardRead(BaseModel):
    season_stats: dict[str, int] = Field(default_factory=dict)
    leaderboard: LeaderboardRead | None = None
    live_leaderboard: list[LeaderboardEntry] = Field(default_factory=list)
    live_activity: list[dict[str, Any]] = Field(default_factory=list)
    live_activity_source: str = "not_configured"


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
    website: str | None = None


class SocialLinksUpdate(BaseModel):
    facebook: str | None = None
    twitter: str | None = None
    discord: str | None = None
    youtube: str | None = None
    tiktok: str | None = None
    instagram: str | None = None
    website: str | None = None


ContactRequestType = Literal["ban_appeal", "bug_report", "staff_application", "contact"]
ContactRequestStatus = Literal["open", "in_progress", "resolved", "closed"]


class ContactRequestCreate(BaseModel):
    request_type: ContactRequestType
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    minecraft_username: str | None = Field(default=None, max_length=32)
    subject: str = Field(min_length=3, max_length=140)
    message: str = Field(min_length=10, max_length=5000)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("name", "subject", "message")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("minecraft_username")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        normalized = value.strip() if value else ""
        return normalized or None


class ContactRequestRead(BaseModel):
    id: uuid.UUID
    request_type: ContactRequestType
    name: str
    email: str
    minecraft_username: str | None = None
    subject: str
    message: str
    status: str
    created_at: datetime
    updated_at: datetime


class ContactRequestStatusUpdate(BaseModel):
    status: ContactRequestStatus


class VoteLinkRead(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    url: str
    button_text: str
    rewards: list[str]
    display_order: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class VoteLinkCreate(BaseModel):
    title: str
    description: str | None = None
    url: str
    button_text: str = "Vote"
    rewards: list[str] = Field(default_factory=list)
    display_order: int = 0
    is_active: bool = True


class VoteLinkUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    url: str | None = None
    button_text: str | None = None
    rewards: list[str] | None = None
    display_order: int | None = None
    is_active: bool | None = None


class HeroSlideRead(BaseModel):
    id: uuid.UUID
    title: str
    subtitle: str | None = None
    image_url: str | None = None
    button_text: str | None = None
    button_url: str | None = None
    display_order: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class HeroSlideCreate(BaseModel):
    title: str
    subtitle: str | None = None
    image_url: str | None = None
    button_text: str | None = None
    button_url: str | None = None
    display_order: int = 0
    is_active: bool = True


class HeroSlideUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    image_url: str | None = None
    button_text: str | None = None
    button_url: str | None = None
    display_order: int | None = None
    is_active: bool | None = None


class ServerFeatureRead(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    icon: str | None = None
    display_order: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ServerFeatureCreate(BaseModel):
    title: str
    description: str
    icon: str | None = None
    display_order: int = 0
    is_active: bool = True


class ServerFeatureUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    icon: str | None = None
    display_order: int | None = None
    is_active: bool | None = None
