"""Remove unique requirement from roles

Revision ID: e04509401aff
Revises: 0f4d6392bc34
Create Date: 2020-01-23 18:21:07.104290

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e04509401aff'
down_revision = '0f4d6392bc34'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('role_name_key', 'role', type_='unique')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_unique_constraint('role_name_key', 'role', ['name'])
    # ### end Alembic commands ###
