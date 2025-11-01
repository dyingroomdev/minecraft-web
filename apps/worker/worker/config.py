"""Worker configuration."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class WorkerSettings(BaseSettings):
    """Worker settings."""
    
    database_url: str = Field(..., alias="DATABASE_URL")
    redis_url: str = Field(..., alias="REDIS_URL")
    minecraft_server_host: str = Field(default="localhost", alias="MINECRAFT_SERVER_HOST")
    minecraft_server_port: int = Field(default=25565, alias="MINECRAFT_SERVER_PORT")
    minecraft_rcon_port: int = Field(default=25575, alias="MINECRAFT_RCON_PORT")
    minecraft_rcon_password: str = Field(default="", alias="MINECRAFT_RCON_PASSWORD")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_worker_settings() -> WorkerSettings:
    """Return cached worker settings."""
    return WorkerSettings()