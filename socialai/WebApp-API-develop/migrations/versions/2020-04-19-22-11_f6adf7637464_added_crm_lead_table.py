"""Added crm_lead table

Revision ID: f6adf7637464
Revises: 221e142263da
Create Date: 2020-04-19 22:11:27.298210

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6adf7637464'
down_revision = '221e142263da'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('crm_integration', sa.Column('active', sa.Boolean(), nullable=True))
    op.create_table('crm_lead',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('deal_id', sa.Integer(), nullable=False),
    sa.Column('lead_id', sa.String(), nullable=True),
    sa.Column('customer_id', sa.String(), nullable=True),
    sa.Column('dealer_id', sa.String(), nullable=True),
    sa.Column('crm_integration_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['crm_integration_id'], ['crm_integration.id'], ),
    sa.ForeignKeyConstraint(['deal_id'], ['deal.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('crm_integration', 'active')
    op.drop_table('crm_lead')
    # ### end Alembic commands ###