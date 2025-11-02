"""Security middleware for rate limiting, CORS, and content sanitization."""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict

import bleach
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import Settings

_RATE_LIMIT_WINDOW_SECONDS = 60
_ALLOWED_MARKDOWN_TAGS = [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
    "img",
]
_ALLOWED_MARKDOWN_ATTRIBUTES = {
    "a": ["href", "title"],
    "img": ["src", "alt", "title", "width", "height"],
}


class RateLimitMiddleware:
    """Simple in-memory rate limiting middleware."""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self._requests: Dict[str, Deque[float]] = defaultdict(deque)

    async def __call__(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        requests = self._requests[client_ip]
        cutoff = now - _RATE_LIMIT_WINDOW_SECONDS

        while requests and requests[0] <= cutoff:
            requests.popleft()

        if len(requests) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )

        requests.append(now)
        return await call_next(request)


def sanitize_markdown(content: str) -> str:
    """Sanitize markdown content to prevent XSS."""

    return bleach.clean(
        content,
        tags=_ALLOWED_MARKDOWN_TAGS,
        attributes=_ALLOWED_MARKDOWN_ATTRIBUTES,
        strip=True,
    )


def sanitize_text(value: str | None) -> str | None:
    """Strip any HTML tags from plain-text admin input."""

    if value is None:
        return None
    cleaned = bleach.clean(value, tags=[], attributes={}, strip=True)
    return cleaned.strip()


def setup_security_middleware(app: FastAPI, settings: Settings) -> None:
    """Setup security middleware for the FastAPI app."""

    cors_origins = settings.cors_allowed_origins or ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    trusted_hosts = settings.trusted_hosts or ["*"]
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=trusted_hosts,
    )

    rate_limiter = RateLimitMiddleware(requests_per_minute=settings.rate_limit_per_minute)
    app.middleware("http")(rate_limiter)
