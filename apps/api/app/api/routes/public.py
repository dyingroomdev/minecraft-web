"""Public API endpoints for status, news, rules, events, leaderboards, players, and socials."""

from __future__ import annotations

import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from rcon.source import Client
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_http_client, get_redis, get_settings
from app.core.config import Settings
from app.db.models import (
    Guild,
    GuildMember,
    HeroSlide,
    Leaderboard,
    NewsPost,
    Player,
    Rank,
    RankProduct,
    Rule,
    ServerFeature,
    SocialLink,
    Ticket,
    VoteLink,
)
from app.db.models.content import Event
from app.schemas.content import (
    ContactRequestCreate,
    ContactRequestRead,
    EventRead,
    HeroSlideRead,
    LeaderboardRead,
    MinecraftDashboardRead,
    NewsDetail,
    NewsSummary,
    PlayerGuild,
    PlayerRank,
    PlayerRead,
    RuleRead,
    ServerFeatureRead,
    ServerStatusRead,
    SocialLinksRead,
    TopVoterEntry,
    TopVotersRead,
    VoteLinkRead,
)
from app.services import leaderboard_cache
from app.services.minecraft_stats import get_minecraft_leaderboard, get_minecraft_season_stats
from app.services.status_poller import ACTIVITY_KEY
from app.services.status_service import build_snapshot

router = APIRouter(prefix="/api")


STATUS_KEY = "amz:status:snapshot"
STATUS_CH = "amz:status:channel"
VOTE_TOP_COMMAND = "vote Top Monthly 1"
DISPLAY_VOTE_TOP_COMMAND = "/vote Top Monthly"
TOP_MONTH_PLACEHOLDER = "%votingplugin_top_month_{position}%"
VOTE_TOTAL_PLACEHOLDER = "%votingplugin_total%"
MAX_TOP_VOTERS = 10
NON_PLAYER_TOKENS = {"page", "top", "voters", "monthly", "all", "current", "previous", "lastmonthtop"}
RANKED_LINE_RE = re.compile(
    r"^\s*(?:#?(?P<position>\d+)[.):]\s*)?"
    r"(?P<player>[A-Za-z0-9_]{1,32})"
    r"(?:.*?\bvotes?\s*[:=]?\s*|(?:\s*[-,:|]\s*|\s+))"
    r"(?P<votes>\d[\d,]*)"
    r"(?:\s+votes?)?\s*$",
    re.IGNORECASE,
)


@router.get("/discord/widget")
async def get_discord_widget(
    client: httpx.AsyncClient = Depends(get_http_client),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    """Return public Discord widget statistics for the configured guild."""

    guild_id = settings.discord_guild_id
    social_result = await session.execute(
        select(SocialLink).where(func.lower(SocialLink.platform) == "discord")
    )
    discord_link = social_result.scalar_one_or_none()
    database_invite_url = discord_link.url if discord_link else None
    parsed_database_invite = urlparse(database_invite_url or "")
    valid_discord_hosts = {"discord.gg", "discord.com", "www.discord.com"}
    fallback_invite_url = (
        database_invite_url
        if parsed_database_invite.hostname in valid_discord_hosts
        else settings.discord_invite_url or None
    )
    payload: dict = {}
    try:
        response = await client.get(
            f"{settings.discord_api_base.rstrip('/')}/guilds/{guild_id}/widget.json",
            timeout=5.0,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        pass

    invite_url = payload.get("instant_invite") or fallback_invite_url
    member_count = None
    presence_count = payload.get("presence_count")
    guild_name = payload.get("name")
    if isinstance(invite_url, str) and invite_url:
        invite_code = urlparse(invite_url).path.strip("/").split("/")[-1]
        if invite_code:
            try:
                invite_response = await client.get(
                    f"{settings.discord_api_base.rstrip('/')}/invites/{invite_code}",
                    params={"with_counts": "true"},
                    timeout=5.0,
                )
                invite_response.raise_for_status()
                invite_payload = invite_response.json()
                member_count = invite_payload.get("approximate_member_count")
                presence_count = invite_payload.get("approximate_presence_count", presence_count)
                guild_name = invite_payload.get("guild", {}).get("name", guild_name)
            except (httpx.HTTPError, ValueError):
                pass

    channels = payload.get("channels")
    return {
        "available": member_count is not None or presence_count is not None,
        "guild_id": guild_id,
        "name": guild_name,
        "member_count": member_count,
        "presence_count": presence_count,
        "invite_url": invite_url,
        "channel_count": len(channels) if isinstance(channels, list) else None,
    }


def _contact_request_read(ticket: Ticket) -> ContactRequestRead:
    metadata = ticket.meta_data or {}
    return ContactRequestRead(
        id=ticket.id,
        request_type=metadata.get("request_type", "contact"),
        name=metadata.get("name", "Unknown"),
        email=metadata.get("email", ""),
        minecraft_username=metadata.get("minecraft_username"),
        subject=ticket.subject,
        message=ticket.body,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.get("/status", response_model=ServerStatusRead)
async def get_server_status(
    r: aioredis.Redis = Depends(get_redis),
    s: Settings = Depends(get_settings)
) -> dict:
    cached = await r.get(STATUS_KEY)
    if cached:
        return json.loads(cached)

    snap = await build_snapshot(s.mc_java_host, s.mc_bedrock_host, s.mcsrv_base)
    await r.setex(STATUS_KEY, s.status_ttl_seconds, json.dumps(snap))
    return snap


@router.get("/news", response_model=list[NewsSummary])
async def list_news(session: AsyncSession = Depends(get_db_session)) -> list[NewsPost]:
    now = datetime.now(timezone.utc)
    stmt = (
        select(NewsPost)
        .where(
            NewsPost.is_draft.is_(False),
            (NewsPost.scheduled_publish_at.is_(None)) | (NewsPost.scheduled_publish_at <= now),
            (NewsPost.published_at.is_(None)) | (NewsPost.published_at <= now),
        )
        .order_by(desc(NewsPost.is_pinned), NewsPost.published_at.desc().nullslast())
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/news/{slug}", response_model=NewsDetail)
async def get_news_detail(slug: str, session: AsyncSession = Depends(get_db_session)) -> NewsPost:
    now = datetime.now(timezone.utc)
    stmt = select(NewsPost).where(
        NewsPost.slug == slug,
        NewsPost.is_draft.is_(False),
        (NewsPost.scheduled_publish_at.is_(None)) | (NewsPost.scheduled_publish_at <= now),
        (NewsPost.published_at.is_(None)) | (NewsPost.published_at <= now),
    )
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


@router.get("/events", response_model=list[EventRead])
async def list_events(session: AsyncSession = Depends(get_db_session)) -> list[Event]:
    stmt = (
        select(Event)
        .order_by(Event.start_at.nullsfirst(), Event.created_at)
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/events/{slug}", response_model=EventRead)
async def get_event_detail(slug: str, session: AsyncSession = Depends(get_db_session)) -> Event:
    stmt = select(Event).where(Event.slug == slug)
    result = await session.execute(stmt)
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.get("/events/calendar.ics")
async def download_events_calendar(session: AsyncSession = Depends(get_db_session)) -> Response:
    stmt = select(Event).order_by(Event.start_at.nullsfirst(), Event.created_at)
    result = await session.execute(stmt)
    events = result.scalars().all()

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AmzCraft//Events Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]

    for event in events:
        lines.extend(_format_event_ics(event))

    lines.append("END:VCALENDAR")
    content = "\r\n".join(lines) + "\r\n"
    return Response(
        content=content,
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="amzcraft-events.ics"'},
    )


def _stat_value(stats: dict, keys: tuple[str, ...]) -> int:
    for key in keys:
        value = stats.get(key)
        if isinstance(value, bool):
            continue
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str):
            try:
                return int(float(value.replace(",", "")))
            except ValueError:
                continue
    return 0


@router.get("/minecraft/dashboard", response_model=MinecraftDashboardRead)
async def get_minecraft_dashboard(
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    redis: aioredis.Redis = Depends(get_redis),
) -> MinecraftDashboardRead:
    """Return website-ready Minecraft statistics stored by the platform."""

    leaderboard_result = await session.execute(
        select(Leaderboard).order_by(Leaderboard.updated_at.desc()).limit(1),
    )
    leaderboard = leaderboard_result.scalar_one_or_none()

    player_result = await session.execute(select(Player.stats))
    player_stats = player_result.scalars().all()
    guild_result = await session.execute(select(func.count(Guild.id)))
    active_guilds = int(guild_result.scalar_one() or 0)
    luckperms_rank_result = await session.execute(
        select(func.count(func.distinct(RankProduct.lp_group))).where(
            RankProduct.is_active.is_(True),
            RankProduct.lp_group.is_not(None),
            RankProduct.lp_group != "",
        )
    )
    luckperms_rank_count = int(luckperms_rank_result.scalar_one() or 0)

    stored_stats = {
        "total_kills": sum(
            _stat_value(stats or {}, ("total_kills", "kills", "player_kills"))
            for stats in player_stats
        ),
        "blocks_placed": sum(
            _stat_value(stats or {}, ("blocks_placed", "placed_blocks"))
            for stats in player_stats
        ),
        "active_guilds": active_guilds,
        "quests_completed": sum(
            _stat_value(stats or {}, ("quests_completed", "completed_quests"))
            for stats in player_stats
        ),
    }
    try:
        season_stats, live_leaderboard = await asyncio.gather(
            get_minecraft_season_stats(settings),
            get_minecraft_leaderboard(settings),
        )
    except Exception:
        season_stats = {
            "total_kills": stored_stats["total_kills"],
            "unique_players": len(player_stats),
            "active_teams": active_guilds,
            "luckperms_ranks": luckperms_rank_count,
            "total_playtime_hours": sum(
                _stat_value(stats or {}, ("playtime_hours", "total_playtime_hours"))
                for stats in player_stats
            ),
        }
        live_leaderboard = []
    else:
        season_stats = {
            **season_stats,
            "luckperms_ranks": luckperms_rank_count,
        }

    if stored_stats["blocks_placed"] > 0:
        season_stats["blocks_placed"] = stored_stats["blocks_placed"]

    activity_rows = await redis.lrange(ACTIVITY_KEY, 0, 9)
    live_activity = []
    for row in activity_rows:
        try:
            live_activity.append(json.loads(row))
        except (TypeError, json.JSONDecodeError):
            continue

    return MinecraftDashboardRead(
        season_stats=season_stats,
        leaderboard=LeaderboardRead.model_validate(leaderboard) if leaderboard else None,
        live_leaderboard=live_leaderboard,
        live_activity=live_activity,
        live_activity_source="rcon",
    )


@router.get("/leaderboards/{season}/{leaderboard_type}", response_model=LeaderboardRead)
async def get_leaderboard(
    season: str,
    leaderboard_type: str,
    session: AsyncSession = Depends(get_db_session),
) -> Leaderboard:
    cached = leaderboard_cache.get(season, leaderboard_type)
    if cached is not None:
        return cached

    stmt = select(Leaderboard).where(
        Leaderboard.season == season,
        Leaderboard.leaderboard_type == leaderboard_type,
    )
    result = await session.execute(stmt)
    leaderboard = result.scalar_one_or_none()
    if leaderboard is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leaderboard not found")
    payload = LeaderboardRead.model_validate(leaderboard)
    leaderboard_cache.set(season, leaderboard_type, payload)
    return payload


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


@router.post("/contact", response_model=ContactRequestRead, status_code=status.HTTP_201_CREATED)
async def submit_contact_request(
    payload: ContactRequestCreate,
    session: AsyncSession = Depends(get_db_session),
) -> ContactRequestRead:
    ticket = Ticket(
        subject=payload.subject,
        body=payload.message,
        status="open",
        meta_data={
            "request_type": payload.request_type,
            "name": payload.name,
            "email": payload.email,
            "minecraft_username": payload.minecraft_username,
        },
    )
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    return _contact_request_read(ticket)


@router.get("/votes", response_model=list[VoteLinkRead])
async def list_vote_links(session: AsyncSession = Depends(get_db_session)) -> list[VoteLink]:
    stmt = (
        select(VoteLink)
        .where(VoteLink.is_active.is_(True))
        .order_by(VoteLink.display_order, VoteLink.created_at)
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/votes/top", response_model=TopVotersRead)
async def get_top_voters(
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> TopVotersRead:
    stmt = select(Leaderboard).where(
        Leaderboard.season == "live",
        Leaderboard.leaderboard_type == "votes",
    )
    result = await session.execute(stmt)
    leaderboard = result.scalar_one_or_none()
    if (
        leaderboard is None
        or not leaderboard.entries
        or _entries_need_vote_counts(leaderboard.entries, leaderboard.updated_at)
    ):
        prev_votes: dict[str, int] = {}
        if leaderboard and leaderboard.entries:
            for _e in leaderboard.entries:
                if isinstance(_e, dict) and int(_e.get("votes", 0) or 0) > 0:
                    prev_votes[str(_e.get("player", "")).lower()] = int(_e["votes"])
        live_entries, raw_response = await _fetch_live_top_voters(settings, prev_votes)
        if live_entries:
            now = datetime.now(timezone.utc)
            metadata = {
                "source": "rcon",
                "command": VOTE_TOP_COMMAND,
                "display_command": DISPLAY_VOTE_TOP_COMMAND,
                "raw_response": raw_response,
                "synced_at": now.isoformat(),
            }
            if leaderboard is None:
                leaderboard = Leaderboard(
                    season="live",
                    leaderboard_type="votes",
                    title="Current Month Top Voters",
                    entries=live_entries,
                    meta_data=metadata,
                )
                session.add(leaderboard)
            else:
                leaderboard.title = "Current Month Top Voters"
                leaderboard.entries = live_entries
                leaderboard.meta_data = metadata
                leaderboard.updated_at = now
            await session.commit()
            await session.refresh(leaderboard)
        elif leaderboard is None:
            return TopVotersRead()

    normalized_entries = sorted(
        [e for e in (leaderboard.entries or []) if isinstance(e, dict)],
        key=lambda e: int(e.get("position", 999)),
    )
    entries: list[TopVoterEntry] = []
    for row in normalized_entries:
        if not isinstance(row, dict):
            continue
        player = str(row.get("player") or row.get("name") or "").strip()
        if not player:
            continue
        raw_votes = row.get("votes", row.get("score", 0))
        try:
            votes = int(float(str(raw_votes).replace(",", "")))
        except (TypeError, ValueError):
            votes = 0
        raw_position = row.get("position", len(entries) + 1)
        try:
            position = int(raw_position)
        except (TypeError, ValueError):
            position = index
        metadata = row.get("metadata")
        entries.append(
            TopVoterEntry(
                position=position,
                player=player,
                votes=votes,
                metadata=metadata if isinstance(metadata, dict) else {},
            )
        )

    return TopVotersRead(updated_at=leaderboard.updated_at, entries=entries)


async def _fetch_live_top_voters(
    settings: Settings, prev_votes: dict[str, int] | None = None
) -> tuple[list[dict], str]:
    if not settings.minecraft_rcon_password:
        return [], "missing_rcon_password"
    try:
        return await asyncio.to_thread(
            _fetch_live_top_voters_sync,
            settings.minecraft_rcon_host,
            settings.minecraft_rcon_port,
            settings.minecraft_rcon_password,
            prev_votes or {},
        )
    except Exception as exc:
        return [], f"rcon_error: {exc}"


def _parse_vote_top_direct(response: str) -> list[dict]:
    entries: list[dict] = []
    seen_players: set[str] = set()
    for line in response.splitlines():
        cleaned = _strip_minecraft_formatting(line)
        if not cleaned:
            continue
        match = RANKED_LINE_RE.match(cleaned)
        if not match:
            continue
        player = match.group("player")
        if player.lower() in NON_PLAYER_TOKENS or player.lower() in seen_players:
            continue
        seen_players.add(player.lower())
        votes = int(match.group("votes").replace(",", ""))
        raw_position = match.group("position")
        position = int(raw_position) if raw_position else len(entries) + 1
        entries.append({
            "position": position,
            "player": player,
            "score": votes,
            "votes": votes,
            "metadata": {"source": "rcon", "command": DISPLAY_VOTE_TOP_COMMAND},
        })
    return _rank_vote_entries(entries)


def _fetch_live_top_voters_sync(
    host: str, port: int, password: str, prev_votes: dict[str, int] | None = None
) -> tuple[list[dict], str]:
    raw_parts: list[str] = []
    with Client(host, port, passwd=password, timeout=15) as client:
        command_response = client.run(VOTE_TOP_COMMAND) or ""
        raw_parts.append(f"{VOTE_TOP_COMMAND}: {command_response}")
        entries = _parse_vote_top_direct(command_response)
        if entries:
            return entries, "\n".join(raw_parts)
        list_response = client.run("list") or ""
        raw_parts.append(f"list: {list_response}")
        players = _parse_online_players(list_response)
        if not players:
            return [], "\n".join(raw_parts)

        parse_player = players[0]
        entries: list[dict] = []
        seen_players: set[str] = set()
        for position in range(1, MAX_TOP_VOTERS + 1):
            placeholder = TOP_MONTH_PLACEHOLDER.format(position=position)
            response = client.run(f"papi parse {parse_player} {placeholder}") or ""
            raw_parts.append(f"{placeholder}: {response}")
            player = _strip_minecraft_formatting(response)
            if not _is_valid_player_name(player) or player.lower() in seen_players:
                continue
            seen_players.add(player.lower())
            vote_count, vote_count_response = _fetch_player_vote_count(client, player)
            raw_parts.append(f"{player} {VOTE_TOTAL_PLACEHOLDER}: {vote_count_response}")
            is_live = vote_count > 0
            if not is_live and prev_votes and player.lower() in prev_votes:
                vote_count = prev_votes[player.lower()]
            entries.append(
                {
                    "position": position,
                    "player": player,
                    "score": vote_count,
                    "votes": vote_count,
                    "metadata": {
                        "source": "placeholderapi",
                        "command": DISPLAY_VOTE_TOP_COMMAND,
                        "placeholder": placeholder,
                        "vote_count_placeholder": VOTE_TOTAL_PLACEHOLDER,
                        "votes_available": is_live or (bool(prev_votes) and player.lower() in prev_votes),
                    },
                }
            )

        entries.sort(key=lambda e: e.get("position", MAX_TOP_VOTERS + 1))
        for idx, e in enumerate(entries, 1):
            e["position"] = idx
        return entries, "\n".join(raw_parts)


def _rank_vote_entries(entries: object) -> list[dict]:
    if not isinstance(entries, list):
        return []
    ranked_entries = sorted(
        [entry for entry in entries if isinstance(entry, dict)],
        key=lambda item: (
            -_safe_vote_value(item.get("votes", item.get("score", 0))),
            _safe_vote_value(item.get("position", MAX_TOP_VOTERS + 1)),
            str(item.get("player", item.get("name", ""))).lower(),
        ),
    )
    for position, entry in enumerate(ranked_entries, start=1):
        entry["position"] = position
    return ranked_entries


def _entries_need_vote_counts(entries: object, updated_at: datetime | None) -> bool:
    if not isinstance(entries, list) or not entries:
        return False
    if updated_at is None:
        return True
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if updated_at.date() < now.date():
        return True
    if (now - updated_at).total_seconds() > 6 * 3600:
        return True
    for row in entries:
        if not isinstance(row, dict):
            continue
        metadata = row.get("metadata")
        if isinstance(metadata, dict) and metadata.get("votes_available") is False:
            return True
    return all(
        int(_safe_vote_value(row.get("votes", row.get("score", 0)))) <= 0
        for row in entries
        if isinstance(row, dict)
    )


def _fetch_player_vote_count(client: Client, player: str) -> tuple[int, str]:
    response = client.run(f"papi parse {player} {VOTE_TOTAL_PLACEHOLDER}") or ""
    return _parse_vote_count(response), response


def _parse_vote_count(response: str) -> int:
    cleaned = _strip_minecraft_formatting(response)
    match = re.search(r"\d[\d,]*", cleaned)
    if not match:
        return 0
    return int(match.group(0).replace(",", ""))


def _safe_vote_value(value: object) -> int:
    try:
        return int(float(str(value).replace(",", "")))
    except (TypeError, ValueError):
        return 0


def _parse_online_players(response: str) -> list[str]:
    cleaned = _strip_minecraft_formatting(response)
    if ":" not in cleaned:
        return []
    _, players_text = cleaned.rsplit(":", 1)
    return [
        player.strip()
        for player in players_text.split(",")
        if _is_valid_player_name(player.strip())
    ]


def _is_valid_player_name(value: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9_]{1,32}", value)) and value.lower() not in NON_PLAYER_TOKENS


def _strip_minecraft_formatting(value: str) -> str:
    without_hex_codes = re.sub(r"(?:§x|&x)(?:(?:§|&)[0-9A-Fa-f]){6}", "", value)
    without_codes = re.sub(r"(?:§|&)[0-9A-FK-ORa-fk-or]", "", without_hex_codes)
    without_brackets = re.sub(r"^[^\w#]+|[^\w]+$", "", without_codes)
    return re.sub(r"\s+", " ", without_brackets).strip()


@router.get("/hero-slides", response_model=list[HeroSlideRead])
async def list_hero_slides(session: AsyncSession = Depends(get_db_session)) -> list[HeroSlide]:
    stmt = (
        select(HeroSlide)
        .where(HeroSlide.is_active.is_(True))
        .order_by(HeroSlide.display_order, HeroSlide.created_at)
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/ranks", response_model=list[dict])
async def list_ranks(session: AsyncSession = Depends(get_db_session)) -> list[dict]:
    """Get all available ranks with their benefits and information."""
    stmt = select(Rank).order_by(Rank.priority.desc(), Rank.name)
    result = await session.execute(stmt)
    ranks = result.scalars().all()

    return [
        {
            "id": str(rank.id),
            "name": rank.name,
            "display_name": rank.display_name,
            "priority": rank.priority,
            "benefits": rank.meta_data.get("benefits", ""),
            "description": rank.meta_data.get("description", ""),
            "color": rank.meta_data.get("color", "#ffffff"),
            "icon": rank.meta_data.get("icon", "star"),
            "image_url": _get_rank_image_url(rank)
        }
        for rank in ranks
    ]


def _get_rank_image_url(rank) -> str:
    """Get the correct image URL for a rank, handling both full URLs and filenames."""
    icon = rank.meta_data.get('icon')
    if not icon:
        return f"/api/media/ranks/{rank.name.lower()}.png"

    # If icon already contains a full URL, return as is
    if icon.startswith('http'):
        return icon

    # If icon contains /api/media/, extract just the filename
    if '/api/media/' in icon:
        filename = icon.split('/api/media/')[-1]
        return f"/api/media/{filename}"

    # Otherwise treat as filename
    return f"/api/media/{icon}"


@router.get("/features", response_model=list[ServerFeatureRead])
async def list_server_features(session: AsyncSession = Depends(get_db_session)) -> list[ServerFeature]:
    stmt = (
        select(ServerFeature)
        .where(ServerFeature.is_active.is_(True))
        .order_by(ServerFeature.display_order, ServerFeature.created_at)
    )
    result = await session.execute(stmt)
    return result.scalars().all()


def _format_event_ics(event: Event) -> list[str]:
    lines = ["BEGIN:VEVENT"]
    now = datetime.now(timezone.utc)
    lines.append(f"DTSTAMP:{_format_datetime(now)}")
    lines.append(f"UID:{event.id}@amzcraft")
    if event.start_at:
        lines.append(f"DTSTART:{_format_datetime(event.start_at)}")
    else:
        lines.append(f"DTSTART:{_format_datetime(event.created_at)}")
    if event.end_at:
        lines.append(f"DTEND:{_format_datetime(event.end_at)}")
    lines.append(f"SUMMARY:{_escape_ics(event.title)}")
    if event.description:
        lines.append(f"DESCRIPTION:{_escape_ics(event.description)}")
    if event.location:
        lines.append(f"LOCATION:{_escape_ics(event.location)}")
    lines.append("END:VEVENT")
    return lines


def _format_datetime(value: datetime) -> str:
    dt = value
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y%m%dT%H%M%SZ")


def _escape_ics(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )
