"""rename_metadata_to_meta_data

Revision ID: 202407060007
Revises: 202407060006
Create Date: 2024-01-15 12:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '202407060007'
down_revision = '202407060006'
branch_labels = None
depends_on = None


def _rename_if_exists(table: str, old: str, new: str) -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {col["name"] for col in inspector.get_columns(table)}
    if old in columns and new not in columns:
        op.alter_column(table, old, new_column_name=new)


def upgrade() -> None:
    # Rename metadata columns to meta_data (if still present)
    _rename_if_exists("ranks", "metadata", "meta_data")
    _rename_if_exists("server_status", "metadata", "meta_data")
    _rename_if_exists("leaderboards", "metadata", "meta_data")
    _rename_if_exists("tickets", "metadata", "meta_data")


def downgrade() -> None:
    # Rename meta_data columns back to metadata
    _rename_if_exists("ranks", "meta_data", "metadata")
    _rename_if_exists("server_status", "meta_data", "metadata")
    _rename_if_exists("leaderboards", "meta_data", "metadata")
    _rename_if_exists("tickets", "meta_data", "metadata")
