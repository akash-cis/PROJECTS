"""added_export_email_time

Revision ID: f81a95f0ad97
Revises: ee360b86db9e
Create Date: 2020-03-10 15:39:59.222114

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f81a95f0ad97'
down_revision = 'ee360b86db9e'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('export_config', sa.Column('email_time', sa.Time(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('export_config', 'email_time')
    # ### end Alembic commands ###
