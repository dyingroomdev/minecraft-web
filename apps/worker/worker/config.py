"""Worker configuration."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class WorkerSettings(BaseSettings):
    """Worker settings."""
    
    database_url: str = Field(default="sqlite+aiosqlite:///:memory:", alias="DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    minecraft_server_host: str = Field(default="localhost", alias="MINECRAFT_SERVER_HOST")
    minecraft_server_port: int = Field(default=25565, alias="MINECRAFT_SERVER_PORT")
    minecraft_rcon_host: str = Field(default="localhost", alias="MINECRAFT_RCON_HOST")
    minecraft_rcon_port: int = Field(default=25575, alias="MINECRAFT_RCON_PORT")
    minecraft_rcon_password: str = Field(default="", alias="MINECRAFT_RCON_PASSWORD")
    enable_background_queues: bool = Field(default=False, alias="ENABLE_BACKGROUND_QUEUES")
    enable_maintenance_jobs: bool = Field(default=False, alias="ENABLE_MAINTENANCE_JOBS")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache
def get_worker_settings() -> WorkerSettings:
    """Return cached worker settings."""
    return WorkerSettings()
