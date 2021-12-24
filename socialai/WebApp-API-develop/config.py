# Load environment variables from .env file
import os
import boto3
from dotenv import load_dotenv
load_dotenv()

VERSION = "0.7.108"

stage = os.getenv("STAGE", "stage")
environment = "prod" if stage == "prod" else "dev"

print(f"AWS_PROFILE: {os.getenv('AWS_PROFILE')}, env={environment}")

ssm = boto3.client("ssm")

db_host = os.getenv("DB_HOST", None)
db_name = os.getenv("DB_NAME", stage)
db_user = os.getenv("DB_USER", None)
db_pass = os.getenv("DB_PASSWORD", None)

if db_host is None or db_user is None or db_pass is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/webapp/database/host",
        f"/{environment}/webapp/database/port",
        f"/{environment}/webapp/database/user",
        f"/{environment}/webapp/database/password"
    ], WithDecryption=True)

    db_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    if db_host is None:
        db_host = f"{db_config['host']}:{db_config['port']}"

    if db_user is None:
        db_user = db_config["user"]

    if db_pass is None:
        db_pass = db_config["password"]

SITE = os.getenv("SITE")
SITE_TITLE = os.getenv("SITE_TITLE")
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL")
NOTIFICATION_EMAIL = os.getenv("SUPPORT_EMAIL")

if SITE is None or SITE_TITLE is None or SUPPORT_EMAIL is None or NOTIFICATION_EMAIL is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/webapp/site",
        f"/{environment}/webapp/site_title",
        f"/{environment}/webapp/email/support",
        f"/{environment}/webapp/email/notification"
    ], WithDecryption=True)

    site_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    if SITE is None:
        SITE = site_config['site']

    if SITE_TITLE is None:
        SITE_TITLE = site_config['site_title']

    if SUPPORT_EMAIL is None:
        SUPPORT_EMAIL = site_config["support"]

    if NOTIFICATION_EMAIL is None:
        NOTIFICATION_EMAIL = site_config["notification"]

SQLALCHEMY_DATABASE_URI = f"postgres://{db_user}:{db_pass}@{db_host}/{db_name}"
SQLALCHEMY_TRACK_MODIFICATIONS = False

COGNITO_USERPOOL_ID = os.getenv('COGNITO_USERPOOL_ID')
COGNITO_APP_CLIENT_ID = os.getenv('COGNITO_APP_CLIENT_ID')

AINGINE_GRAPHQL_API_URL = os.getenv("AINGINE_GRAPHQL_API_URL", None)

if AINGINE_GRAPHQL_API_URL is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/webapp/aingine_graphql_api_url"
    ], WithDecryption=True)
    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}
    if AINGINE_GRAPHQL_API_URL is None:
        AINGINE_GRAPHQL_API_URL = app_config["aingine_graphql_api_url"]

S3_BUCKET_ADF_ATTACHMENTS = os.getenv('S3_BUCKET_ADF_ATTACHMENTS')
S3_BUCKET_ADF_ATTACHMENTS_FOLDER = os.getenv('S3_BUCKET_ADF_ATTACHMENTS_FOLDER')

S3_BUCKET_ADS_EXPORTS = os.getenv('S3_BUCKET_ADS_EXPORTS')
S3_BUCKET_ADS_EXPORTS_FOLDER = os.getenv('S3_BUCKET_ADS_EXPORTS_FOLDER')

FRESHDESK_ADD_TICKET_API = os.getenv('FRESHDESK_ADD_TICKET_API', 'https://funnelai.freshdesk.com/api/v2/tickets')
FRESHDESK_USERNAME = os.getenv('FRESHDESK_USERNAME', 'support@funnelai.com')
FRESHDESK_PASSWORD = os.getenv('FRESHDESK_PASSWORD')

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')

if TWILIO_ACCOUNT_SID is None or TWILIO_AUTH_TOKEN is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/webapp/twilio/account_sid",
        f"/{environment}/webapp/twilio/auth_token"
    ], WithDecryption=True)

    twilio_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    if TWILIO_ACCOUNT_SID is None:
        TWILIO_ACCOUNT_SID = twilio_config['account_sid']

    if TWILIO_AUTH_TOKEN is None:
        TWILIO_AUTH_TOKEN = twilio_config['auth_token']

CALLBACK_URL = os.getenv('CALLBACK_URL')

ENCRYPT_DECRYPT_KEY = os.getenv('ENCRYPT_DECRYPT_KEY', None)

if ENCRYPT_DECRYPT_KEY is None:
    param_response = ssm.get_parameters(Names=[
                f"/{environment}/webapp/encrypt_decrypt_key"
            ], WithDecryption=True)
    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}
    if app_config and 'encrypt_decrypt_key' in app_config:
        ENCRYPT_DECRYPT_KEY = app_config["encrypt_decrypt_key"]

if CALLBACK_URL is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/webapp/callback_url"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    if CALLBACK_URL is None:
        CALLBACK_URL = app_config['callback_url']

S3_LEAD_BUCKET_UPLOAD = os.getenv('S3_LEAD_BUCKET_UPLOAD')
S3_LEAD_FOLDER = os.getenv('S3_LEAD_FOLDER')

if S3_LEAD_BUCKET_UPLOAD is None or S3_LEAD_FOLDER is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/webapp/s3_lead_bucket_upload",
        f"/{environment}/webapp/s3_lead_folder"
    ], WithDecryption=True)

    lead_upload = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    if S3_LEAD_BUCKET_UPLOAD is None:
        S3_LEAD_BUCKET_UPLOAD = lead_upload['s3_lead_bucket_upload']

    if S3_LEAD_FOLDER is None:
        S3_LEAD_FOLDER = lead_upload['s3_lead_folder']

APPOINTMENT_EMAIL_TESTING = os.getenv('APPOINTMENT_EMAIL_TESTING')

if APPOINTMENT_EMAIL_TESTING is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/webapp/appointment_email_testing"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    APPOINTMENT_EMAIL_TESTING = bool(int(app_config['appointment_email_testing']))

MSG_POLLER_ACTIVITY_ARN = os.getenv('MSG_POLLER_ACTIVITY_ARN')

if MSG_POLLER_ACTIVITY_ARN is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/messaging_service/poller_activity_arn"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    MSG_POLLER_ACTIVITY_ARN = app_config['poller_activity_arn']

MSG_SCHEDULER_STATE_MACHINE_ARN = os.getenv('MSG_STATE_MACHINE_ARN')

if MSG_SCHEDULER_STATE_MACHINE_ARN is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/messaging_service/state_machine_arn"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    MSG_SCHEDULER_STATE_MACHINE_ARN = app_config['state_machine_arn']

REMINDER_POLLER_ACTIVITY_ARN = os.getenv('REMINDER_POLLER_ACTIVITY_ARN')

if REMINDER_POLLER_ACTIVITY_ARN is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/reminder_service/poller_activity_arn"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    REMINDER_POLLER_ACTIVITY_ARN = app_config['poller_activity_arn']

REMINDER_SCHEDULER_STATE_MACHINE_ARN = os.getenv('REMINDER_STATE_MACHINE_ARN')

if REMINDER_SCHEDULER_STATE_MACHINE_ARN is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/reminder_service/state_machine_arn"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    REMINDER_SCHEDULER_STATE_MACHINE_ARN = app_config['state_machine_arn']

NUDGE_ACTIVITY_ARN = os.getenv('NUDGE_ACTIVITY_ARN')

if NUDGE_ACTIVITY_ARN is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/nudge_service/poller_activity_arn"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    NUDGE_ACTIVITY_ARN = app_config['poller_activity_arn']

NUDGE_STATE_MACHINE_ARN = os.getenv('NUDGE_STATE_MACHINE_ARN')

if NUDGE_STATE_MACHINE_ARN is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/nudge_service/state_machine_arn"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    NUDGE_STATE_MACHINE_ARN = app_config['state_machine_arn']

FCM_SERVER_KEY = os.getenv('FCM_SERVER_KEY')

if FCM_SERVER_KEY is None:
    param_response = ssm.get_parameters(Names=[
        f"/{environment}/fcm/server_key"
    ], WithDecryption=True)

    app_config = {p["Name"].split("/")[-1]: p["Value"] for p in param_response["Parameters"]}

    FCM_SERVER_KEY = app_config['server_key']
