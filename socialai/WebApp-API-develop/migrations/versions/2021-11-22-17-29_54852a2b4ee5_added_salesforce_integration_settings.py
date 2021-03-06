"""Added salesforce integration settings

Revision ID: 54852a2b4ee5
Revises: e7e5f36765b1
Create Date: 2021-11-22 17:29:58.882380

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '54852a2b4ee5'
down_revision = 'e7e5f36765b1'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('crm_integration', sa.Column('sf_api_url', sa.String(), nullable=True))
    op.add_column('crm_integration', sa.Column('sf_api_key', sa.String(), nullable=True))
    op.add_column('crm_integration', sa.Column('sf_api_user', sa.String(), nullable=True))
    op.add_column('crm_integration', sa.Column('sf_certificate_key', sa.String(), nullable=True))

    with op.get_context().autocommit_block():
        op.execute(f"ALTER TYPE crmintegrationtype ADD VALUE IF NOT EXISTS 'SF'")
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('crm_integration', 'sf_certificate_key')
    op.drop_column('crm_integration', 'sf_api_user')
    op.drop_column('crm_integration', 'sf_api_key')
    op.drop_column('crm_integration', 'sf_api_url')

    with op.get_context().autocommit_block():
        op.execute(f"CREATE TYPE crmintegrationtype_new AS ENUM('ADF', 'VIN');")
        op.execute(f"ALTER TABLE crm_integration ALTER COLUMN integration_type TYPE crmintegrationtype_new USING (integration_type::text::crmintegrationtype_new)")
        op.execute(f"DROP TYPE crmintegrationtype;")
        op.execute(f"ALTER TYPE crmintegrationtype_new RENAME TO crmintegrationtype;")
    # ### end Alembic commands ###
