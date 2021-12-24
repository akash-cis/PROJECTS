# Hack for sibling import for importing api for local testing
# import sys, os
# sys.path.insert(0, os.path.abspath('..'))
import config
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
import boto3
from botocore.config import Config as BotoCoreConfig
from json import loads

from api.models import NudgeActivity, NudgeActivityHistory, FCMDevice
from api.sms import send_sms
from api.utils import util
from api.utils.fcm_util import FCMInit

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

Session = sessionmaker(bind=engine)

boto_config = BotoCoreConfig(read_timeout=70)
client = boto3.client('stepfunctions', config=boto_config)
fcm_init = FCMInit()

def activity_poller():
    while True:
        response = client.get_activity_task(activityArn=config.NUDGE_ACTIVITY_ARN,
                                            workerName='Nudge_Reminder_Activity_Poller')
        if 'taskToken' not in response:
            print('No Task Token')
        else:
            session = Session()
            activity_token = response['taskToken']
            _input = loads(response['input'])
            print(_input)
            nudge_activity = session.query(NudgeActivity).filter(
                                            NudgeActivity.id == _input["nudge_activity_id"],
                                            NudgeActivity.is_active == True).first()
            
            if not nudge_activity:
                error_string = f"Nudge Activity with id {_input['nudge_activity_id']} doesn't exist"
                client.send_task_failure(taskToken=activity_token, error="NoNudgeHistory", cause=error_string)
                print(error_string)
                continue

            company_nudge_event = nudge_activity.company_nudge_event
            nudge_event = company_nudge_event.nudge_event
            
            last_nudge_activity_history = session.query(NudgeActivityHistory) \
                                            .filter(
                                                NudgeActivityHistory.nudge_activity_id == nudge_activity.id,
                                                NudgeActivityHistory.trigger_on == None) \
                                            .order_by(NudgeActivityHistory.id.desc()).first()
            
            if not last_nudge_activity_history:
                continue
            
            lead = nudge_activity.lead
            user = nudge_activity.user
            
            message_title = ''
            phone_use_type = 'GENERAL'
            if nudge_event.code == 'REMINDER_SP_LEAD_MESSAGE':
                phone_use_type = 'ACTIVITY_CENTER'
                message_title = 'New Lead Message'
            elif nudge_event.code == 'REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS':
                phone_use_type = 'APPOINTMENT'
                message_title = 'Update the Appointment Status'

            is_task_success = False
            is_twilio_error = False
            if company_nudge_event.is_sms:    
                appt_notif_phone, system_user_id  = util.get_from_number(session, user.company_id, phone_use_type, client, activity_token)
                if appt_notif_phone:
                    print(f"appt_notif_phone (twilio) = {appt_notif_phone}, user_phone (user) = {_input['to_phone']}")
                    message_sid = send_sms(from_number=appt_notif_phone, to_number=_input['to_phone'], message_body=_input['content'])
                    if message_sid:
                        is_task_success = True
                    else:
                        is_twilio_error = True

            if company_nudge_event.is_web_push:
                fcm_devices = session.query(FCMDevice).filter(FCMDevice.user_id == user.id)
                if fcm_devices:
                    fcm_init.send([fcm_device.registration_id for fcm_device in fcm_devices], message_title, _input['content'])
                is_task_success = True

            last_nudge_activity_history.trigger_on = datetime.utcnow()
            session.add(last_nudge_activity_history)
            session.commit()
            if is_task_success:
                client.send_task_success(taskToken=activity_token, output='true')
            
            if is_twilio_error:
                client.send_task_failure(taskToken=activity_token, error="TwilioError", cause="There was a problem trigger Event")
            session.close()

if __name__ == "__main__":
    activity_poller()
