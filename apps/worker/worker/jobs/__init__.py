"""Collection of background jobs executed by the worker."""

from .example import example_job
from .sync_roles import sync_discord_roles

__all__ = ["example_job", "sync_discord_roles"]
