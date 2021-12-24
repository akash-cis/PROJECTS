"""Added source original id in leads

Revision ID: 6ec5bd116e9a
Revises: 77c8fd2825f4
Create Date: 2021-08-10 12:33:43.119627

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6ec5bd116e9a'
down_revision = '77c8fd2825f4'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('leads', sa.Column('lead_source_original_id', sa.Integer(), nullable=True))
    op.create_foreign_key('leads_lead_source_original_id_fkey', 'leads', 'lead_source', ['lead_source_original_id'], ['id'])
    op.drop_column('leads', 'lead_source_original')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('leads', sa.Column('lead_source_original', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.drop_constraint('leads_lead_source_original_id_fkey', 'leads', type_='foreignkey')
    op.drop_column('leads', 'lead_source_original_id')
    # ### end Alembic commands ###
