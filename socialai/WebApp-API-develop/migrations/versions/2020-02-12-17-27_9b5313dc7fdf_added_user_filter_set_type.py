"""added_user_filter_set_type

Revision ID: 9b5313dc7fdf
Revises: 2b0fdda93092
Create Date: 2020-02-12 17:27:16.175916

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9b5313dc7fdf'
down_revision = '2b0fdda93092'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user_filter', sa.Column('set_type', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('user_filter', 'set_type')
    # ### end Alembic commands ###