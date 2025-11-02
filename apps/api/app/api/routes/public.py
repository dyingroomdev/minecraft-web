"""Public API endpoints for status, news, rules, events, leaderboards, players, and socials."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Select, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
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
    VoteLink,
    HeroSlide,
    ServerFeature,
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
    VoteLinkRead,
    HeroSlideRead,
    ServerFeatureRead,
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
        .order_by(desc(NewsPost.is_pinned), NewsPost.published_at.desc().nullslast())
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
) -> Leaderboard:
    stmt = select(Leaderboard).where(
        Leaderboard.season == season,
        Leaderboard.leaderboard_type == leaderboard_type,
    )
    result = await session.execute(stmt)
    leaderboard = result.scalar_one_or_none()
    if leaderboard is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leaderboard not found")
    return leaderboard


async def _load_player(session: AsyncSession, identifier: str) -> Player | None:
    try:
        player_uuid = uuid.UUID(identifier)
    except ValueError:
        stmt = select(Player).where(Player.username.ilike(identifier))
    else:
        stmt = select(Player).where(Player.minecraft_uuid == player_uuid)
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


@router.get("/players/{identifier}", response_model=PlayerRead)
async def get_player(
    identifier: str,
    session: AsyncSession = Depends(get_db_session),
) -> PlayerRead:
    player = await _load_player(session, identifier)
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


@router.get("/votes", response_model=list[VoteLinkRead])
async def list_vote_links(session: AsyncSession = Depends(get_db_session)) -> list[VoteLink]:
    stmt = (
        select(VoteLink)
        .where(VoteLink.is_active.is_(True))
        .order_by(VoteLink.display_order, VoteLink.created_at)
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/hero-slides", response_model=list[HeroSlideRead])
async def list_hero_slides(session: AsyncSession = Depends(get_db_session)) -> list[HeroSlide]:
    stmt = (
        select(HeroSlide)
        .where(HeroSlide.is_active.is_(True))
        .order_by(HeroSlide.display_order, HeroSlide.created_at)
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/features", response_model=list[ServerFeatureRead])
async def list_server_features(session: AsyncSession = Depends(get_db_session)) -> list[ServerFeature]:
    stmt = (
        select(ServerFeature)
        .where(ServerFeature.is_active.is_(True))
        .order_by(ServerFeature.display_order, ServerFeature.created_at)
    )
    result = await session.execute(stmt)
    return result.scalars().all()
