"""Added status id of VinSolution CRM Lead status

Revision ID: bfbdd5f2bbfe
Revises: 89625b017730
Create Date: 2021-11-03 10:54:52.553474

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bfbdd5f2bbfe'
down_revision = '89625b017730'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('vs_lead_status_mapping', sa.Column('vs_lead_status_id', sa.Integer(), nullable=True))
    op.add_column('vs_lead_status_mapping', sa.Column('vs_lead_status_type_id', sa.Integer(), nullable=True))
    # ### end Alembic commands ###

    op.execute("""
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 1 WHERE vs_lead_status = 'ACTIVE_NEW_LEAD';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 2 WHERE vs_lead_status = 'ACTIVE_WAITING_FOR_PROSPECT_RESPONSE';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 3 WHERE vs_lead_status = 'ACTIVE_ACTIVE_LEAD';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 4 WHERE vs_lead_status = 'SOLD_ON_ORDER';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 6 WHERE vs_lead_status = 'LOST_LEAD_PROCESS_COMPLETED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 7 WHERE vs_lead_status = 'BAD_BAD_OR_NO_CONTACT_INFORMATION';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 8 WHERE vs_lead_status = 'BAD_PROSPECT_CLAIMS_NEVER_SUBMITTED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 9 WHERE vs_lead_status = 'BAD_UNDERAGE_PROSPECT';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 10 WHERE vs_lead_status = 'BAD_DUPLICATE_LEAD';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 11 WHERE vs_lead_status = 'SOLD_PENDING_FINANCE';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 12 WHERE vs_lead_status = 'SOLD_DELIVERED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 13 WHERE vs_lead_status = 'LOST_DID_NOT_RESPOND';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 14 WHERE vs_lead_status = 'LOST_BAD_CREDIT';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 15 WHERE vs_lead_status = 'LOST_NO_AGREEMENT_REACHED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 16 WHERE vs_lead_status = 'ACTIVE_SET_APPOINTMENT';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 20 WHERE vs_lead_status = 'ACTIVE_EMAIL_INBOX';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 21 WHERE vs_lead_status = 'LOST_IMPORT_LEAD';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 22 WHERE vs_lead_status = 'LOST_PURCHASED_SAME_BRAND_DIFFERENT_DEALER';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 23 WHERE vs_lead_status = 'LOST_PURCHASED_DIFFERENT_BRAND_DIFFERENT_DEALER';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 24 WHERE vs_lead_status = 'LOST_WORKING_WITH_OTHER_SALESPERSON';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 25 WHERE vs_lead_status = 'LOST_REQUESTED_NO_FURTHER_CONTACT';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 26 WHERE vs_lead_status = 'LOST_PURCHASED_FROM_PRIVATE_PARTY';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 27 WHERE vs_lead_status = 'LOST_OUT_OF_MARKET';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 28 WHERE vs_lead_status = 'BAD_DEALER_TEST_LEAD';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 29 WHERE vs_lead_status = 'BAD_INCORRECT_CUSTOMER_PHONE';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 30 WHERE vs_lead_status = 'BAD_NO_INTENT_TO_BUY';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 31 WHERE vs_lead_status = 'BAD_INCENTIVIZED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 32 WHERE vs_lead_status = 'BAD_SHOPPING_OUT_OF_AREA';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 33 WHERE vs_lead_status = 'BAD_NO_CONTACT_IN_FIVE_DAYS';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 34 WHERE vs_lead_status = 'SERVICE_COMPLETE';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 35 WHERE vs_lead_status = 'SERVICE_APPOINTMENT_SCHEDULED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 36 WHERE vs_lead_status = 'SERVICE_APPOINTMENT_MISSED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 37 WHERE vs_lead_status = 'SERVICE_STARTED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 38 WHERE vs_lead_status = 'SERVICE_REJECTED';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 39 WHERE vs_lead_status = 'NON_CUSTOMER_INITIATED_LEAD';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_id = 40 WHERE vs_lead_status = 'SERVICE_APPOINTMENT_CANCELED';
                """)

    op.execute("""
                    UPDATE vs_lead_status_mapping SET vs_lead_status_type_id = 1 WHERE vs_lead_status_type = 'ACTIVE';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_type_id = 2 WHERE vs_lead_status_type = 'SOLD';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_type_id = 3 WHERE vs_lead_status_type = 'LOST';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_type_id = 4 WHERE vs_lead_status_type = 'BAD';
                    UPDATE vs_lead_status_mapping SET vs_lead_status_type_id = 5 WHERE vs_lead_status_type = 'COMPLETE';
                """)


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('vs_lead_status_mapping', 'vs_lead_status_type_id')
    op.drop_column('vs_lead_status_mapping', 'vs_lead_status_id')
    # ### end Alembic commands ###