"""Added lead email, phone, company_id in appointment

Revision ID: 3e149eb3449c
Revises: 37be1dfd3f74
Create Date: 2021-09-03 10:55:45.499351

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3e149eb3449c'
down_revision = '37be1dfd3f74'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('appointment', sa.Column('lead_email', sa.String(), nullable=True))
    op.add_column('appointment', sa.Column('lead_phone', sa.String(), nullable=True))
    op.add_column('appointment', sa.Column('company_id', sa.Integer(), nullable=True))
    op.create_foreign_key('appointment_company_id_fkey', 'appointment', 'company', ['company_id'], ['id'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('appointment_company_id_fkey', 'appointment', type_='foreignkey')
    op.drop_column('appointment', 'company_id')
    op.drop_column('appointment', 'lead_phone')
    op.drop_column('appointment', 'lead_email')
    # ### end Alembic commands ###
