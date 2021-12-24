# Hack for sibling import for importing api for local testing
#import sys, os
#sys.path.insert(0, os.path.abspath('..'))
import config
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from datetime import datetime, timedelta
import boto3
from botocore.config import Config as BotoCoreConfig
from json import loads

from api.models import User, Leads, Message, MessageLog, CampaignLeadSummary
from api.sms import send_sms
from api.utils import util

import time

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

Session = sessionmaker(bind=engine)

boto_config = BotoCoreConfig(read_timeout=70)
client = boto3.client('stepfunctions', config=boto_config)


def activity_poller():
    while True:
        response = client.get_activity_task(activityArn=config.REMINDER_POLLER_ACTIVITY_ARN,
                                            workerName='Appointment_Reminder_Activity_Poller')
        if 'taskToken' not in response:
            print('No Task Token')
        else:
            session = Session()
            activity_token = response['taskToken']
            _input = loads(response['input'])
            print(_input)
            lead = session.query(Leads).filter(Leads.id == _input["lead_id"]).first()
            if lead:
                appt_notif_phone, system_user_id  = util.get_from_number(session, _input["company_id"], 'APPOINTMENT', client, activity_token)
                if not appt_notif_phone:
                    continue
            else:
                error_string = f"Lead with id {_input['lead_id']} doesn't exist"
                client.send_task_failure(taskToken=activity_token, error="NoLead", cause=error_string)
                print(error_string)
                continue
            
            print(f"appt_notif_phone (twilio) = {appt_notif_phone}, user_phone (user) = {_input['to_phone']}")
            
            message_sid = send_sms(from_number=appt_notif_phone, to_number=_input["to_phone"], message_body=_input["content"])
            if message_sid:
                date_sent = datetime.utcnow()
                message = Message(
                        system_user_id=system_user_id, lead_id=_input["lead_id"], direction='TO_LEAD',
                        date_sent=date_sent, content=_input["content"], message_sid=message_sid
                )
                session.add(message)
                session.commit()

                message_log = MessageLog(message_id=message.id, from_phone=appt_notif_phone, to_phone=_input["to_phone"])
                session.add(message_log)
                session.commit()

                client.send_task_success(taskToken=activity_token, output='true')
            else:
                client.send_task_failure(taskToken=activity_token, error="TwilioError", cause="There was a problem sending SMS")
            session.close()
if __name__ == "__main__":
    activity_poller()
