"""Public API endpoints for status, news, rules, events, leaderboards, players, and socials."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

import aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Select, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_settings_dependency
from app.core.config import Settings
from app.db.models import (
    Guild,
    GuildMember,
    Leaderboard,
    NewsPost,
    Player,
    Rank,
    Rule,
    ServerStatus,
    SocialLink,
)
from app.schemas.content import (
    EventRead,
    LeaderboardRead,
    NewsDetail,
    NewsSummary,
    PlayerGuild,
    PlayerRank,
    PlayerRead,
    RuleRead,
    ServerStatusRead,
    SocialLinksRead,
)
from app.db.models.content import Event

router = APIRouter(prefix="/api")


async def _ensure_latest_server_status(session: AsyncSession) -> ServerStatus | None:
    stmt: Select = select(ServerStatus).order_by(desc(ServerStatus.recorded_at)).limit(1)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


@router.get("/status", response_model=ServerStatusRead)
async def get_server_status(session: AsyncSession = Depends(get_db_session)) -> ServerStatus:
    status_row = await _ensure_latest_server_status(session)
    if status_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server status unavailable")
    return status_row


@router.get("/news", response_model=list[NewsSummary])
async def list_news(session: AsyncSession = Depends(get_db_session)) -> list[NewsPost]:
    stmt = (
        select(NewsPost)
        .where(NewsPost.is_draft.is_(False))
        .order_by(desc(NewsPost.is_pinned), desc(NewsPost.published_at.nullslast()))
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/news/{slug}", response_model=NewsDetail)
async def get_news_detail(slug: str, session: AsyncSession = Depends(get_db_session)) -> NewsPost:
    stmt = select(NewsPost).where(NewsPost.slug == slug, NewsPost.is_draft.is_(False))
    result = await session.execute(stmt)
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News post not found")
    return post


@router.get("/rules", response_model=list[RuleRead])
async def list_rules(session: AsyncSession = Depends(get_db_session)) -> list[Rule]:
    stmt = select(Rule).order_by(desc(Rule.is_pinned), Rule.display_order, Rule.created_at)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/events/active", response_model=list[EventRead])
async def list_active_events(session: AsyncSession = Depends(get_db_session)) -> list[Event]:
    now = datetime.now(timezone.utc)
    stmt = select(Event).where(
        (Event.is_active.is_(True))
        | (
            Event.start_at.is_not(None)
            & Event.end_at.is_not(None)
            & (Event.start_at <= now)
            & (Event.end_at >= now)
        )
        | (
            Event.start_at.is_not(None)
            & Event.end_at.is_(None)
            & (Event.start_at <= now)
        )
    ).order_by(Event.start_at.nullsfirst())
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/leaderboards/{season}/{leaderboard_type}", response_model=LeaderboardRead)
async def get_leaderboard(
    season: str,
    leaderboard_type: str,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> Leaderboard:
    # Try cache first
    redis = aioredis.from_url(settings.redis_url)
    cache_key = f"leaderboard:{season}:{leaderboard_type}"
    
    try:
        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            return Leaderboard(**data)
    except Exception:
        pass  # Cache miss, continue to DB
    finally:
        await redis.close()
    
    stmt = select(Leaderboard).where(
        Leaderboard.season == season,
        Leaderboard.leaderboard_type == leaderboard_type,
    )
    result = await session.execute(stmt)
    leaderboard = result.scalar_one_or_none()
    if leaderboard is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leaderboard not found")
    
    # Cache for 5 minutes
    try:
        redis = aioredis.from_url(settings.redis_url)
        await redis.setex(cache_key, 300, json.dumps({
            "id": str(leaderboard.id),
            "season": leaderboard.season,
            "leaderboard_type": leaderboard.leaderboard_type,
            "title": leaderboard.title,
            "entries": leaderboard.entries,
            "metadata": leaderboard.metadata
        }))
        await redis.close()
    except Exception:
        pass  # Cache write failure, continue
    
    return leaderboard


async def _load_player(session: AsyncSession, player_id: uuid.UUID) -> Player | None:
    stmt = select(Player).where(Player.id == player_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def _load_player_rank(session: AsyncSession, player: Player) -> Rank | None:
    if player.rank_id is None:
        return None
    stmt = select(Rank).where(Rank.id == player.rank_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def _load_player_guild(session: AsyncSession, player: Player) -> Guild | None:
    stmt = (
        select(Guild)
        .join(GuildMember, GuildMember.guild_id == Guild.id)
        .where(GuildMember.player_id == player.id)
        .order_by(GuildMember.joined_at.asc())
    )
    result = await session.execute(stmt)
    return result.scalars().first()


@router.get("/players/{player_id}", response_model=PlayerRead)
async def get_player(
    player_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> PlayerRead:
    player = await _load_player(session, player_id)
    if player is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    rank = await _load_player_rank(session, player)
    guild = await _load_player_guild(session, player)

    rank_schema = None
    if rank is not None:
        rank_schema = PlayerRank.model_validate(rank)

    guild_schema = None
    if guild is not None:
        guild_schema = PlayerGuild.model_validate(guild)

    return PlayerRead(
        id=player.id,
        minecraft_uuid=player.minecraft_uuid,
        username=player.username,
        stats=player.stats,
        rank=rank_schema,
        guild=guild_schema,
    )


@router.get("/social", response_model=SocialLinksRead)
async def get_social_links(session: AsyncSession = Depends(get_db_session)) -> SocialLinksRead:
    stmt = select(SocialLink).order_by(SocialLink.display_order)
    result = await session.execute(stmt)
    links = result.scalars().all()
    payload = {link.platform.lower(): link.url for link in links}
    return SocialLinksRead(**payload)
*** End of File
