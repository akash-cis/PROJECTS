"""exports_tables_updated

Revision ID: fb64f2966a61
Revises: 3b160b91da16
Create Date: 2020-08-25 23:14:55.470463

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fb64f2966a61'
down_revision = '3b160b91da16'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('export', sa.Column('count', sa.Integer(), nullable=True))
    op.add_column('export_config', sa.Column('timezone', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('export_config', 'timezone')
    op.drop_column('export', 'count')
    # ### end Alembic commands ###
