"""Add LuckPerms mapping fields."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "202407060017"
down_revision = "202407060016"
branch_labels: tuple[str, ...] | None = None
depends_on: tuple[str, ...] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE rank_products RENAME COLUMN luckperms_group TO lp_group")
    op.alter_column("rank_products", "lp_group", existing_type=sa.String(length=64), nullable=True)

    op.add_column(
        "rank_products",
        sa.Column("stack_mode", sa.String(length=8), nullable=False, server_default="SET"),
    )
    op.execute("UPDATE rank_products SET stack_mode = 'SET' WHERE stack_mode IS NULL")
    op.alter_column("rank_products", "stack_mode", server_default=None)
    op.create_check_constraint(
        "ck_rank_products_stack_mode",
        "rank_products",
        "stack_mode IN ('SET', 'ADD')",
    )

    op.add_column("payment_requests", sa.Column("platform", sa.String(length=16), nullable=True))
    op.add_column("payment_requests", sa.Column("fulfilled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "payment_requests",
        sa.Column("fulfillment_status", sa.String(length=16), nullable=False, server_default="pending"),
    )
    op.add_column("payment_requests", sa.Column("fulfillment_log", sa.Text(), nullable=True))
    op.execute("UPDATE payment_requests SET fulfillment_status = 'pending' WHERE fulfillment_status IS NULL")
    op.alter_column("payment_requests", "fulfillment_status", server_default=None)
    op.create_check_constraint(
        "ck_payment_requests_fulfillment_status",
        "payment_requests",
        "fulfillment_status IN ('pending', 'processing', 'success', 'failed')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_payment_requests_fulfillment_status", "payment_requests", type_="check")
    op.drop_column("payment_requests", "fulfillment_log")
    op.drop_column("payment_requests", "fulfillment_status")
    op.drop_column("payment_requests", "fulfilled_at")
    op.drop_column("payment_requests", "platform")

    op.drop_constraint("ck_rank_products_stack_mode", "rank_products", type_="check")
    op.drop_column("rank_products", "stack_mode")
    op.execute("ALTER TABLE rank_products RENAME COLUMN lp_group TO luckperms_group")
    op.alter_column("rank_products", "luckperms_group", existing_type=sa.String(length=64), nullable=False)
