"""Simple in-memory cache helpers for leaderboard responses."""

from __future__ import annotations

import time
from typing import Dict, Tuple

from app.schemas.content import LeaderboardRead

CacheKey = Tuple[str, str]

_CACHE_TTL_SECONDS = 60
_cache: Dict[CacheKey, Tuple[float, LeaderboardRead]] = {}


def get(season: str, leaderboard_type: str) -> LeaderboardRead | None:
    """Return a cached leaderboard payload if still fresh."""

    key: CacheKey = (season, leaderboard_type)
    cached = _cache.get(key)
    if cached is None:
        return None

    timestamp, payload = cached
    if time.monotonic() - timestamp > _CACHE_TTL_SECONDS:
        _cache.pop(key, None)
        return None
    return payload


def set(season: str, leaderboard_type: str, payload: LeaderboardRead) -> None:
    """Store a leaderboard response in cache."""

    key: CacheKey = (season, leaderboard_type)
    _cache[key] = (time.monotonic(), payload)


def invalidate(season: str, leaderboard_type: str) -> None:
    """Remove a cached leaderboard response."""

    key: CacheKey = (season, leaderboard_type)
    _cache.pop(key, None)


def invalidate_season(season: str) -> None:
    """Clear cached leaderboards for a season."""

    keys_to_delete = [key for key in _cache if key[0] == season]
    for key in keys_to_delete:
        _cache.pop(key, None)


def clear() -> None:  # pragma: no cover - utility for debugging
    """Clear the cache entirely."""

    _cache.clear()
