"""Application configuration loaded from environment variables."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from pydantic import BaseModel, Field, computed_field, field_validator
from pydantic_settings import BaseSettings

from app.core.enums import RBACRole, RBAC_DEFAULT_ROLE


class DiscordOAuthConfig(BaseModel):
    """Prepared configuration for communicating with Discord."""

    client_id: str = Field(..., alias="DISCORD_CLIENT_ID")
    client_secret: str = Field(..., alias="DISCORD_CLIENT_SECRET")
    redirect_uri: str = Field(..., alias="DISCORD_REDIRECT_URI")
    guild_id: str = Field(..., alias="DISCORD_GUILD_ID")
    api_base: str = Field(default="https://discord.com/api", alias="DISCORD_API_BASE")
    authorize_endpoint: str = Field(default="/oauth2/authorize")
    token_endpoint: str = Field(default="/oauth2/token")
    user_endpoint: str = Field(default="/users/@me")
    guild_member_endpoint_template: str = Field(default="/users/@me/guilds/{guild_id}/member")

    @computed_field  # type: ignore[misc]
    @property
    def authorize_url(self) -> str:
        return f"{self.api_base}{self.authorize_endpoint}"

    @computed_field  # type: ignore[misc]
    @property
    def token_url(self) -> str:
        return f"{self.api_base}{self.token_endpoint}"

    @computed_field  # type: ignore[misc]
    @property
    def user_url(self) -> str:
        return f"{self.api_base}{self.user_endpoint}"

    def guild_member_url(self, guild_id: str | None = None) -> str:
        gid = guild_id or self.guild_id
        endpoint = self.guild_member_endpoint_template.format(guild_id=gid)
        return f"{self.api_base}{endpoint}"


class Settings(BaseSettings):
    """Core settings for the FastAPI application."""

    database_url: str = Field(..., alias="DATABASE_URL")
    redis_url: str = Field(..., alias="REDIS_URL")
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_expires_minutes: int = Field(default=15, alias="JWT_ACCESS_EXPIRE_MINUTES")
    jwt_refresh_expires_minutes: int = Field(default=60 * 24 * 14, alias="JWT_REFRESH_EXPIRE_MINUTES")
    jwt_refresh_cookie_name: str = Field(default="refresh_token", alias="JWT_REFRESH_COOKIE_NAME")
    jwt_refresh_cookie_secure: bool = Field(default=False, alias="JWT_REFRESH_COOKIE_SECURE")
    jwt_refresh_cookie_domain: str | None = Field(default=None, alias="JWT_REFRESH_COOKIE_DOMAIN")
    jwt_refresh_cookie_path: str = Field(default="/", alias="JWT_REFRESH_COOKIE_PATH")
    jwt_refresh_cookie_samesite: str = Field(default="lax", alias="JWT_REFRESH_COOKIE_SAMESITE")
    discord_state_cookie_name: str = Field(default="discord_oauth_state")
    discord_state_ttl_seconds: int = Field(default=600)
    discord_role_mapping_json: str = Field(default="{}", alias="DISCORD_ROLE_MAPPING_JSON")
    discord_client_id: str = Field(..., alias="DISCORD_CLIENT_ID")
    discord_client_secret: str = Field(..., alias="DISCORD_CLIENT_SECRET")
    discord_redirect_uri: str = Field(..., alias="DISCORD_REDIRECT_URI")
    discord_guild_id: str = Field(..., alias="DISCORD_GUILD_ID")
    discord_api_base: str = Field(default="https://discord.com/api", alias="DISCORD_API_BASE")
    minecraft_server_host: str = Field(default="localhost", alias="MINECRAFT_SERVER_HOST")
    minecraft_server_port: int = Field(default=25565, alias="MINECRAFT_SERVER_PORT")
    minecraft_rcon_port: int = Field(default=25575, alias="MINECRAFT_RCON_PORT")
    minecraft_rcon_password: str = Field(default="", alias="MINECRAFT_RCON_PASSWORD")

    oauth_scopes: tuple[str, ...] = ("identify", "email", "guilds.members.read")

    class Config:
        env_file = ".env"
        case_sensitive = False

    @field_validator("jwt_refresh_cookie_domain", mode="before")
    @classmethod
    def _blank_domain_to_none(cls, value: str | None) -> str | None:
        if isinstance(value, str) and value.strip() == "":
            return None
        return value

    @computed_field  # type: ignore[misc]
    @property
    def discord(self) -> DiscordOAuthConfig:
        return DiscordOAuthConfig(**self.model_dump(by_alias=True))

    @computed_field  # type: ignore[misc]
    @property
    def discord_role_mapping(self) -> dict[RBACRole, set[str]]:
        try:
            raw_mapping: dict[str, Any] = json.loads(self.discord_role_mapping_json)
        except json.JSONDecodeError as exc:  # pragma: no cover - defensive
            raise ValueError("DISCORD_ROLE_MAPPING_JSON must contain valid JSON.") from exc

        mapping: dict[RBACRole, set[str]] = {}
        for key, raw_roles in raw_mapping.items():
            try:
                role = RBACRole(key.upper())
            except ValueError as exc:
                raise ValueError(
                    f"Unsupported RBAC role '{key}' in DISCORD_ROLE_MAPPING_JSON",
                ) from exc

            if isinstance(raw_roles, str):
                identifiers = {raw_roles}
            else:
                identifiers = {str(value) for value in raw_roles}

            mapping[role] = identifiers

        # Ensure every user at least has the default role.
        mapping.setdefault(RBAC_DEFAULT_ROLE, set())
        return mapping

    @computed_field  # type: ignore[misc]
    @property
    def refresh_cookie_samesite(self) -> str:
        return self.jwt_refresh_cookie_samesite.lower()


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()
