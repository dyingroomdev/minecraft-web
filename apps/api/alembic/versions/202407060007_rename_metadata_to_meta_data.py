"""rename_metadata_to_meta_data

Revision ID: 202407060007
Revises: 202407060006
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '202407060007'
down_revision = '202407060006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename metadata columns to meta_data
    op.alter_column('ranks', 'metadata', new_column_name='meta_data')
    op.alter_column('server_status', 'metadata', new_column_name='meta_data')
    op.alter_column('leaderboards', 'metadata', new_column_name='meta_data')
    op.alter_column('tickets', 'metadata', new_column_name='meta_data')


def downgrade() -> None:
    # Rename meta_data columns back to metadata
    op.alter_column('ranks', 'meta_data', new_column_name='metadata')
    op.alter_column('server_status', 'meta_data', new_column_name='metadata')
    op.alter_column('leaderboards', 'meta_data', new_column_name='metadata')
    op.alter_column('tickets', 'meta_data', new_column_name='metadata')