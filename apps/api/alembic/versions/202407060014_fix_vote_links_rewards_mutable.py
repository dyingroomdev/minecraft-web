"""Fix vote links rewards field to remove MutableList coercion."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202407060014"
down_revision = "202407060013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Clear existing data that has MutableList metadata
    op.execute("TRUNCATE TABLE vote_links")
    
    # Drop and recreate the rewards column to remove any MutableList metadata
    op.drop_column("vote_links", "rewards")
    op.add_column(
        "vote_links",
        sa.Column(
            "rewards",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb")
        )
    )


def downgrade() -> None:
    # Revert back to the original column
    op.drop_column("vote_links", "rewards")
    op.add_column(
        "vote_links",
        sa.Column(
            "rewards",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb")
        )
    )