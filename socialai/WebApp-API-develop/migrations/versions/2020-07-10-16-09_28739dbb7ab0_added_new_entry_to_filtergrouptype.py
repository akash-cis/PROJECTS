"""Added new entry to filtergrouptype

Revision ID: 28739dbb7ab0
Revises: 64dd2a32c451
Create Date: 2020-07-10 16:09:48.036510

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '28739dbb7ab0'
down_revision = '64dd2a32c451'
branch_labels = None
depends_on = None


def upgrade():

    filtergrouptype = postgresql.ENUM('MULTISELECT', 'SELECT', 'TEXT', name='filtergrouptype')
    op.alter_column('filter_type', 'type',
               existing_type=filtergrouptype,
               type_=sa.VARCHAR(length=64), postgresql_using='type::filtergrouptype',
               existing_nullable=False)
    filtergrouptype.drop(op.get_bind())

    filtergrouptype = postgresql.ENUM('MULTISELECT', 'SELECT', 'TEXT', 'TEMPLATE', name='filtergrouptype')
    filtergrouptype.create(op.get_bind())
    op.alter_column('filter_type', 'type',
               existing_type=sa.VARCHAR(length=64),
               type_=filtergrouptype, postgresql_using='type::filtergrouptype',
               existing_nullable=False)


def downgrade():

    filtergrouptype = postgresql.ENUM('MULTISELECT', 'SELECT', 'TEXT', 'TEMPLATE', name='filtergrouptype')
    op.alter_column('filter_type', 'type',
               existing_type=filtergrouptype,
               type_=sa.VARCHAR(length=64), postgresql_using='type::filtergrouptype',
               existing_nullable=False)
    filtergrouptype.drop(op.get_bind())

    filtergrouptype = postgresql.ENUM('MULTISELECT', 'SELECT', 'TEXT', name='filtergrouptype')
    filtergrouptype.create(op.get_bind())
    op.alter_column('filter_type', 'type',
               existing_type=sa.VARCHAR(length=64),
               type_=filtergrouptype, postgresql_using='type::filtergrouptype',
               existing_nullable=False)
