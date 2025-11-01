"""seed_rank_products

Revision ID: 202407060005
Revises: 202407060004
Create Date: 2024-07-06 00:05:00.000000

"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "202407060005"
down_revision = "202407060004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Seed rank products."""
    now = datetime.now(timezone.utc)
    
    rank_products = [
        {
            "id": str(uuid.uuid4()),
            "rank_code": "vip",
            "display_name": "VIP Rank",
            "price_bdt": "500.00",
            "duration_days": 30,
            "luckperms_group": "vip",
            "description": "VIP rank with special perks for 30 days",
            "is_active": True,
            "metadata": "{}",
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "rank_code": "premium",
            "display_name": "Premium Rank",
            "price_bdt": "1000.00",
            "duration_days": 30,
            "luckperms_group": "premium",
            "description": "Premium rank with enhanced features for 30 days",
            "is_active": True,
            "metadata": "{}",
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "rank_code": "legend",
            "display_name": "Legend Rank",
            "price_bdt": "2000.00",
            "duration_days": None,  # Permanent
            "luckperms_group": "legend",
            "description": "Permanent legend rank with all privileges",
            "is_active": True,
            "metadata": "{}",
            "created_at": now,
            "updated_at": now,
        },
    ]
    
    for product in rank_products:
        op.execute(
            sa.text("""
                INSERT INTO rank_products (
                    id, rank_code, display_name, price_bdt, duration_days,
                    luckperms_group, description, is_active, metadata,
                    created_at, updated_at
                ) VALUES (
                    :id, :rank_code, :display_name, :price_bdt, :duration_days,
                    :luckperms_group, :description, :is_active, :metadata,
                    :created_at, :updated_at
                )
            """).bindparam(**product)
        )


def downgrade() -> None:
    """Remove seeded rank products."""
    op.execute(
        sa.text("DELETE FROM rank_products WHERE rank_code IN ('vip', 'premium', 'legend')")
    )