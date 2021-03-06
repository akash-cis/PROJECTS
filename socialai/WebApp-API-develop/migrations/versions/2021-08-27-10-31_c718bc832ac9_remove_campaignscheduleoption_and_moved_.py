"""remove campaignscheduleoption and moved fields to campaignschedule table

Revision ID: c718bc832ac9
Revises: dcd571ba241c
Create Date: 2021-08-27 10:31:19.212420

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c718bc832ac9'
down_revision = 'dcd571ba241c'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('campaign_schedules', sa.Column('type', sa.Enum('ONCE', 'REPEAT', name='scheduletype'), nullable=True, server_default="ONCE"))
    op.add_column('campaign_schedules', sa.Column('numeric_value', sa.Integer(), nullable=True))
    op.add_column('campaign_schedules', sa.Column('temporal_value', sa.Enum('SECONDS', 'MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', name='temporaltype'), nullable=True))

    op.execute('UPDATE campaign_schedules AS cs SET type = cso.type, numeric_value = cso.numeric_value, temporal_value = cso.temporal_value FROM campaign_schedules_option AS cso WHERE  cs.schedules_option_id = cso.id')

    op.alter_column('campaign_schedules', 'type', nullable=False)
    op.alter_column('campaign_schedules', 'temporal_value', nullable=False)

    op.drop_constraint('campaign_schedules_schedules_option_id_fkey', 'campaign_schedules', type_='foreignkey')
    op.drop_column('campaign_schedules', 'schedules_option_id')
    op.drop_table('campaign_schedules_option')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('campaign_schedules', sa.Column('schedules_option_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.create_foreign_key('campaign_schedules_schedules_option_id_fkey', 'campaign_schedules', 'campaign_schedules_option', ['schedules_option_id'], ['id'])
    op.drop_column('campaign_schedules', 'temporal_value')
    op.drop_column('campaign_schedules', 'numeric_value')
    op.drop_column('campaign_schedules', 'type')
    op.create_table('campaign_schedules_option',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('type', postgresql.ENUM('ONCE', 'REPEAT', name='scheduletype'), autoincrement=False, nullable=False),
    sa.Column('numeric_value', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('temporal_value', postgresql.ENUM('SECOUNDS', 'MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'SECONDS', name='temporaltype'), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id', name='campaign_schedules_option_pkey')
    )
    # ### end Alembic commands ###
