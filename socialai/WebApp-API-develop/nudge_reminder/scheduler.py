# Hack for sibling import for importing api for local testing
# import sys, os
# sys.path.insert(0, os.path.abspath('..'))
import config, boto3, time, pytz, uuid, os
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, or_, case
from datetime import datetime, timedelta
from botocore.config import Config as BotoCoreConfig
from json import dumps 

from api.utils.fcm_util import FCMInit
from api.utils import util
from api.models import NudgeActivity, CompanyNudgeEvent, NudgeActivityHistory, LeadVehicleOfInterest, Message

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
APP_URL = os.getenv('CORS_ORIGIN', 'http://localhost:8000')

Session = sessionmaker(bind=engine)
fcm_init = FCMInit()

boto_config = BotoCoreConfig(read_timeout=70)
client = boto3.client('stepfunctions', config=boto_config)

TEMPORAL_VALUES = {
    'SECONDS': 1,
    'MINUTES': 60,
    'HOURS': 60 * 60,
    'DAYS': 60 * 60 * 24,
    'WEEKS': 60 * 60 * 24 * 7,
    'MONTHS': 60 * 60 * 24 * 30
}

def convert_to_seconds(numeric_value: int, temporal_value: str) -> int:
    """Converts the temporal numeric value to seconds.

    Args:
        numeric_value: An integer value representing the time interval.
        temporal_value: A string value representing the time interval.

    Returns:
        An integer representing the time interval in seconds.
    """
    return numeric_value * TEMPORAL_VALUES[temporal_value]

def start_step_execution(_input):
    try:
        _uuid = str(uuid.uuid4())
        response = client.start_execution(stateMachineArn=config.NUDGE_STATE_MACHINE_ARN, name=_uuid, input=dumps(_input))
        time.sleep(10)
        return response
    except client.exceptions.ExecutionAlreadyExists as e:
        print("Exception:", e)
        _uuid = str(uuid.uuid4())
        response = client.start_execution(stateMachineArn=config.NUDGE_STATE_MACHINE_ARN, name=_uuid, input=dumps(_input))
        time.sleep(10)
        return response


def nudge_scheduling():
    session = Session()
    print("Start Processing")
    nudge_activities = session.query(NudgeActivity) \
                            .join(CompanyNudgeEvent) \
                            .filter(
                                NudgeActivity.is_active == True,
                                or_(
                                    CompanyNudgeEvent.is_sms == True,
                                    CompanyNudgeEvent.is_web_push == True)
                                ).all()

    for nudge_activity in nudge_activities:
        company_nudge_event = nudge_activity.company_nudge_event
        nudge_event = company_nudge_event.nudge_event

        last_nudge_activity_history = session.query(NudgeActivityHistory) \
                                        .filter(NudgeActivityHistory.nudge_activity_id == nudge_activity.id) \
                                        .order_by(NudgeActivityHistory.id.desc()).first()

        if last_nudge_activity_history and not last_nudge_activity_history.trigger_on:
            continue

        message_text = company_nudge_event.first_template_text
        frequency = company_nudge_event.start_delay
        frequency_type = company_nudge_event.start_delay_type
        last_trigger = datetime.utcnow()
        if last_nudge_activity_history:
            message_text = company_nudge_event.reminder_template_text
            frequency = company_nudge_event.frequency
            frequency_type = company_nudge_event.frequency_type
            last_trigger = last_nudge_activity_history.trigger_on

        frequency_sec = convert_to_seconds(frequency, frequency_type.value)
        next_trigger = last_trigger + timedelta(seconds = frequency_sec)

        lead = nudge_activity.lead
        user = nudge_activity.user
        lead_voi = None
        event_time = None
        timezone = None
        if nudge_event.code == 'REMINDER_SP_LEAD_MESSAGE':
            last_message = Message.query.filter(Message.lead_id == lead.id, Message.date_received != None).order_by(Message.id.desc()).first()
            event_time = last_message.date_received

        elif nudge_event.code == 'REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS':
            appointment = nudge_activity.appointment
            lead_voi = appointment.discussed_voi
            event_time = appointment.start_datetime
            timezone = appointment.timezone

        if timezone:
            timezone = pytz.timezone(timezone)
        utc_start_date = event_time.replace(tzinfo=pytz.UTC)
        local_start_date = utc_start_date.astimezone(timezone)
        text_start_date = f'{local_start_date.strftime("%A, %B %d, %Y at %I:%M %p")} {local_start_date.tzname()}'

        if not lead_voi and lead:
            lead_voi = session.query(LeadVehicleOfInterest) \
                            .filter(LeadVehicleOfInterest.lead_id == lead.id) \
                            .order_by(case(value=LeadVehicleOfInterest.is_current, whens={True: 0, False: 1}).label("is_current"), LeadVehicleOfInterest.id.desc()).first()
        
        voi_name = ''
        if lead_voi:
            voi_name = f'{lead_voi.make} {lead_voi.model}'
        message_text = message_text \
                            .replace('{leadName}', f'{user.first_name} {user.last_name}') \
                            .replace('{vehicleOfInterest}', voi_name) \
                            .replace('{eventDateTime}', text_start_date) \
                            + f'''

Login URL to {util.make_shorten(APP_URL)}'''
        
        send_datetime = f'{str(next_trigger if next_trigger >= datetime.utcnow() else datetime.utcnow()).replace(" ", "T")}Z'
        _input = {"sendDateTime": send_datetime, "id": lead.id, "content": message_text,
                    "to_phone": user.phone, "nudge_activity_id": nudge_activity.id}
        print("*" * 50)
        print(f"Start Execution: {nudge_event.code} Event for User: {user.first_name} {user.last_name} & Lead: {lead.full_name}")
        print("*" * 50)
        response = start_step_execution(_input)

        nudge_activity_history = NudgeActivityHistory(
                                        nudge_activity_id = nudge_activity.id,
                                        execution_arn = response.get('executionArn'),
                                        content = message_text
                                    )
        session.add(nudge_activity_history)
        session.commit()


    session.close()

# The scheduler depends upon CreateAppointment, UpdateAppointment and DeleteAppointment Mutations
def scheduler():
    while(True):
        nudge_scheduling()

        # time.sleep(10)


if __name__ == "__main__":
    scheduler()
