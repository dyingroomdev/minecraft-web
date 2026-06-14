"""widen news_posts.summary from 280 to 1000 chars

Revision ID: 202406150020
Revises: 202407060019
Create Date: 2026-06-15

"""

from alembic import op
import sqlalchemy as sa

revision = "202406150020"
down_revision = "202407060019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "news_posts",
        "summary",
        existing_type=sa.String(length=280),
        type_=sa.String(length=1000),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "news_posts",
        "summary",
        existing_type=sa.String(length=1000),
        type_=sa.String(length=280),
        existing_nullable=True,
    )
