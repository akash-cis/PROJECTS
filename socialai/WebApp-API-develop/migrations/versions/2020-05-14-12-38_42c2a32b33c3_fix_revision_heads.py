"""fix revision heads

Revision ID: 42c2a32b33c3
Revises: 5ba45932cc34, 473461c50dfa
Create Date: 2020-05-14 12:38:52.969121

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '42c2a32b33c3'
down_revision = ('5ba45932cc34', '473461c50dfa')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
