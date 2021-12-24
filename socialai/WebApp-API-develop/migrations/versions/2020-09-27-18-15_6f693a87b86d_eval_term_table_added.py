"""eval_term_table_added

Revision ID: 6f693a87b86d
Revises: 406b4f67a4b7
Create Date: 2020-09-27 18:15:24.826371

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6f693a87b86d'
down_revision = '406b4f67a4b7'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('eval_term',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('text', sa.String(), nullable=True),
    sa.Column('include', sa.Boolean(), nullable=True),
    sa.Column('exclude', sa.Boolean(), nullable=True),
    sa.Column('intent', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('eval_term')
    # ### end Alembic commands ###