"""Added unread count field in lead table

Revision ID: 3162e0cd1c3c
Revises: 3582f75bcf06
Create Date: 2021-10-13 12:20:58.469812

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3162e0cd1c3c'
down_revision = '3582f75bcf06'
branch_labels = None
depends_on = None

### Defined enum type and temp type for add & remove field value.
name = 'appointmentstatus'
tmp_name = 'tmp_' + name

old_options = ('SCHEDULED', 'RESCHEDULED', 'CANCELLED')
new_options = ('SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'NO_SHOWED')

old_type = sa.Enum(*old_options, name = name)
new_type = sa.Enum(*new_options, name = name)

tcr = sa.sql.table('appointment', sa.Column('appointment_status', new_type, nullable=False))
tcr_history = sa.sql.table('appointment_history', sa.Column('appointment_status', new_type, nullable=False))


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('leads', sa.Column('unread_count', sa.Integer(), nullable=True))

    op.execute('UPDATE message SET is_read = True')
    op.execute('UPDATE leads SET unread_count = 0')
    # ### end Alembic commands ###

    op.execute('ALTER TYPE ' + name + ' RENAME TO ' + tmp_name)

    new_type.create(op.get_bind())
    op.execute('ALTER TABLE appointment ALTER COLUMN appointment_status ' +
               'TYPE ' + name + ' USING appointment_status::text::' + name)
    op.execute('ALTER TABLE appointment_history ALTER COLUMN appointment_status ' +
               'TYPE ' + name + ' USING appointment_status::text::' + name)
    op.execute('DROP TYPE ' + tmp_name)


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('leads', 'unread_count')
    # ### end Alembic commands ###
    
    # Convert 'NO_SHOWED' appointment_status into 'CANCELLED'
    op.execute(tcr.update().where(tcr.c.appointment_status=='NO_SHOWED')
               .values(appointment_status='CANCELLED'))

    op.execute(tcr_history.update().where(tcr_history.c.appointment_status=='NO_SHOWED')
               .values(appointment_status='CANCELLED'))

    op.execute('ALTER TYPE ' + name + ' RENAME TO ' + tmp_name)

    old_type.create(op.get_bind())
    op.execute('ALTER TABLE appointment ALTER COLUMN appointment_status ' +
               'TYPE ' + name + ' USING appointment_status::text::' + name)
    op.execute('ALTER TABLE appointment_history ALTER COLUMN appointment_status ' +
               'TYPE ' + name + ' USING appointment_status::text::' + name)
    op.execute('DROP TYPE ' + tmp_name)