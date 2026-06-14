"""Application configuration loaded from environment variables."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from pydantic import BaseModel, Field, computed_field, field_validator
from pydantic_settings import BaseSettings

from app.core.enums import RBAC_DEFAULT_ROLE, RBACRole


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


class GoogleOAuthConfig(BaseModel):
    """Prepared configuration for Google OpenID Connect."""

    client_id: str
    client_secret: str
    redirect_uri: str
    authorize_url: str = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url: str = "https://oauth2.googleapis.com/token"
    user_url: str = "https://openidconnect.googleapis.com/v1/userinfo"


class Settings(BaseSettings):
    """Core settings for the FastAPI application."""

    database_url: str = Field(..., alias="DATABASE_URL")

    @field_validator("database_url", mode="before")
    @classmethod
    def _force_asyncpg(cls, v: str) -> str:
        if v.startswith(("postgresql://", "postgres://")):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v
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
    admin_discord_redirect_uri: str = Field(
        default="http://localhost:5174/admin/auth/discord/callback",
        alias="ADMIN_DISCORD_REDIRECT_URI",
    )
    discord_guild_id: str = Field(..., alias="DISCORD_GUILD_ID")
    discord_invite_url: str = Field(default="", alias="DISCORD_INVITE_URL")
    discord_api_base: str = Field(default="https://discord.com/api", alias="DISCORD_API_BASE")
    admin_discord_state_cookie_name: str = Field(default="admin_discord_oauth_state")
    google_state_cookie_name: str = Field(default="google_oauth_state")
    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", alias="GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = Field(
        default="http://localhost:5173/auth/google/callback",
        alias="GOOGLE_REDIRECT_URI",
    )
    minecraft_server_host: str = Field(default="localhost", alias="MINECRAFT_SERVER_HOST")
    minecraft_server_port: int = Field(default=25565, alias="MINECRAFT_SERVER_PORT")
    minecraft_server_host_bedrock: str = Field(default="play.amzcraft.top", alias="MINECRAFT_SERVER_HOST_BEDROCK")
    minecraft_server_port_bedrock: int = Field(default=25566, alias="MINECRAFT_SERVER_PORT_BEDROCK")
    minecraft_rcon_host: str = Field(default="localhost", alias="MINECRAFT_RCON_HOST")
    minecraft_rcon_port: int = Field(default=25575, alias="MINECRAFT_RCON_PORT")
    minecraft_rcon_password: str = Field(default="", alias="MINECRAFT_RCON_PASSWORD")
    mc_java_host: str = Field(default="play.amzcraft.top", alias="MC_JAVA_HOST")
    mc_bedrock_host: str = Field(default="play.amzcraft.top:25566", alias="MC_BEDROCK_HOST")
    mcsrv_base: str = Field(default="https://api.mcsrvstat.us", alias="MCSRV_BASE")
    status_ttl_seconds: int = Field(default=12, alias="STATUS_TTL_SECONDS")
    cors_allowed_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        alias="CORS_ALLOWED_ORIGINS",
    )
    trusted_hosts: list[str] = Field(
        default=["localhost", "127.0.0.1"],
        alias="TRUSTED_HOSTS",
    )
    rate_limit_per_minute: int = Field(default=100, alias="RATE_LIMIT_PER_MINUTE")
    enable_status_poller: bool = Field(default=True, alias="ENABLE_STATUS_POLLER")
    media_root: str = Field(default="media", alias="MEDIA_ROOT")
    media_url_path: str = Field(default="/api/media", alias="MEDIA_URL_PATH")

    oauth_scopes: tuple[str, ...] = ("identify", "email", "guilds.members.read")

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    @field_validator("jwt_refresh_cookie_domain", mode="before")
    @classmethod
    def _blank_domain_to_none(cls, value: str | None) -> str | None:
        if isinstance(value, str) and value.strip() == "":
            return None
        return value

    @field_validator("cors_allowed_origins", "trusted_hosts", mode="before")
    @classmethod
    def _split_csv(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @computed_field  # type: ignore[misc]
    @property
    def discord(self) -> DiscordOAuthConfig:
        return DiscordOAuthConfig(
            DISCORD_CLIENT_ID=self.discord_client_id,
            DISCORD_CLIENT_SECRET=self.discord_client_secret,
            DISCORD_REDIRECT_URI=self.discord_redirect_uri,
            DISCORD_GUILD_ID=self.discord_guild_id,
            DISCORD_API_BASE=self.discord_api_base,
        )

    def discord_for_redirect(self, redirect_uri: str) -> DiscordOAuthConfig:
        return DiscordOAuthConfig(
            DISCORD_CLIENT_ID=self.discord_client_id,
            DISCORD_CLIENT_SECRET=self.discord_client_secret,
            DISCORD_REDIRECT_URI=redirect_uri,
            DISCORD_GUILD_ID=self.discord_guild_id,
            DISCORD_API_BASE=self.discord_api_base,
        )

    @computed_field  # type: ignore[misc]
    @property
    def google(self) -> GoogleOAuthConfig:
        return GoogleOAuthConfig(
            client_id=self.google_client_id,
            client_secret=self.google_client_secret,
            redirect_uri=self.google_redirect_uri,
        )

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

    @computed_field  # type: ignore[misc]
    @property
    def media_root_path(self) -> str:
        return self.media_root


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()
