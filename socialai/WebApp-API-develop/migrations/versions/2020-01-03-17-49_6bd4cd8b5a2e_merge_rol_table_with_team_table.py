"""merge rol_table with team_table

Revision ID: 6bd4cd8b5a2e
Revises: c322367b337e, 125a1ef3c373
Create Date: 2020-01-03 17:49:39.142532

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6bd4cd8b5a2e'
down_revision = ('c322367b337e', '125a1ef3c373')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
