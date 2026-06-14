"""Add credential, Google, and admin Discord authentication.

Revision ID: 202407060019
Revises: 202407060018_add_shop_tables
"""

import sqlalchemy as sa
from alembic import op

revision = "202407060019"
down_revision = "202407060018_add_shop_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "discord_id", existing_type=sa.String(length=32), nullable=True)
    op.add_column("users", sa.Column("google_id", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(length=128), nullable=True))
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.add_column("admin_users", sa.Column("discord_id", sa.String(length=32), nullable=True))
    op.create_index("ix_admin_users_discord_id", "admin_users", ["discord_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_admin_users_discord_id", table_name="admin_users")
    op.drop_column("admin_users", "discord_id")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "google_id")
    op.alter_column("users", "discord_id", existing_type=sa.String(length=32), nullable=False)
