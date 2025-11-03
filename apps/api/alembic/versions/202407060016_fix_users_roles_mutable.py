"""Fix users roles field to remove MutableList coercion."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202407060016"
down_revision = "202407060015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop and recreate the roles column to remove any MutableList metadata
    op.drop_column("users", "roles")
    op.add_column(
        "users",
        sa.Column(
            "roles",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb")
        )
    )


def downgrade() -> None:
    # Revert back to the original column
    op.drop_column("users", "roles")
    op.add_column(
        "users",
        sa.Column(
            "roles",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb")
        )
    )