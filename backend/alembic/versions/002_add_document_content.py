"""add document content

Revision ID: 002
Revises: 001
Create Date: 2026-07-11 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add content column to documents table
    op.add_column('documents', sa.Column('content', sa.Text(), nullable=True))

def downgrade() -> None:
    op.drop_column('documents', 'content')
