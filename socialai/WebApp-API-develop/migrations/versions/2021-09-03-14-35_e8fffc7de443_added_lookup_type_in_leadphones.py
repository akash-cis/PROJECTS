"""Added lookup_type in leadphones

Revision ID: e8fffc7de443
Revises: 3e149eb3449c
Create Date: 2021-09-03 14:35:17.925468

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e8fffc7de443'
down_revision = '3e149eb3449c'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('lead_phones', sa.Column('lookup_type', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('lead_phones', 'lookup_type')
    # ### end Alembic commands ###
