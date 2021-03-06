"""Removed uneccessary column

Revision ID: 771fe395d53b
Revises: 3e7bcb0cd914
Create Date: 2019-11-20 12:44:42.878416

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '771fe395d53b'
down_revision = '3e7bcb0cd914'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('saved_filter', 'is_active')
    op.drop_column('user_filter', 'is_active')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user_filter', sa.Column('is_active', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('saved_filter', sa.Column('is_active', sa.BOOLEAN(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
