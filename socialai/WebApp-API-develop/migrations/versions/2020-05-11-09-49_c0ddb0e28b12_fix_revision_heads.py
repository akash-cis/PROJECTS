"""fix revision heads

Revision ID: c0ddb0e28b12
Revises: 2e9277c5c928, f6adf7637464
Create Date: 2020-05-11 09:49:32.498042

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c0ddb0e28b12'
down_revision = ('2e9277c5c928', 'f6adf7637464')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
