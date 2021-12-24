"""Added screenname and response config tables

Revision ID: 1a3dc8937b6e
Revises: 6bd4cd8b5a2e
Create Date: 2020-01-04 17:57:08.139532

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a3dc8937b6e'
down_revision = '6bd4cd8b5a2e'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('screen_name',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('source_id', sa.Integer(), nullable=False),
    sa.Column('screen_name', sa.String(), nullable=False),
    sa.Column('aingine_user_id', sa.Integer(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('response_config',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('deal_id', sa.Integer(), nullable=True),
    sa.Column('source_id', sa.Integer(), nullable=True),
    sa.Column('thread_id', sa.Integer(), nullable=True),
    sa.Column('thread_url', sa.String(), nullable=True),
    sa.Column('aingine_user_id', sa.Integer(), nullable=True),
    sa.Column('screen_name_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['deal_id'], ['deal.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['screen_name_id'], ['screen_name.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.add_column('conversation_entry', sa.Column('aingine_user_id', sa.Integer(), nullable=True))
    op.drop_column('conversation_entry', 'author_ai_id')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('conversation_entry', sa.Column('author_ai_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.drop_column('conversation_entry', 'aingine_user_id')
    op.drop_table('response_config')
    op.drop_table('screen_name')
    # ### end Alembic commands ###
