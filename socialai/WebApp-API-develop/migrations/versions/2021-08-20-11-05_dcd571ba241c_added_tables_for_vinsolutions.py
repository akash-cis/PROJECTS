"""Added tables for vinsolutions

Revision ID: dcd571ba241c
Revises: d6c83761e35d
Create Date: 2021-08-20 11:05:18.205764

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dcd571ba241c'
down_revision = 'd6c83761e35d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('vs_extract_history',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('dealer_id', sa.String(length=16), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('extract_date', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('vs_lead_source',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('dealer_id', sa.String(length=16), nullable=False),
    sa.Column('lead_source_id', sa.Integer(), nullable=True),
    sa.Column('vs_lead_source_id', sa.Integer(), nullable=True),
    sa.Column('vs_lead_source_name', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('vs_lead_source_id')
    )
    op.create_table('company_lead_source',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('company_id', sa.Integer(), nullable=True),
    sa.Column('lead_source_original_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.ForeignKeyConstraint(['lead_source_original_id'], ['lead_source.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('vs_extracted_lead',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('vs_extract_history_id', sa.Integer(), nullable=False),
    sa.Column('dealer_id', sa.String(length=16), nullable=False),
    sa.Column('vs_lead_id', sa.Integer(), nullable=False),
    sa.Column('lead_id', sa.Integer(), nullable=False),
    sa.Column('vs_contact_id', sa.Integer(), nullable=False),
    sa.Column('vs_co_buyer_contact_id', sa.Integer(), nullable=True),
    sa.Column('vs_lead_source_id', sa.Integer(), nullable=True),
    sa.Column('vs_lead_status', sa.String(), nullable=True),
    sa.Column('vs_lead_status_type', sa.String(), nullable=True),
    sa.Column('vs_lead_type', sa.String(), nullable=True),
    sa.Column('vs_lead_category', sa.String(), nullable=True),
    sa.Column('vs_create_date', sa.DateTime(), nullable=True),
    sa.Column('do_not_email', sa.Boolean(), nullable=True),
    sa.Column('do_not_call', sa.Boolean(), nullable=True),
    sa.Column('do_not_mail', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['vs_extract_history_id'], ['vs_extract_history.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('vs_contact_id'),
    sa.UniqueConstraint('vs_lead_id')
    )
    op.create_table('vs_sms_preferences',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('vs_contact_id', sa.Integer(), nullable=True),
    sa.Column('phone_number', sa.String(), nullable=True),
    sa.Column('phone_type', sa.String(), nullable=True),
    sa.Column('subscriber_status', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['vs_contact_id'], ['vs_extracted_lead.vs_contact_id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('vs_sms_preferences')
    op.drop_table('vs_extracted_lead')
    op.drop_table('company_lead_source')
    op.drop_table('vs_lead_source')
    op.drop_table('vs_extract_history')
    # ### end Alembic commands ###
