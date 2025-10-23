"""
Add po_number column to invoices

Revision ID: add_po_number_field
Revises: add_priority_and_saved_fields
Create Date: 2025-01-27
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_po_number_field'
down_revision = 'add_priority_and_saved_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Check if column already exists (for existing databases)
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('invoices')]
    
    # Add po_number column if it doesn't exist
    if 'po_number' not in columns:
        op.add_column('invoices', sa.Column('po_number', sa.String(length=100), nullable=True))


def downgrade():
    # Check if column exists before dropping it
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('invoices')]
    
    if 'po_number' in columns:
        op.drop_column('invoices', 'po_number')

