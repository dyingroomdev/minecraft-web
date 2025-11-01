"""Security helpers for token management and request validation."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

from jose import JWTError, jwt
from pydantic import BaseModel, Field


class TokenType(str, Enum):
    """Supported JWT token types."""

    ACCESS = "access"
    REFRESH = "refresh"


class InvalidTokenError(Exception):
    """Raised when a token cannot be decoded or validated."""


class JWTTokenPayload(BaseModel):
    """Structure decoded from JWT tokens issued by the service."""

    sub: str
    jti: str
    type: TokenType
    roles: list[str] = Field(default_factory=list)
    exp: datetime
    iat: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_jwt_token(
    *,
    subject: str,
    secret: str,
    algorithm: str,
    expires_delta: timedelta,
    token_type: TokenType,
    roles: list[str] | None = None,
    additional_claims: dict[str, Any] | None = None,
) -> tuple[str, JWTTokenPayload]:
    """Create a signed JWT token and return both the string and payload."""

    now = _utcnow()
    expires_at = now + expires_delta
    payload: dict[str, Any] = {
        "sub": subject,
        "jti": secrets.token_hex(16),
        "type": token_type.value,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    if roles:
        payload["roles"] = roles
    if additional_claims:
        payload.update(additional_claims)

    token = jwt.encode(payload, secret, algorithm=algorithm)
    parsed = decode_jwt_token(token=token, secret=secret, algorithm=algorithm)
    return token, parsed


def decode_jwt_token(*, token: str, secret: str, algorithm: str) -> JWTTokenPayload:
    """Decode a JWT token into a payload model."""

    try:
        decoded = jwt.decode(
            token,
            secret,
            algorithms=[algorithm],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise InvalidTokenError("Unable to decode token") from exc

    try:
        decoded["exp"] = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        decoded["iat"] = datetime.fromtimestamp(decoded["iat"], tz=timezone.utc)
        decoded["type"] = TokenType(decoded["type"])
        roles = decoded.get("roles", [])
        if isinstance(roles, str):
            roles = [roles]
        decoded["roles"] = roles
    except (KeyError, ValueError) as exc:
        raise InvalidTokenError("Token payload missing required claims") from exc

    return JWTTokenPayload(**decoded)


def token_has_expired(payload: JWTTokenPayload) -> bool:
    """Return True if the token has expired."""

    return payload.exp <= _utcnow()


def hash_token_value(value: str) -> str:
    """Hash token values before storage to mitigate leakage."""

    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sign_state(state: str, secret: str) -> str:
    """Return an HMAC signature for an OAuth state parameter."""

    return hmac.new(secret.encode("utf-8"), state.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_state(state: str, signature: str, secret: str) -> bool:
    """Verify an OAuth state parameter matches the stored signature."""

    expected = sign_state(state, secret)
    return hmac.compare_digest(signature, expected)
