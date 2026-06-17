"""Sync current month top voters from the Minecraft server."""

from __future__ import annotations

import asyncio
import re
from datetime import UTC, datetime
from typing import Any

import structlog
from rcon.source import Client
from sqlalchemy import select

from worker.config import get_worker_settings
from worker.database import get_worker_session
from worker.models import Leaderboard

logger = structlog.get_logger()

VOTE_TOP_COMMAND = "vote Top Monthly 1"
DISPLAY_VOTE_TOP_COMMAND = "/vote Top Monthly"
TOP_MONTH_PLACEHOLDER = "%votingplugin_top_month_{position}%"
VOTE_TOTAL_PLACEHOLDER = "%votingplugin_total%"
MAX_TOP_VOTERS = 10
RANKED_LINE_RE = re.compile(
    r"^\s*(?:#?(?P<position>\d+)[.):]\s*)?"
    r"(?P<player>[A-Za-z0-9_]{1,32})"
    r"(?:.*?\bvotes?\s*[:=]?\s*|(?:\s*[-,:|]\s*|\s+))"
    r"(?P<votes>\d[\d,]*)"
    r"(?:\s+votes?)?\s*$",
    re.IGNORECASE,
)
NON_PLAYER_TOKENS = {"page", "top", "voters", "monthly", "all", "current", "previous", "lastmonthtop"}


def parse_vote_top_response(response: str) -> list[dict[str, Any]]:
    """Parse common vote leaderboard output formats into normalized entries."""
    entries: list[dict[str, Any]] = []
    seen_players: set[str] = set()

    for line in response.splitlines():
        cleaned = _strip_minecraft_formatting(line)
        if not cleaned:
            continue
        match = RANKED_LINE_RE.match(cleaned)
        if not match:
            continue

        player = match.group("player")
        if player.lower() in NON_PLAYER_TOKENS:
            continue
        if player.lower() in seen_players:
            continue
        seen_players.add(player.lower())

        votes = int(match.group("votes").replace(",", ""))
        raw_position = match.group("position")
        position = int(raw_position) if raw_position else len(entries) + 1
        entries.append(
            {
                "position": position,
                "player": player,
                "score": votes,
                "votes": votes,
                "metadata": {"source": "rcon", "command": DISPLAY_VOTE_TOP_COMMAND},
            }
        )

    return _rank_entries(entries)


async def sync_vote_top() -> None:
    """Fetch the current month vote leaderboard over RCON and store it."""
    settings = get_worker_settings()
    if not settings.minecraft_rcon_password:
        logger.warning("vote_top_sync.skipped", reason="missing_rcon_password")
        return

    async with get_worker_session() as session:
        result = await session.execute(
            select(Leaderboard).where(
                Leaderboard.season == "live",
                Leaderboard.leaderboard_type == "votes",
            )
        )
        leaderboard = result.scalar_one_or_none()

    prev_votes: dict[str, int] = {}
    if leaderboard and leaderboard.entries:
        for _e in leaderboard.entries:
            if isinstance(_e, dict) and int(_e.get("votes", 0) or 0) > 0:
                prev_votes[str(_e.get("player", "")).lower()] = int(_e["votes"])

    response, entries = await asyncio.to_thread(
        _fetch_vote_top_entries,
        settings.minecraft_rcon_host,
        settings.minecraft_rcon_port,
        settings.minecraft_rcon_password,
        prev_votes,
    )

    async with get_worker_session() as session:
        result = await session.execute(
            select(Leaderboard).where(
                Leaderboard.season == "live",
                Leaderboard.leaderboard_type == "votes",
            )
        )
        leaderboard = result.scalar_one_or_none()
        now = datetime.now(UTC)
        metadata = {
            "source": "rcon",
            "command": VOTE_TOP_COMMAND,
            "display_command": DISPLAY_VOTE_TOP_COMMAND,
            "raw_response": response,
            "synced_at": now.isoformat(),
        }

        if leaderboard is None:
            leaderboard = Leaderboard(
                season="live",
                leaderboard_type="votes",
                title="Current Month Top Voters",
                entries=entries,
                meta_data=metadata,
            )
            session.add(leaderboard)
        else:
            leaderboard.title = "Current Month Top Voters"
            leaderboard.entries = entries
            leaderboard.meta_data = metadata
            leaderboard.updated_at = now

        await session.commit()

    if entries:
        logger.info("vote_top_sync.completed", entries=len(entries))
    else:
        logger.warning("vote_top_sync.no_entries", raw_response=response)


def _fetch_vote_top_entries(
    host: str, port: int, password: str, prev_votes: dict[str, int] | None = None
) -> tuple[str, list[dict[str, Any]]]:
    """Fetch top voters using RCON command output, then PAPI placeholders as fallback."""
    raw_parts: list[str] = []
    with Client(host, port, passwd=password, timeout=15) as client:
        command_response = client.run(VOTE_TOP_COMMAND) or ""
        raw_parts.append(f"{VOTE_TOP_COMMAND}: {command_response}")
        entries = parse_vote_top_response(command_response)
        if entries:
            return "\n".join(raw_parts), entries

        list_response = client.run("list") or ""
        raw_parts.append(f"list: {list_response}")
        players = _parse_online_players(list_response)
        if not players:
            return "\n".join(raw_parts), []

        parse_player = players[0]
        placeholder_entries: list[dict[str, Any]] = []
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
            placeholder_entries.append(
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

        placeholder_entries.sort(key=lambda e: e.get("position", MAX_TOP_VOTERS + 1))
        for idx, e in enumerate(placeholder_entries, 1):
            e["position"] = idx
        return "\n".join(raw_parts), placeholder_entries


def _rank_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ranked_entries = sorted(
        entries,
        key=lambda item: (
            -_entry_vote_count(item),
            int(item.get("position", MAX_TOP_VOTERS + 1)),
            str(item.get("player", "")).lower(),
        ),
    )
    for position, entry in enumerate(ranked_entries, start=1):
        entry["position"] = position
    return ranked_entries


def _entry_vote_count(entry: dict[str, Any]) -> int:
    raw_votes = entry.get("votes", entry.get("score", 0))
    try:
        return int(float(str(raw_votes).replace(",", "")))
    except (TypeError, ValueError):
        return 0


def _fetch_player_vote_count(client: Client, player: str) -> tuple[int, str]:
    response = client.run(f"papi parse {player} {VOTE_TOTAL_PLACEHOLDER}") or ""
    return _parse_vote_count(response), response


def _parse_vote_count(response: str) -> int:
    cleaned = _strip_minecraft_formatting(response)
    match = re.search(r"\d[\d,]*", cleaned)
    if not match:
        return 0
    return int(match.group(0).replace(",", ""))


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
