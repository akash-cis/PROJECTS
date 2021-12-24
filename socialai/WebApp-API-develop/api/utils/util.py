import boto3, traceback, contextlib
from typing import Any

from botocore.config import Config as BotoCoreConfig
from sqlalchemy import case 

try: 
    from urllib.parse import urlencode 
except ImportError: 
    from urllib import urlencode

try: 
    from urllib.request import urlopen 
except ImportError: 
    from urllib2 import urlopen 

from api import db
from api.models import Leads, User, TwilioPhoneService, LeadStatusType, \
	LeadStatusHistory, Campaign, CampaignSelections, ScheduledMessages

boto_config = BotoCoreConfig(read_timeout=70)
client = boto3.client('stepfunctions', config=boto_config)

PHONE_USE_TYPES = {
	'CAMPAIGN': 1,
	'ACTIVITY_CENTER': 2,
	'APPOINTMENT': 3,
	'GENERAL': 4
}

lead_status_types = db.session.query(LeadStatusType).all()

STATUS_TYPES = {
	f'{lead_status_type.type.value}-{lead_status_type.status}': lead_status_type.id
	for lead_status_type in lead_status_types
}


def get_from_number(session, company_id: int, phone_use_type: str, input_client: Any = None,
					activity_token: str = None):
	"""Get the phone number to send messages from.

	Retrieves the phone number(s) the system uses to send the messages to the user. These are typically phone numbers
	provided by a service like Twilio. This function returns phone number for the use case requested in the
	`phone_use_type` parameter. If a phone number does not exist for the specific `phone_use_type` parameter, it will
	return the phone number designated for general use cases.

	Args:
		session: SQLAlchemy DB session.
		company_id: The integer ID of the Company.
		phone_use_type: A string representing the specific use case for which the phone number is needed.
		input_client: AWS StepFunctions service client.
		activity_token: A string representing the token of the Task from the AWS StepFunction Activity.

	Returns:
		A Tuple with the following values:
		- The phone number to send messages from
		- The ID of the system user (phone bot) this phone number belongs to.
	"""
	if phone_use_type == 'GENERAL':
		updated_phone_use_types = PHONE_USE_TYPES.copy()
		updated_phone_use_types['GENERAL'] = 0
	else:
		updated_phone_use_types = {
			use_type: index for use_type, index in PHONE_USE_TYPES.items() if use_type in [phone_use_type, 'GENERAL']
		}

	phone_services = session.query(User.phone, User.id, TwilioPhoneService.type). \
		join(TwilioPhoneService, User.id == TwilioPhoneService.user_id). \
		filter(
			TwilioPhoneService.company_id == company_id,
			TwilioPhoneService.is_active == True,
			TwilioPhoneService.is_deleted == False,
			TwilioPhoneService.type.in_(updated_phone_use_types.keys())
		). \
		order_by(
			case(value=TwilioPhoneService.type, whens=updated_phone_use_types).label("type"),
			TwilioPhoneService.id.desc()
		). \
		first()

	if not phone_services:
		error_string = f"Unable to find System User for the company with id {company_id}"
		if input_client:
			input_client.send_task_failure(taskToken=activity_token, error="NoSystemUser", cause=error_string)
		print(error_string)
		return None

	if not phone_services[0]:
		error_string = f"There's no phone number available for system user for company with id {company_id}"
		if input_client:
			input_client.send_task_failure(taskToken=activity_token, error="NoPhoneNumber", cause=error_string)
		print(error_string)
		return None

	# Get the phone numbers for the specific use case
	phone_number = phone_services[0]
	sys_user = phone_services[1]
	return phone_number, sys_user


def update_lead_status(lead, lead_activity=None, user_id=None, new_status_type_id=None, new_status_type=None,
					   description=None):
	old_status_id = lead.lead_status_type_id
	new_status_id = None

	if new_status_type_id and new_status_type_id in STATUS_TYPES.values():
		new_status_id = new_status_type_id

	if new_status_type and new_status_type in STATUS_TYPES:
		new_status_id = STATUS_TYPES[new_status_type]

	elif lead_activity == 'CREATE_LEAD' and old_status_id is None:
		new_status_id = STATUS_TYPES[f'ACTIVE-NEW_LEAD']

	elif lead_activity == 'CREATE_SMAI_LEAD' and old_status_id is None:
		new_status_id = STATUS_TYPES[f'ACTIVE-NEW_SMAI_LEAD']

	elif lead_activity == 'SENT_MESSAGE':
		new_status_id = STATUS_TYPES[f'ACTIVE-WAITING_FOR_LEAD_RESPONSE']

	elif lead_activity == 'RECEIVED_MESSAGE':
		new_status_id = STATUS_TYPES[f'ACTIVE-UNREAD_MESSAGE_FROM_LEAD']

	elif lead_activity == 'READ_MESSAGE':
		new_status_id = STATUS_TYPES[f'ACTIVE-WAITING_FOR_DEALER_RESPONSE']

	elif lead_activity == 'CREATE_APPOINTMENT':
		new_status_id = STATUS_TYPES[f'ACTIVE-APPOINTMENT_SCHEDULED']

	elif lead_activity == 'CONFIRMED_APPOINTMENT' \
			and old_status_id in [STATUS_TYPES[f'ACTIVE-APPOINTMENT_SCHEDULED']]:
		new_status_id = STATUS_TYPES[f'ACTIVE-APPOINTMENT_CONFIRMED']

	elif lead_activity == 'MISSED_APPOINTMENT' \
			and old_status_id in [STATUS_TYPES[f'ACTIVE-APPOINTMENT_SCHEDULED']]:
		new_status_id = STATUS_TYPES[f'ACTIVE-APPOINTMENT_MISSED']

	elif lead_activity == 'SHOWED_APPOINTMENT' \
			and old_status_id in [STATUS_TYPES[f'ACTIVE-APPOINTMENT_SCHEDULED']]:
		new_status_id = STATUS_TYPES[f'ACTIVE-APPOINTMENT_SHOWED']

	elif lead_activity == 'CANCELED_APPOINTMENT' \
			and old_status_id in [STATUS_TYPES[f'ACTIVE-APPOINTMENT_SCHEDULED']]:
		new_status_id = STATUS_TYPES[f'ACTIVE-APPOINTMENT_CANCELED']

	if new_status_id:
		lead = Leads.query.filter(Leads.id == lead.id).first()
		lead.lead_status_type_id = new_status_id
		db.session.add(lead)
		db.session.commit()

		prev_lead_status_types = LeadStatusHistory.query.filter(
			LeadStatusHistory.lead_id == lead.id,
			LeadStatusHistory.is_active == True).all()

		for prev_lead_status_type in prev_lead_status_types:
			prev_lead_status_type.is_active = False
			db.session.add(prev_lead_status_type)
			db.session.commit()

		lead_status_type = LeadStatusHistory(lead_id=lead.id, lead_status_type_id=new_status_id,
											 created_by=user_id, description=description)
		db.session.add(lead_status_type)
		db.session.commit()

		lead_schedules = ScheduledMessages.query.join(Leads, Leads.id == ScheduledMessages.lead_id) \
			.join(Campaign, Campaign.id == ScheduledMessages.campaign_id) \
			.join(CampaignSelections, CampaignSelections.campaign_id == Campaign.id) \
			.filter(Campaign.active_ind.in_(['Active', 'InPogress']),
					Campaign.is_disabled == False,
					CampaignSelections.type == 'STATUS',
					CampaignSelections.value != new_status_id,
					Leads.id == lead.id)

		for schedule in lead_schedules:
			try:
				client.stop_execution(executionArn=schedule.execution_arn,
									  cause="User Status Changed")
			except client.exceptions.ExecutionDoesNotExist as e:
				traceback.print_exc()

			db.session.delete(schedule)
			db.session.commit()

def get_formatted_address(company):
	address = company.location_link
	if not address:
		address = f'{company.address}, {company.city}, {company.state} {company.postal_code}'.strip(' ,').replace(',,', ',')
	return address

#Defining the function to shorten a URL 
def make_shorten(url): 
	try:
		request_url = ('http://tinyurl.com/api-create.php?' + urlencode({'url':url})) 
		with contextlib.closing(urlopen(request_url)) as response: 
			return response.read().decode('utf-8')
	except Exception:
		return '' 