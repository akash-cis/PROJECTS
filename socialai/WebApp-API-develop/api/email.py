import boto3
from botocore.exceptions import ClientError
import os
from flask import render_template
from api import db
from api.schema import NotificationModel
from api.models import Deal, User
from config import SITE_TITLE, SUPPORT_EMAIL, NOTIFICATION_EMAIL, APPOINTMENT_EMAIL_TESTING
import config
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.mime.text import MIMEText

from email.mime.base import MIMEBase
from email.utils import formatdate
from email import encoders

from api import app
import datetime
import pytz
import requests
import json


SENDER = f"{SITE_TITLE} <{SUPPORT_EMAIL}>"
REPLY = [f"{SITE_TITLE} <{NOTIFICATION_EMAIL}>"]

client = boto3.client('ses')

APP_URL = os.getenv('CORS_ORIGIN', 'http://localhost:8000')


def get_recipient(destination):
    environment = config.environment
    return destination if environment == 'prod' else 'test@funnelai.co'


def send_email(destination, subject, html_body, text_body=f'You have received a notification from {SITE_TITLE}'):
    try:
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    get_recipient(destination),
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': 'UTF-8',
                        'Data': html_body,
                    },
                    'Text': {
                        'Charset': 'UTF-8',
                        'Data': text_body,
                    },
                },
                'Subject': {
                    'Charset': 'UTF-8',
                    'Data': subject,
                },
            },
            Source=SENDER,
            ReplyToAddresses=REPLY,
        )

    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("Email sent! Message ID:"),
        print(response['MessageId'])


def send_email_with_attachment(
        destination, subject, html_body=None,
        text_body=f'You have received a notification from {SITE_TITLE}', attachment=None):
    # Create a multipart/mixed parent container.
    msg = MIMEMultipart('mixed')
    # Add subject, from and to lines.
    msg['Subject'] = subject
    msg['From'] = SENDER
    msg['To'] = get_recipient(destination)

    # Define the attachment part and encode it using MIMEApplication.
    att = MIMEApplication(open(attachment, 'rb').read())
    # Add a header to tell the email client to treat this part as an attachment,
    # and to give the attachment a name.
    att.add_header('Content-Disposition', 'attachment', filename=os.path.basename(attachment))

    # If exists, add body to the parent container.
    if html_body:
        body = MIMEText(html_body, 'html')
        msg.attach(body)

    # Add the attachment to the parent container.
    msg.attach(att)

    try:
        response = client.send_raw_email(
            Source=SENDER,
            Destinations=[
                get_recipient(destination),
            ],
            RawMessage={
                'Data': msg.as_string()
            },
        )

    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("Email sent! Message ID:"),
        print(response['MessageId'])


def send_invitation(email, temp_password, first_name):
    body = render_template('invitation.html', first_name=first_name, temp_password=temp_password, APP_URL=APP_URL,
                           APP_TITLE=SITE_TITLE)
    print(body)
    send_email(email, f'{SITE_TITLE} Invitation', body)


def send_existing_invitation(email, first_name):
    body = render_template('invitation_exist.html', first_name=first_name, APP_URL=APP_URL, APP_TITLE=SITE_TITLE)
    send_email(email, f'{SITE_TITLE} Invitation', body)


def send_new_response_notification(deal: Deal, message):
    # It will work for notification_config.responses = True or None
    if dnd_check(deal.sales_person) and deal.allow_notifications and \
        deal.sales_person.notification_config is not None and \
            deal.sales_person.notification_config.responses is not False:
        with app.app_context():
            body = render_template(
                'newResponse.html',
                screen_name=deal.screen_name,
                source=deal.source,
                message=message,
                APP_URL=APP_URL,
                APP_TITLE=SITE_TITLE
            )
            notification = NotificationModel(user_id=deal.user_id, read=False, date=datetime.datetime.utcnow(),
                                             notification_type='RESPONSE', text='You have a new response')
            db.session.add(notification)
            db.session.commit()
            send_email(deal.sales_person.email, 'New Response Message', body)


def send_support_ticket(user: User, message, subject):
    body = render_template(
        'support_ticket.html',
        name=f'{user.first_name} {user.last_name}',
        company=user.company.name,
        email=user.email,
        subject=subject,
        message=message,
        APP_URL=APP_URL,APP_TITLE=os.getenv('SITE_TITLE')
    )
    # TODO: Remove it later. Just for testing purposes.
    # notification = NotificationModel(user_id=user.id, read=False, date=datetime.datetime.utcnow(),
    #                                  notification_type='OTHER', text='You have a new support ticket')
    # db.session.add(notification)
    # db.session.commit()
    # send_email('support@funnelai.com', 'New Support Ticket', body)

    # add ticket to Freshdesk
    post_dict = {
        'description': f'Name: {user.first_name} {user.last_name} <br />Company: {user.company.name} <br />'
                       f'Description: {message}',
        'subject': subject,
        'email': user.email,
    }
    headers = {'Content-Type': 'application/json'}
    r = requests.post(config.FRESHDESK_ADD_TICKET_API,
                      # auth=(FRESHDESK_API_KEY, "X"),
                      auth=(config.FRESHDESK_USERNAME, config.FRESHDESK_PASSWORD),
                      headers=headers,
                      data=json.dumps(post_dict),
                      )


def send_adf_email(email, subject, adf_xml_file):
    send_email_with_attachment(destination=email, subject=subject, attachment=adf_xml_file)


def send_export_email(econfig, email, subject, export_file=None):
    with app.app_context():
        body = render_template(
            'ad_export.html',
            name=f'{econfig.user.first_name} {econfig.user.last_name}',
            config=econfig.name,
            APP_URL=APP_URL, APP_TITLE=os.getenv('SITE_TITLE')
        )
        text = f'{SITE_TITLE} - Your Ad Export is ready'
        send_email(destination=email, subject=text, html_body=body)


def send_notification_email(nconfig, detail, text, subject):
    with app.app_context():
        body = render_template(
            'notification.html',
            name=f'{nconfig.user.first_name} {nconfig.user.last_name}',
            type=detail.set_type,
            button=(f'{SITE_TITLE} Prospects Dashboard'
                    if detail.set_type == 'PROSPECTS' else f'{SITE_TITLE} Life Events Dashboard'),
            url="prospect" if detail.set_type == 'PROSPECTS' else "life-events",
            APP_URL=APP_URL
        )
        text = f'{SITE_TITLE} - New Notification'
        send_email(destination=nconfig.user.email, subject=text, html_body=body)


def dnd_check(user):
    if not user.notification_config:
        return True
    elif user.notification_config and not user.notification_config.notifications_allowed:
        return False
    elif (user.notification_config and user.notification_config.notifications_allowed and
          not user.notification_config.dnd_start):
        return True
    else:
        now = datetime.datetime.utcnow()
        today = datetime.date.today()
        dnd_start = datetime.datetime.combine(today, user.notification_config.dnd_start)
        dnd_end = datetime.datetime.combine(today, user.notification_config.dnd_end)
        timezone = pytz.timezone(user.notification_config.timezone)
        aware_start = timezone.localize(dnd_start)
        aware_end = timezone.localize(dnd_end)
        now_local = now.replace(tzinfo=pytz.UTC)
        now_local = now_local.astimezone(timezone)

        if aware_end < aware_start and now_local.time() > aware_end.time():
            aware_end = aware_end + datetime.timedelta(days=1)
        elif aware_end < aware_start and now_local.time() < aware_end.time():
            aware_start = aware_start - datetime.timedelta(days=1)

        if aware_start < now_local < aware_end:
            return False
        else:
            return True

def send_appointment_email(destination, subject, ical):
    if config.environment != 'prod' and not APPOINTMENT_EMAIL_TESTING:
        destination = get_recipient(destination)
    # Create a multipart/mixed parent container.
    msg = MIMEMultipart('mixed')
    # Add subject, from and to lines.
    msg['Date'] = formatdate(localtime=True)
    msg['Subject'] = subject
    msg['From'] = SENDER
    msg['To'] = destination

    msgAlternative = MIMEMultipart('alternative')
    msg.attach(msgAlternative)

    part_email = MIMEText(ical,'calendar;method=REQUEST')

    ical_atch = MIMEBase('text', 'calendar', method="REQUEST", name="invite.ics")
    ical_atch.set_payload(ical)
    encoders.encode_base64(ical_atch)
    ical_atch.add_header('Content-Disposition', 'attachment; filename="invite.ics"')

    msgAlternative.attach(part_email)
    msgAlternative.attach(ical_atch)

    try:
        response = client.send_raw_email(
            Source=SENDER,
            Destinations=[
                destination,
            ],
            RawMessage={
                'Data': msg.as_string()
            },
        )

    except ClientError as e:
        print(e.response['Error'])
    else:
        print("Email sent! Message ID:"),
        print(response['MessageId'])
