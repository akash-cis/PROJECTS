"""empty message

Revision ID: 1a28a6a47d2f
Revises: 08b3da1cb3df
Create Date: 2021-12-09 12:27:07.057030

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a28a6a47d2f'
down_revision = '08b3da1cb3df'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('review',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('head', sa.String(length=100), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('review_message_template',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('image_url', sa.String(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.alter_column('sf_extract_history', 'crm_integration_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('sf_extracted_lead', 'crm_integration_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('sf_extracted_lead', 'sf_lead_note_id')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('sf_extracted_lead', sa.Column('sf_lead_note_id', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.alter_column('sf_extracted_lead', 'crm_integration_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('sf_extract_history', 'crm_integration_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.drop_table('review_message_template')
    op.drop_table('review')
    # ### end Alembic commands ###
