"""Added lead related models

Revision ID: e53994ab12c4
Revises: 506125170ba0
Create Date: 2021-07-13 14:59:37.215549

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e53994ab12c4'
down_revision = '506125170ba0'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('company_lead_files',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('company_id', sa.Integer(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('create_ts', sa.DateTime(), nullable=True),
    sa.Column('file_name', sa.String(), nullable=True),
    sa.Column('file_location', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('leads',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('full_name', sa.String(), nullable=True),
    sa.Column('first_name', sa.String(), nullable=True),
    sa.Column('last_name', sa.String(), nullable=True),
    sa.Column('date_of_birth', sa.DateTime(), nullable=True),
    sa.Column('lead_source_type', sa.Enum('CRM', 'FILE', 'SMAI', 'MANUAL', name='leadsourcetype'), nullable=False),
    sa.Column('lead_source_original', sa.String(), nullable=True),
    sa.Column('company_id', sa.Integer(), nullable=True),
    sa.Column('lead_file_id', sa.Integer(), nullable=True),
    sa.Column('crm_integration_id', sa.Integer(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('email_consent', sa.Boolean(), nullable=True),
    sa.Column('email_consent_date', sa.DateTime(), nullable=True),
    sa.Column('text_consent', sa.Boolean(), nullable=True),
    sa.Column('text_consent_date', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.ForeignKeyConstraint(['crm_integration_id'], ['crm_integration.id'], ),
    sa.ForeignKeyConstraint(['lead_file_id'], ['company_lead_files.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('lead_addresses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('lead_id', sa.Integer(), nullable=True),
    sa.Column('location_text', sa.String(), nullable=True),
    sa.Column('address_line_1', sa.String(), nullable=True),
    sa.Column('address_line_2', sa.String(), nullable=True),
    sa.Column('city', sa.String(), nullable=True),
    sa.Column('state', sa.String(), nullable=True),
    sa.Column('postal_code', sa.String(), nullable=True),
    sa.Column('country', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('lead_emails',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('lead_id', sa.Integer(), nullable=True),
    sa.Column('email', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('lead_phones',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('lead_id', sa.Integer(), nullable=True),
    sa.Column('phone', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('lead_vehicle_of_interest',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('lead_id', sa.Integer(), nullable=True),
    sa.Column('year', sa.String(), nullable=True),
    sa.Column('make', sa.String(), nullable=True),
    sa.Column('model', sa.String(), nullable=True),
    sa.Column('trim', sa.String(), nullable=True),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('budget', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('lead_vehicle_of_interest')
    op.drop_table('lead_phones')
    op.drop_table('lead_emails')
    op.drop_table('lead_addresses')
    op.drop_table('leads')
    op.drop_table('company_lead_files')
    # ### end Alembic commands ###
    op.execute("DROP TYPE leadsourcetype;")
