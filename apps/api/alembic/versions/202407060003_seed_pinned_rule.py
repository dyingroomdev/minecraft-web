"""seed_pinned_rule

Revision ID: 202407060003
Revises: 202407060002
Create Date: 2024-07-06 00:03:00.000000

"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "202407060003"
down_revision = "202407060002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add pinned rule about war notifications."""
    # Generate values
    rule_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    
    # Insert the pinned rule
    op.execute(
        sa.text("""
            INSERT INTO rules (id, slug, title, content, category, display_order, is_pinned, created_at, updated_at)
            VALUES (
                :id,
                'war-notification-rule',
                'War Notification Requirement',
                'Before going to war, inform Server Officials in the designated Discord channel: <your link>.',
                'general',
                0,
                true,
                :created_at,
                :updated_at
            )
        """).bindparams(
            sa.bindparam("id", rule_id),
            sa.bindparam("created_at", now),
            sa.bindparam("updated_at", now)
        )
    )


def downgrade() -> None:
    """Remove the pinned rule."""
    op.execute(
        sa.text("DELETE FROM rules WHERE slug = 'war-notification-rule'")
    )