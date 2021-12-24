# Hack for sibling import for importing api for local testing
# import sys, os
# sys.path.insert(0, os.path.abspath('..'))
import config, traceback
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
        try:
            response = client.get_activity_task(activityArn=config.MSG_POLLER_ACTIVITY_ARN,
                                                workerName='SMS_Activity_Poller')
            if 'taskToken' not in response:
                print('No Task Token')
                # time.sleep(2)
            else:
                session = Session()
                activity_token = response['taskToken']
                _input = loads(response['input'])
                print(_input)
                lead = session.query(Leads).filter(Leads.id == _input["id"]).first()
                if lead:
                    campaign_phone, system_user_id  = util.get_from_number(session, _input["company_id"], 'CAMPAIGN', client, activity_token)
                    if not campaign_phone:
                        continue

                else:
                    error_string = f"Lead with id {_input['id']} doesn't exist"
                    client.send_task_failure(taskToken=activity_token, error="NoLead", cause=error_string)
                    print(error_string)
                    continue
                
                print(f"campaign_phone (twilio) = {campaign_phone}, user_phone (user) = {_input['to_phone']}")

                message_sid = send_sms(from_number=campaign_phone, to_number=_input["to_phone"], message_body=_input["content"])
                
                if message_sid:
                    date_sent = datetime.utcnow()
                    message = Message(
                            system_user_id=system_user_id, lead_id=_input["id"], campaign_id=_input["campaign_id"], direction='TO_LEAD',
                            date_sent=date_sent, content=_input["content"], message_sid=message_sid
                        )
                    session.add(message)
                    session.commit()

                    message_log = MessageLog(message_id=message.id, from_phone=campaign_phone, to_phone=_input["to_phone"])
                    session.add(message_log)
                    session.commit()

                    util.update_lead_status(lead, lead_activity = 'SENT_MESSAGE')

                    camp_lead_sum = session.query(CampaignLeadSummary).filter(
                        CampaignLeadSummary.campaign_id == _input["campaign_id"],
                        CampaignLeadSummary.lead_id == _input["id"]
                    ).first() 
                    if not camp_lead_sum:
                        camp_lead_sum = CampaignLeadSummary(
                                                    campaign_id = _input["campaign_id"], lead_id = _input["id"], 
                                                    status = "SENT", last_message_sent_date = date_sent, 
                                                    last_message_received_date = None, num_attempts_before_response = 1)
                        session.add(camp_lead_sum)
                        session.commit()
                        session.refresh(camp_lead_sum)
                    else:
                        camp_lead_sum.last_message_sent_date = date_sent
                        
                        if camp_lead_sum.status not in ['RESPONDED', 'ENGAGED']:
                            if camp_lead_sum.num_attempts_before_response:
                                camp_lead_sum.num_attempts_before_response += 1
                            else:
                                camp_lead_sum.num_attempts_before_response = 1

                        if camp_lead_sum.status in ['UNCONTACTED', 'QUEUED']:
                            camp_lead_sum.status = 'SENT'
                        
                        session.add(camp_lead_sum)
                        session.commit()

                    client.send_task_success(taskToken=activity_token, output='true')
                    
                else:
                    client.send_task_failure(taskToken=activity_token, error="TwilioError", cause="There was a problem sending SMS")
                session.close()
        except client.exceptions.ExecutionDoesNotExist as e:
            print("=================Step Function Error================")
            traceback.print_exc()
            continue
        except Exception as e:
            print("=================General Error================")
            traceback.print_exc()
            continue

if __name__ == "__main__":
    activity_poller()
