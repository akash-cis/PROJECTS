import config
import os
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from api import elasticsearch
from api.models import NotificationConfig, NotificationConfigDetail
from api.schema import NotificationModel, NotificationConfigModel, NotificationConfigDetailModel
from api.email import send_new_response_notification
from api.exports_service import export_file, remove_file_from_s3
from api.email import dnd_check, send_notification_email

from sqlalchemy import func, Enum, or_, and_, not_, extract, cast, Integer, text
from datetime import datetime, timedelta, tzinfo

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

Session = sessionmaker(bind=engine)

session = Session()


class simple_utc(tzinfo):
    def tzname(self,**kwargs):
        return "UTC"
    def utcoffset(self, dt):
        return timedelta(0)

# CHECK prospects and life events count according to notifications configs and notify to users.
# Get all configs according to their lust run, interval and DND settings (tricky part)
# For each config get their details
# For each detail search in elastic according to their type, filterSet (if it has) and count
# If the count is reached, then create notifications according to:
# 1. if app: save notification in DB (w/ read = false)
# 2. if email: send email (use user email)
# 3. if sms: send sms (PENDING)
def check_for_notifications():
    current_date = datetime.utcnow()
    print(f'Checking for notifications. Current datetime: {current_date}')
    intervalCheck = or_(NotificationConfigModel.last_run == None, func.extract('epoch', current_date - NotificationConfigModel.last_run) > (cast(NotificationConfigModel.interval, Integer) * 60))
    notif_configs = session.query(NotificationConfig).filter(and_(NotificationConfigModel.notifications_allowed == True, intervalCheck)).all()
    for config in notif_configs:
        if dnd_check(config.user):
            for detail in config.details:
                args = {}
                newer = config.last_run if config.last_run else current_date - timedelta(minutes=30) # minutes=config.interval
                args["newer"] = newer.replace(tzinfo=simple_utc()).isoformat()
                print(f'datetime: {args["newer"]}')
                count = elasticsearch.execute_notifications_count(config.user, args, detail.filter_set.filters if detail.filter_set else None, detail.set_type)
                print(f'count: {count}')
                if count > detail.count:
                    if config.app:
                        text=f'You have new {detail.set_type} data.'
                        notification = NotificationModel(user_id=config.user.id, read=False, date=datetime.utcnow(), notification_type='NOTIFICATION', text=text)
                        session.add(notification)
                    if config.email:
                        text=f'You have new {detail.set_type} data.'
                        send_notification_email(config, detail, text, subject=f"{config.SITE_TITLE} - New notification")
                    if config.sms:
                        print('PENDING: sending sms notification')
            config.last_run = current_date
            session.commit()
    return True

