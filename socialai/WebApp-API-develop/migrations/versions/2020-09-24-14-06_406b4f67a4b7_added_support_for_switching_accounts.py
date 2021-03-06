"""Added support for switching accounts


Revision ID: 406b4f67a4b7
Revises: e8a450987c8b
Create Date: 2020-09-24 14:06:49.134755

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '406b4f67a4b7'
down_revision = 'e8a450987c8b'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user_roles', sa.Column('company_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'user_roles', 'company', ['company_id'], ['id'], ondelete='CASCADE')
    # ### end Alembic commands ###

    #Updating Existing company id form user table to user_roles table.
    conn = op.get_bind()
    res = conn.execute("select id,company_id,status from public.user")
    results = res.fetchall()
    t_user_roles = sa.Table('user_roles',
            sa.MetaData(),
            sa.Column('id', sa.Integer()),
            sa.Column('user_id', sa.Integer()),
            sa.Column('company_id', sa.Integer()),
        )
    for r in results:
        conn.execute(
            t_user_roles.update().where(t_user_roles.c.user_id == r[0]).values(company_id = r[1])
        )


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'user_roles', type_='foreignkey')
    op.drop_column('user_roles', 'company_id')
    # ### end Alembic commands ###
