"""add_payment_tables

Revision ID: 202407060004
Revises: 202407060003
Create Date: 2024-07-06 00:04:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202407060004"
down_revision = "202407060003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add payment tables."""
    # Create rank_products table
    op.create_table(
        "rank_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rank_code", sa.String(length=64), nullable=False),
        sa.Column("display_name", sa.String(length=128), nullable=False),
        sa.Column("price_bdt", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=True),
        sa.Column("luckperms_group", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, default={}),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rank_code"),
    )
    
    # Create payment_requests table
    op.create_table(
        "payment_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rank_product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mc_username", sa.String(length=32), nullable=False),
        sa.Column("mc_uuid", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("bkash_txid", sa.String(length=64), nullable=False),
        sa.Column("amount_bdt", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("screenshot_url", sa.String(length=512), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, default="pending"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("processed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, default={}),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["rank_product_id"], ["rank_products.id"]),
        sa.ForeignKeyConstraint(["processed_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("bkash_txid", name="uq_payment_request_bkash_txid"),
    )
    
    # Create entitlements table
    op.create_table(
        "entitlements",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payment_request_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mc_uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mc_username", sa.String(length=32), nullable=False),
        sa.Column("rank_code", sa.String(length=64), nullable=False),
        sa.Column("luckperms_group", sa.String(length=64), nullable=False),
        sa.Column("granted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, default={}),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["payment_request_id"], ["payment_requests.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    
    # Create indexes
    op.create_index("ix_payment_requests_status", "payment_requests", ["status"])
    op.create_index("ix_entitlements_expires_at", "entitlements", ["expires_at"])
    op.create_index("ix_entitlements_mc_uuid", "entitlements", ["mc_uuid"])


def downgrade() -> None:
    """Remove payment tables."""
    op.drop_table("entitlements")
    op.drop_table("payment_requests")
    op.drop_table("rank_products")