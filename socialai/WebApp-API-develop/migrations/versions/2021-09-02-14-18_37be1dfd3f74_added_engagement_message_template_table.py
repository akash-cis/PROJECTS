"""Added engagement message template table

Revision ID: 37be1dfd3f74
Revises: 20fbf134b01e
Create Date: 2021-09-02 14:18:32.868809

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '37be1dfd3f74'
down_revision = '20fbf134b01e'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('engagement_message_template',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('company_id', sa.Integer(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('engagement_message_template')
    # ### end Alembic commands ###