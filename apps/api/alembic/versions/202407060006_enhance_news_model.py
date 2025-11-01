"""enhance_news_model

Revision ID: 202407060006
Revises: 202407060005
Create Date: 2024-07-06 00:06:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "202407060006"
down_revision = "202407060005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add cover image and scheduled publish to news posts."""
    op.add_column("news_posts", sa.Column("cover_image_url", sa.String(512), nullable=True))
    op.add_column("news_posts", sa.Column("scheduled_publish_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Remove cover image and scheduled publish from news posts."""
    op.drop_column("news_posts", "cover_image_url")
    op.drop_column("news_posts", "scheduled_publish_at")