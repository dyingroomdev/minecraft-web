"""Integration helpers for Discord OAuth and role mapping."""

from __future__ import annotations

import httpx
from pydantic import BaseModel, Field

from app.core.config import DiscordOAuthConfig
from app.core.enums import RBAC_DEFAULT_ROLE, RBACRole


class DiscordTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str | None = None
    scope: str


class DiscordUser(BaseModel):
    id: str
    username: str
    global_name: str | None = None
    discriminator: str | None = None
    email: str | None = None
    verified: bool = False
    avatar: str | None = None

    @property
    def display_username(self) -> str:
        return self.global_name or self.username


class DiscordGuildMember(BaseModel):
    user: DiscordUser | None = None
    roles: list[str] = Field(default_factory=list)


class DiscordOAuthService:
    """Encapsulates Discord OAuth calls."""

    def __init__(self, config: DiscordOAuthConfig, client: httpx.AsyncClient) -> None:
        self.config = config
        self.client = client

    async def exchange_code(self, *, code: str) -> DiscordTokenResponse:
        data = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.config.redirect_uri,
        }
        response = await self.client.post(
            self.config.token_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        return DiscordTokenResponse.model_validate(response.json())

    async def fetch_user(self, *, access_token: str) -> DiscordUser:
        response = await self.client.get(
            self.config.user_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return DiscordUser.model_validate(response.json())

    async def fetch_guild_member(self, *, access_token: str, guild_id: str | None = None) -> DiscordGuildMember:
        response = await self.client.get(
            self.config.guild_member_url(guild_id=guild_id),
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return DiscordGuildMember.model_validate(response.json())


def map_discord_roles_to_rbac(
    *,
    discord_role_ids: list[str],
    mapping: dict[RBACRole, set[str]],
) -> list[str]:
    """Translate Discord guild role identifiers into RBAC roles."""

    resolved_roles: set[RBACRole] = {RBAC_DEFAULT_ROLE}
    role_set = set(discord_role_ids)
    for rbac_role, discord_ids in mapping.items():
        if discord_ids & role_set:
            resolved_roles.add(rbac_role)

    # Ensure deterministic ordering for tokens and responses.
    return sorted({role.value for role in resolved_roles})
