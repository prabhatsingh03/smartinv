"""
Add priority and is_saved columns to invoices

Revision ID: add_priority_and_saved_fields
Revises: 
Create Date: 2025-09-26
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_priority_and_saved_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Check if columns already exist (for existing databases)
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('invoices')]
    
    # Add priority column if it doesn't exist
    if 'priority' not in columns:
        op.add_column('invoices', sa.Column('priority', sa.String(length=10), nullable=False, server_default='low'))
    
    # Add is_saved column if it doesn't exist
    if 'is_saved' not in columns:
        op.add_column('invoices', sa.Column('is_saved', sa.Boolean(), nullable=False, server_default=sa.false()))

    # Check if indexes exist before creating them
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('invoices')]
    
    if 'ix_invoices_priority' not in existing_indexes:
        op.create_index('ix_invoices_priority', 'invoices', ['priority'])
    
    if 'ix_invoices_is_saved' not in existing_indexes:
        op.create_index('ix_invoices_is_saved', 'invoices', ['is_saved'])

    # Backfill: mark non-extracted as saved
    op.execute("""
        UPDATE invoices
        SET is_saved = 1
        WHERE status <> 'extracted'
    """)

    # Backfill priority based on total_amount
    op.execute("""
        UPDATE invoices
        SET priority = CASE
            WHEN COALESCE(total_amount, 0) >= 500000 THEN 'high'
            WHEN COALESCE(total_amount, 0) >= 100000 THEN 'medium'
            ELSE 'low'
        END
    """)


def downgrade():
    # Check if indexes exist before dropping them
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('invoices')]
    
    if 'ix_invoices_is_saved' in existing_indexes:
        op.drop_index('ix_invoices_is_saved', table_name='invoices')
    
    if 'ix_invoices_priority' in existing_indexes:
        op.drop_index('ix_invoices_priority', table_name='invoices')
    
    # Check if columns exist before dropping them
    columns = [col['name'] for col in inspector.get_columns('invoices')]
    
    if 'is_saved' in columns:
        op.drop_column('invoices', 'is_saved')
    
    if 'priority' in columns:
        op.drop_column('invoices', 'priority')


