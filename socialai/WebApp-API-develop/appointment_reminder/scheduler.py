# Hack for sibling import for importing api for local testing
# import sys, os
# sys.path.insert(0, os.path.abspath('..'))
import config, boto3, time, pytz, uuid
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, or_, func
from datetime import datetime, timedelta
from botocore.config import Config as BotoCoreConfig
from json import dumps 

from api.utils.trigger_nudge_event import TriggerNudgeEvent
from api.utils import util
from api.models import User, Appointment, ScheduledAppointmentReminder, Leads, Message
from api.sms import send_sms

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

Session = sessionmaker(bind=engine)
trigger_nudge_event = TriggerNudgeEvent()

boto_config = BotoCoreConfig(read_timeout=70)
client = boto3.client('stepfunctions', config=boto_config)

def start_step_execution(_input):
    try:
        _uuid = str(uuid.uuid4())
        response = client.start_execution(stateMachineArn=config.REMINDER_SCHEDULER_STATE_MACHINE_ARN, name=_uuid, input=dumps(_input))
        time.sleep(10)
        return response
    except client.exceptions.ExecutionAlreadyExists as e:
            print("Exception:", e)
            _uuid = str(uuid.uuid4())
            response = client.start_execution(stateMachineArn=config.REMINDER_SCHEDULER_STATE_MACHINE_ARN, name=_uuid, input=dumps(_input))
            time.sleep(10)
            return response

def future_appointments():
    session = Session()
    appointments = session.query(Appointment).filter(
            Appointment.end_datetime > datetime.utcnow(),
            Appointment.appointment_status != "CANCELLED",
            Appointment.lead_phone != None
    ).all()
    for appointment in appointments:
        if isinstance(appointment.start_datetime, datetime) and isinstance(appointment.date_created, datetime):
            if appointment.start_datetime < appointment.date_created + timedelta(hours=24) or \
            appointment.start_datetime < datetime.utcnow() + timedelta(hours=24):
                print(f"Appointment with id {appointment.id} within 24 Hours")
                continue

            reminder_time = appointment.start_datetime - timedelta(hours=24)

            timezone = pytz.timezone(appointment.timezone)
            utc_start_datetime = appointment.start_datetime.replace(tzinfo=pytz.UTC)
            local_start_datetime = utc_start_datetime.astimezone(timezone)

            sales_person = session.query(User).filter(User.id == appointment.user_id).first()
            if sales_person:
                local_time = local_start_datetime.strftime("%I:%M %p")
                sales_person_name = f"{sales_person.first_name} {sales_person.last_name}"
                company_name = sales_person.company.name
                if appointment.is_confirmed:
                    content = f"""Reminder: You have an appointment tomorrow at {local_time} with {sales_person_name} at {company_name}.
Reply R to Reschedule, D to decline, STOP to opt out.
Location: {util.get_formatted_address(appointment.user.company)}"""
                else:
                    content = f"""Reminder: You have an appointment tomorrow at {local_time} with {sales_person_name} at {company_name}.
Reply C to Confirm, R to Reschedule, D to decline, STOP to opt out.
Location: {util.get_formatted_address(appointment.user.company)}"""
            else:
                content = f"""Reminder: You have an appointment tomorrow at {local_time} regarding {appointment.summary}.
Reply R to Reschedule, D to decline, STOP to opt out.
Location: {util.get_formatted_address(appointment.user.company)}"""

            sendDateTime = f'{reminder_time.isoformat()}Z'
            _input = {
                "sendDateTime": sendDateTime, "appointment_id": appointment.id, "lead_id": appointment.lead_id,
                "to_phone": appointment.lead_phone, "content": content, "company_id": appointment.company_id
            }
            scheduled_appointment_reminder = session.query(ScheduledAppointmentReminder).filter(
                    ScheduledAppointmentReminder.appointment_id == appointment.id,
                    ScheduledAppointmentReminder.execution_arn != None
            ).first()
            if appointment.sequence == 0 and not scheduled_appointment_reminder:
                response = start_step_execution(_input)
                print(f"Starting Execution for Scheduled Appointment with id {appointment.id}")
                appointment_reminder = ScheduledAppointmentReminder(
                                                appointment_id=appointment.id, sequence=appointment.sequence, 
                                                execution_arn=response.get('executionArn'))
                session.add(appointment_reminder)
                session.commit()
            elif appointment.sequence > 0 and scheduled_appointment_reminder and scheduled_appointment_reminder.sequence < appointment.sequence:
                client.stop_execution(executionArn=scheduled_appointment_reminder.execution_arn, cause="Appointment Rescheduled")
                response = start_step_execution(_input)
                print(f"Starting Execution for Rescheduled Appointment with id {appointment.id}")
                scheduled_appointment_reminder.sequence = appointment.sequence
                scheduled_appointment_reminder.execution_arn = response.get('executionArn')
                session.add(scheduled_appointment_reminder)
                session.commit()

    subquery = session.query(Appointment.id).filter(
            Appointment.end_datetime > datetime.utcnow(),
            Appointment.appointment_status == "CANCELLED",
            Appointment.lead_phone != None
    )
    scheduled_appointment_reminders = session.query(ScheduledAppointmentReminder).filter(
        ScheduledAppointmentReminder.appointment_id.in_(subquery),
        ScheduledAppointmentReminder.execution_arn != None
    ).all()
    for scheduled_appointment_reminder in scheduled_appointment_reminders:
        client.stop_execution(executionArn=scheduled_appointment_reminder.execution_arn, cause="Appointment Cancelled")

    session.query(ScheduledAppointmentReminder).filter(
        ScheduledAppointmentReminder.appointment_id.in_(subquery),
        ScheduledAppointmentReminder.execution_arn != None
    ).delete(synchronize_session='fetch')
    session.commit()

    session.close()


def past_appointments():
    session = Session()
    appointments = session.query(Appointment).filter(
            # Appointment.start_datetime <= datetime.utcnow() - timedelta(hours=24),
            Appointment.start_datetime <= datetime.utcnow(),
            Appointment.lead_phone != None,
            Appointment.appointment_status.notin_(['SHOWED', 'NO_SHOWED', 'CANCELLED'])
    ).all()

    for appointment in appointments:
        trigger_nudge_event.start_scheduler('REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS', appointment.user, appointment.lead_id, appointment.id)

    session.close()

# The scheduler depends upon CreateAppointment, UpdateAppointment and DeleteAppointment Mutations
def scheduler():
    while(True):
        future_appointments()
        past_appointments()

        # time.sleep(10)


if __name__ == "__main__":
    scheduler()
