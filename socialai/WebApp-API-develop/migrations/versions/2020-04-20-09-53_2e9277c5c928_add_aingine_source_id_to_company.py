"""Add aingine_source_id to Company

Revision ID: 2e9277c5c928
Revises: f6adf7637464
Create Date: 2020-04-20 09:53:12.194814

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2e9277c5c928'
down_revision = 'f6adf7637464'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('company', sa.Column('aingine_source_id', sa.Integer(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('company', 'aingine_source_id')
    # ### end Alembic commands ###
