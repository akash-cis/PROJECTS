"""Added new entry to filtergrouptype

Revision ID: e8a450987c8b
Revises: 9ff55ef0cd51
Create Date: 2020-09-14 13:12:44.783096

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'e8a450987c8b'
down_revision = '9ff55ef0cd51'
branch_labels = None
depends_on = None


def upgrade():

    filtergrouptype = postgresql.ENUM('MULTISELECT', 'SELECT', 'TEXT', 'TEMPLATE', name='filtergrouptype')
    op.alter_column('filter_type', 'type',
               existing_type=filtergrouptype,
               type_=sa.VARCHAR(length=64), postgresql_using='type::filtergrouptype',
               existing_nullable=False)
    filtergrouptype.drop(op.get_bind())

    filtergrouptype = postgresql.ENUM('MULTISELECT', 'SELECT', 'TEXT', 'TEMPLATE', 'RANGE', name='filtergrouptype')
    filtergrouptype.create(op.get_bind())
    op.alter_column('filter_type', 'type',
               existing_type=sa.VARCHAR(length=64),
               type_=filtergrouptype, postgresql_using='type::filtergrouptype',
               existing_nullable=False)


def downgrade():

    filtergrouptype = postgresql.ENUM('MULTISELECT', 'SELECT', 'TEXT', 'TEMPLATE', 'RANGE', name='filtergrouptype')
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
