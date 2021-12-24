from operator import or_
import traceback
import boto3
from botocore.config import Config as BotoCoreConfig

from api import db
from api.schema import NudgeEventModel, CompanyNudgeEventModel, NudgeActivityModel, NudgeActivityHistoryModel, \
                        MessageModel

boto_config = BotoCoreConfig(read_timeout=70)
client = boto3.client('stepfunctions', config=boto_config)

class TriggerNudgeEvent:
    '''
        Trigger class for the scheduling the nudge event for the sales person and lead
        REMINDER_SP_LEAD_MESSAGE : Reminding the sales person to respond to lead messages
        REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS : Reminding the sales person to mark the appointment as showed/no showed
        REMINDER_SP_UPDATE_LEAD_STATUS_TO_LOST : Reminding the sales person to change the status of a lead to lost lead
    '''

    def __init__(self) -> None:
        pass

    def start_scheduler(self, code : str, user : object, lead_id : int, reference_id : int = None):
        try:
            company_nudge_event = db.session.query(CompanyNudgeEventModel) \
                                    .join(NudgeEventModel) \
                                    .filter(
                                        NudgeEventModel.code == code,
                                        CompanyNudgeEventModel.company_id == user.company_id,
                                        CompanyNudgeEventModel.is_active == True,
                                        or_(
                                            CompanyNudgeEventModel.is_sms == True,
                                            CompanyNudgeEventModel.is_web_push == True
                                        )).first()

            if company_nudge_event:
                appointment_id = reference_id if code == 'REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS' else None
                nudge_activity = db.session.query(NudgeActivityModel) \
                                    .filter(
                                        NudgeActivityModel.company_nudge_event_id == company_nudge_event.id,
                                        NudgeActivityModel.user_id == user.id,
                                        NudgeActivityModel.lead_id == lead_id,
                                        NudgeActivityModel.appointment_id == appointment_id,
                                        NudgeActivityModel.is_active == True) \
                                    .order_by(NudgeActivityModel.id.desc()).first()

                is_add_new = True
                if code == 'REMINDER_SP_LEAD_MESSAGE':
                    last_received = db.session.query(MessageModel) \
                                        .filter(MessageModel.lead_id == lead_id, MessageModel.id != reference_id) \
                                        .order_by(MessageModel.id.desc()).first()
                    if nudge_activity and last_received and last_received.date_received != None:
                        is_add_new = False
                        
                elif code == 'REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS' and nudge_activity:
                    is_add_new = False

                if is_add_new:
                    if nudge_activity:
                        nudge_activity_histories = db.session.query(NudgeActivityHistoryModel) \
                                                        .filter(NudgeActivityHistoryModel.nudge_activity_id == nudge_activity.id)
                        for nudge_activity_history in nudge_activity_histories:
                            try:
                                client.stop_execution(executionArn=nudge_activity_history.execution_arn,
                                                        cause="Stop Nudge Event")
                            except client.exceptions.ExecutionDoesNotExist as e:
                                traceback.print_exc()
                    
                        nudge_activity.is_active = False
                        db.session.add(nudge_activity)
                        db.session.commit()

                    nudge_activity = NudgeActivityModel(
                                            company_nudge_event_id = company_nudge_event.id,
                                            user_id = user.id,
                                            lead_id = lead_id,
                                            appointment_id = appointment_id)

                    db.session.add(nudge_activity)
                    db.session.commit()

        except Exception as e:
            traceback.print_exc()
        

    def stop_scheduler(self, code : str, user : object, lead_id : int, reference_id : int = None):
        try:
            company_nudge_event = db.session.query(CompanyNudgeEventModel) \
                                    .join(NudgeEventModel) \
                                    .filter(
                                        NudgeEventModel.code == code,
                                        CompanyNudgeEventModel.company_id == user.company_id,
                                        CompanyNudgeEventModel.is_active == True,
                                        or_(
                                            CompanyNudgeEventModel.is_sms == True,
                                            CompanyNudgeEventModel.is_web_push == True
                                        )).first()

            if company_nudge_event:
                appointment_id = reference_id if code == 'REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS' else None
                nudge_activity = db.session.query(NudgeActivityModel) \
                                    .filter(
                                        NudgeActivityModel.company_nudge_event_id == company_nudge_event.id,
                                        NudgeActivityModel.user_id == user.id,
                                        NudgeActivityModel.lead_id == lead_id,
                                        NudgeActivityModel.appointment_id == appointment_id,
                                        NudgeActivityModel.is_active == True) \
                                    .order_by(NudgeActivityModel.id.desc()).first()
                
                if nudge_activity:
                    nudge_activity_histories = db.session.query(NudgeActivityHistoryModel) \
                                                                .filter(NudgeActivityHistoryModel.nudge_activity_id == nudge_activity.id)
                    for nudge_activity_history in nudge_activity_histories:
                        try:
                            client.stop_execution(executionArn=nudge_activity_history.execution_arn,
                                                    cause="Stop Nudge Event")
                        except client.exceptions.ExecutionDoesNotExist as e:
                            traceback.print_exc()
                
                    nudge_activity.is_active = False
                    db.session.add(nudge_activity)
                    db.session.commit()
        
        except Exception as e:
            traceback.print_exc()
