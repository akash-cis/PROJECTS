"""Added text conset status and is deleted

Revision ID: c5524ad145e8
Revises: 95b6591035e6
Create Date: 2021-09-09 11:44:08.518834

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'c5524ad145e8'
down_revision = '95b6591035e6'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    text_consent_status = postgresql.ENUM('ACCEPTED', 'PENDING', 'DECLINED', name='textconsentstatus')
    text_consent_status.create(op.get_bind())

    op.add_column('leads', sa.Column('text_consent_status', sa.Enum('ACCEPTED', 'PENDING', 'DECLINED', name='textconsentstatus'), nullable=True))
    op.add_column('leads', sa.Column('is_deleted', sa.Boolean(), nullable=True))

    op.execute('UPDATE leads SET is_deleted = False')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('leads', 'is_deleted')
    op.drop_column('leads', 'text_consent_status')
    # ### end Alembic commands ###
    op.execute("DROP TYPE textconsentstatus;")
