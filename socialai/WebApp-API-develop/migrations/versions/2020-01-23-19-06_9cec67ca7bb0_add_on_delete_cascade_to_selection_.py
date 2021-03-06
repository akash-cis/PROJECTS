"""Add on delete cascade to selection options to allow for deletion of filter types

Revision ID: 9cec67ca7bb0
Revises: e04509401aff
Create Date: 2020-01-23 19:06:09.695080

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9cec67ca7bb0'
down_revision = 'e04509401aff'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('selection_option_filter_type_id_fkey', 'selection_option', type_='foreignkey')
    op.create_foreign_key(None, 'selection_option', 'filter_type', ['filter_type_id'], ['id'], ondelete='CASCADE')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'selection_option', type_='foreignkey')
    op.create_foreign_key('selection_option_filter_type_id_fkey', 'selection_option', 'filter_type', ['filter_type_id'], ['id'])
    # ### end Alembic commands ###
