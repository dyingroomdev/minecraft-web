"""Add content and gameplay domain models."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202407060002"
down_revision = "202407060001"
branch_labels = None
depends_on = None


SOCIAL_PLATFORMS = [
    "facebook",
    "twitter",
    "discord",
    "youtube",
    "tiktok",
    "instagram",
]


PINNED_RULE = {
    "slug": "inform-officials-before-war",
    "title": "Inform Officials Before War",
    "content": (
        "Before going to war, inform Server Officials in the designated Discord channel: <your link>."
    ),
    "category": "general",
    "display_order": 0,
    "is_pinned": True,
}


def upgrade() -> None:
    op.create_table(
        "ranks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=96), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )

    op.create_table(
        "players",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("minecraft_uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("username", sa.String(length=32), nullable=False),
        sa.Column("rank_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "stats",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.ForeignKeyConstraint(["rank_id"], ["ranks.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "guilds",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("tag", sa.String(length=8), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner_player_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_player_id"], ["players.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "guild_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("guild_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("player_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["guild_id"], ["guilds.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("player_id", "guild_id", name="uq_guild_member_player_guild"),
    )

    op.create_table(
        "server_status",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="offline"),
        sa.Column("players_online", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("players_max", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("motd", sa.Text(), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "news_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False, unique=True),
        sa.Column("title", sa.String(length=140), nullable=False),
        sa.Column("summary", sa.String(length=280), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_draft", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False, unique=True),
        sa.Column("title", sa.String(length=140), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("location", sa.String(length=140), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False, unique=True),
        sa.Column("title", sa.String(length=140), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "leaderboards",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("season", sa.String(length=32), nullable=False),
        sa.Column("leaderboard_type", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=140), nullable=True),
        sa.Column("entries", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.UniqueConstraint("season", "leaderboard_type", name="uq_leaderboard_season_type"),
    )

    op.create_table(
        "tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("player_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("subject", sa.String(length=140), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "social_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("platform", sa.String(length=32), nullable=False, unique=True),
        sa.Column("url", sa.String(length=255), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
    )

    now = datetime.now(timezone.utc)

    rules_table = sa.table(
        "rules",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
        sa.column("slug", sa.String),
        sa.column("title", sa.String),
        sa.column("content", sa.Text),
        sa.column("category", sa.String),
        sa.column("display_order", sa.Integer),
        sa.column("is_pinned", sa.Boolean),
    )

    op.bulk_insert(
        rules_table,
        [
            {
                "id": uuid.uuid4(),
                "created_at": now,
                "updated_at": now,
                **PINNED_RULE,
            }
        ],
    )

    social_table = sa.table(
        "social_links",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
        sa.column("platform", sa.String),
        sa.column("url", sa.String),
        sa.column("display_order", sa.Integer),
    )

    op.bulk_insert(
        social_table,
        [
            {
                "id": uuid.uuid4(),
                "created_at": now,
                "updated_at": now,
                "platform": platform,
                "url": "https://example.com",
                "display_order": index,
            }
            for index, platform in enumerate(SOCIAL_PLATFORMS)
        ],
    )


def downgrade() -> None:
    op.drop_table("social_links")
    op.drop_table("tickets")
    op.drop_table("leaderboards")
    op.drop_table("rules")
    op.drop_table("events")
    op.drop_table("news_posts")
    op.drop_table("server_status")
    op.drop_table("guild_members")
    op.drop_table("guilds")
    op.drop_table("players")
    op.drop_table("ranks")
