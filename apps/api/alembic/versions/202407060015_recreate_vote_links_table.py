"""Recreate vote links table to fix MutableList issues."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202407060015"
down_revision = "202407060014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the entire table to clear all metadata
    op.drop_table("vote_links")
    
    # Recreate the table from scratch
    op.create_table(
        "vote_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("title", sa.String(length=140), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=255), nullable=False),
        sa.Column("button_text", sa.String(length=64), nullable=False, server_default="Vote"),
        sa.Column("rewards", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_table("vote_links")