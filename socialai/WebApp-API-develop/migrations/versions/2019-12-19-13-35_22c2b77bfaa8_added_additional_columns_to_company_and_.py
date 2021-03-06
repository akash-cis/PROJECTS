"""Added additional columns to Company and User tables

Revision ID: 22c2b77bfaa8
Revises: 621b995a3829
Create Date: 2019-12-19 13:35:14.258506

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '22c2b77bfaa8'
down_revision = '621b995a3829'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('company', sa.Column('date_created', sa.DateTime(), nullable=True))
    op.add_column('company', sa.Column('is_disabled', sa.Boolean(), nullable=True))
    op.add_column('user', sa.Column('date_created', sa.DateTime(), nullable=True))
    op.add_column('user', sa.Column('is_disabled', sa.Boolean(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('user', 'is_disabled')
    op.drop_column('user', 'date_created')
    op.drop_column('company', 'is_disabled')
    op.drop_column('company', 'date_created')
    # ### end Alembic commands ###
