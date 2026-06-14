"""widen url/subtitle columns to prevent truncation

vote_links.url: 255→512
social_links.url: 255→512
hero_slides.subtitle: 280→1000
hero_slides.button_url: 255→512

Revision ID: 202406150021
Revises: 202406150020
Create Date: 2026-06-15

"""

from alembic import op
import sqlalchemy as sa

revision = "202406150021"
down_revision = "202406150020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "vote_links", "url",
        existing_type=sa.String(length=255),
        type_=sa.String(length=512),
        existing_nullable=False,
    )
    op.alter_column(
        "social_links", "url",
        existing_type=sa.String(length=255),
        type_=sa.String(length=512),
        existing_nullable=False,
    )
    op.alter_column(
        "hero_slides", "subtitle",
        existing_type=sa.String(length=280),
        type_=sa.String(length=1000),
        existing_nullable=True,
    )
    op.alter_column(
        "hero_slides", "button_url",
        existing_type=sa.String(length=255),
        type_=sa.String(length=512),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "vote_links", "url",
        existing_type=sa.String(length=512),
        type_=sa.String(length=255),
        existing_nullable=False,
    )
    op.alter_column(
        "social_links", "url",
        existing_type=sa.String(length=512),
        type_=sa.String(length=255),
        existing_nullable=False,
    )
    op.alter_column(
        "hero_slides", "subtitle",
        existing_type=sa.String(length=1000),
        type_=sa.String(length=280),
        existing_nullable=True,
    )
    op.alter_column(
        "hero_slides", "button_url",
        existing_type=sa.String(length=512),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
