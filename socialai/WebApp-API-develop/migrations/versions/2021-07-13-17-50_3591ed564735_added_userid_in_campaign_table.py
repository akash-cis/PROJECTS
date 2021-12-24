"""Added userid in campaign table

Revision ID: 3591ed564735
Revises: 061fe4eb829d
Create Date: 2021-07-13 17:50:36.898754

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3591ed564735'
down_revision = '061fe4eb829d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('campaign', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'campaign', 'user', ['user_id'], ['id'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'campaign', type_='foreignkey')
    op.drop_column('campaign', 'user_id')
    # ### end Alembic commands ###