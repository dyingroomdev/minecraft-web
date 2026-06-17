"""Aggregate historical Minecraft statistics exposed by installed plugins."""

from __future__ import annotations

import asyncio
import re
import time
from dataclasses import dataclass
from typing import Any

from app.core.config import Settings
from app.services.luckperms import LuckPermsService

COLOR_CODE_RE = re.compile(r"§[0-9A-FK-ORX]", re.IGNORECASE)
BALANCE_PLAYER_RE = re.compile(r"^\s*\d+\.\s+([^,]+),\s+\$([\d,]+(?:\.\d+)?)")
PAGE_COUNT_RE = re.compile(r"Page\s+\d+/(\d+)", re.IGNORECASE)
TIME_PART_RE = re.compile(r"(\d+)\s*([dhms])")
PLAYER_STATS_TTL_SECONDS = 300


@dataclass(slots=True)
class _Cache:
    expires_at: float = 0
    value: dict[str, Any] | None = None


_cache = _Cache()
_cache_lock = asyncio.Lock()


def _strip_colors(value: str) -> str:
    return COLOR_CODE_RE.sub("", value)


def _parse_playtime_seconds(value: str) -> int:
    multipliers = {"d": 86400, "h": 3600, "m": 60, "s": 1}
    return sum(int(amount) * multipliers[unit] for amount, unit in TIME_PART_RE.findall(value))


async def _execute(settings: Settings, command: str) -> str:
    client = LuckPermsService(
        settings.minecraft_rcon_host,
        settings.minecraft_rcon_port,
        settings.minecraft_rcon_password,
    )
    return _strip_colors(await client._execute(command))


async def _balance_players(settings: Settings) -> list[tuple[str, float]]:
    first_page = await _execute(settings, "essentials:baltop 1")
    if "please wait" in first_page.lower():
        await asyncio.sleep(0.5)
        first_page = await _execute(settings, "essentials:baltop 1")

    page_match = PAGE_COUNT_RE.search(first_page)
    page_count = int(page_match.group(1)) if page_match else 1
    pages = [first_page]
    if page_count > 1:
        pages.extend(
            await asyncio.gather(
                *(_execute(settings, f"essentials:baltop {page}") for page in range(2, page_count + 1)),
            ),
        )

    players: list[tuple[str, float]] = []
    seen: set[str] = set()
    for page in pages:
        for line in page.splitlines():
            match = BALANCE_PLAYER_RE.match(line)
            if not match:
                continue
            player = match.group(1).strip()
            balance = float(match.group(2).replace(",", ""))
            key = player.casefold()
            if key not in seen:
                seen.add(key)
                players.append((player, balance))
    return players


async def _player_stats(settings: Settings, player: str, semaphore: asyncio.Semaphore) -> tuple[int, int, int, str]:
    async with semaphore:
        output = await _execute(
            settings,
            (
                f"papi parse {player} "
                "%statistic_player_kills%|%statistic_time_played%|%statistic_blocks_placed%|%betterteams_name%"
            ),
        )

    kills_raw, separator, remainder = output.partition("|")
    playtime_raw, second_separator, remainder = remainder.partition("|")
    blocks_raw, third_separator, team = remainder.partition("|")
    if not separator or not second_separator or not third_separator:
        return 0, 0, 0, ""

    try:
        kills = int(kills_raw.strip())
    except ValueError:
        kills = 0
    try:
        blocks_placed = int(blocks_raw.strip().replace(",", ""))
    except ValueError:
        blocks_placed = 0
    return kills, _parse_playtime_seconds(playtime_raw), blocks_placed, team.strip()


async def _get_minecraft_data(settings: Settings) -> dict[str, Any]:
    now = time.monotonic()
    if _cache.value is not None and _cache.expires_at > now:
        return _cache.value

    async with _cache_lock:
        now = time.monotonic()
        if _cache.value is not None and _cache.expires_at > now:
            return _cache.value

        server_values, players = await asyncio.gather(
            _execute(settings, "papi parse --null %server_unique_joins%"),
            _balance_players(settings),
        )
        try:
            unique_players = int(server_values.strip())
        except ValueError:
            unique_players = len(players)

        semaphore = asyncio.Semaphore(8)
        results = await asyncio.gather(
            *(_player_stats(settings, player, semaphore) for player, _ in players),
        )
        teams = {
            team.casefold()
            for _, _, _, team in results
            if team and not team.startswith("%") and team.casefold() not in {"none", "no team"}
        }
        leaderboard = [
            {
                "player": player,
                "score": balance,
                "position": position,
                "metadata": {
                    "balance": balance,
                    "kills": kills,
                    "playtime": f"{playtime_seconds // 3600}h",
                    "blocks_placed": blocks_placed,
                    "team": team if team and not team.startswith("%") else "",
                    "metric": "balance",
                },
            }
            for position, ((player, balance), (kills, playtime_seconds, blocks_placed, team)) in enumerate(
                zip(players, results, strict=True),
                start=1,
            )
        ]
        value = {
            "season_stats": {
                "total_kills": sum(kills for kills, _, _, _ in results),
                "blocks_placed": sum(blocks for _, _, blocks, _ in results),
                "unique_players": unique_players,
                "active_teams": len(teams),
                "total_playtime_hours": sum(seconds for _, seconds, _, _ in results) // 3600,
            },
            "leaderboard": leaderboard,
        }
        _cache.value = value
        _cache.expires_at = time.monotonic() + PLAYER_STATS_TTL_SECONDS
        return value


async def get_minecraft_season_stats(settings: Settings) -> dict[str, int]:
    """Return cached all-time totals available from the live server."""

    data = await _get_minecraft_data(settings)
    return data["season_stats"]


async def get_minecraft_leaderboard(settings: Settings) -> list[dict[str, Any]]:
    """Return players ranked by balance with playtime and kills."""

    data = await _get_minecraft_data(settings)
    return data["leaderboard"]
