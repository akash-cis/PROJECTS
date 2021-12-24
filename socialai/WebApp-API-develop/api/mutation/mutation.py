from email import message
from logging import disable
import traceback
import graphene, json, uuid, pytz, boto3
from sqlalchemy.sql.sqltypes import Integer
import api.mutation.person_mutation as person

from elasticsearch_dsl.query import Bool
from graphene import ObjectType, Field, String, Int, List, Enum, Boolean, InputObjectType, JSONString, Float, DateTime, Time, Date

from graphql import GraphQLError
from funnel_models import models as funnel_models
from config import AINGINE_GRAPHQL_API_URL

from sqlalchemy.sql.expression import true
from sqlalchemy import or_, and_, case
from sqlalchemy.exc import SQLAlchemyError

from datetime import datetime
from botocore.config import Config as BotoCoreConfig
from http import HTTPStatus

from api import db, schema, models
from api.schema import *
from api.models import AingineDataStatus, AingineDataReceived, FilterGroupType, DealStrength, DealStatus, EntryType, \
						CrmIntegrationType, CrmLead, ScheduledMessages, AppointmentHistory, CampaignTypes, CampaignManageType, \
						CampaignIndicatorType, CampaignType, Review
from api.repository import UserRepository, DealRepository, CompanyRepository
from api.elasticsearch import get_post
from api.crm_service import push_to_crm
from api.email import send_support_ticket, send_appointment_email
from api.exports_service import get_file_from_s3, adhoc_export
from api.labelling_api import execute_prediction_update
from api.utils import SQLAlchemyMutationAingine, SQLAlchemyInputObjectType, create_forwarder, instantiate_graph
from api.sms import generate_ical, look_up_phone_type, send_sms, send_mms
from api.utils import util
from api.utils.trigger_nudge_event import TriggerNudgeEvent
# from api.utils.socketio_trigger import SocketIOTrigger

boto_config = BotoCoreConfig(read_timeout=70)
client = boto3.client('stepfunctions', config=boto_config)
# socketio_obj = SocketIOTrigger()
trigger_nudge_event = TriggerNudgeEvent()

class CreateUser(graphene.Mutation):
	class Arguments:
		email = String(required=True)
		first_name = String(required=True)
		last_name = String(required=True)
		phone = String()
		company_id = Int()
		role_id = Int()

	user = Field(lambda: User)

	def mutate(self, info, email, first_name, last_name, phone, company_id=None, role_id=None):
		if info.context.user.is_admin() or info.context.user.has_permission('can_create_users'):
			cognito_username = UserRepository.create_user(
				email, first_name, last_name)
			if cognito_username:
				user = UserModel(email=email, cognito_id=cognito_username, phone=phone,
								 first_name=first_name, last_name=last_name, company_id=company_id)
				db.session.add(user)
				db.session.commit()
				db.session.refresh(user)
				# if role_id:
				#     role = db.session.query(RoleModel).filter(
				#         RoleModel.id == role_id, RoleModel.company_id == user.company_id).first()
				#     if role:
				#         db.session.add(UserRolesModel(
				#             user_id=user.id, role_id=role.id))
				#         db.session.commit()
				if role_id:
					userAccountObj = UserAccountsModel(company_id=company_id,  user_id=user.id, status="PENDING" )
					if userAccountObj:
						db.session.add(userAccountObj)
						db.session.commit()
						db.session.refresh(userAccountObj)

						role = UserRolesModel(company_id=company_id,  user_id=user.id, role_id=role_id )
						db.session.add(role)
						db.session.commit()
			else:
				raise GraphQLError(
					'Error occurred while creating user. Please try again.')
		else:
			raise GraphQLError('Unauthorized')
		return CreateUser(user=user)


# class CreateEvent(graphene.Mutation):
#     class Arguments:
#         verb = String()
#         direct_object = String()
#         indirect_object = String()
#         prepositional_object = String()
#         context = String()

#     event = Field(lambda: schema.Event)

#     def mutate(self, info, subject, verb, direct_object, indirect_object,
#                prepositional_object, context):
#         #get_or_create objects, treat as slug
#         event = models.Event(subject_id=subject_id,
#                              verb=verb,
#                              direct_object=direct_object_id,
#                              indirect_object_id=indirect_object_id,
#                              prepositional_object_id=prepositional_object_id,
#                              context=context)


class CreateUsageEvent(graphene.Mutation):
	class Arguments:
		verb = String()  # viewed or unviewed
		context = String()
		duration = Float()
		event_id = Int()

	event = Field(lambda: schema.Event)

	def mutate(self, info, verb, duration, event_id=None, context=None):
		# verb, direct_object, indirect_object, prepositional_object, context
		# get_or_create objects, treat as slug
		current_user = info.context.user
		# email = 'luis@funnelai.co'
		# print(context)
		# TODO: handle anonymous users
		# current_user = User.get_query(info).first()
		subject, subject_created = models.Object.get_or_create(
			db, **{
				"key": f'{current_user.id}',
				"type": 'user',
				"display": f'User<{current_user.id},{current_user.email}>'
			})
		db.session.commit()

		# Right now we only track if FunnelAI is being viewed
		# For this to make sense in more specific cases like "screens"
		# We need to have a unique identifier, but this is omitted for now
		# url/slug can be unique but changing. The only caveat would be
		# "losing" stats if we change url, but i guess it kinda makes sense
		# to have new stats.
		direct_object, direct_object_created = models.Object.get_or_create(
			db,
			**{
				"key": '1',  # think of this as a slug/unique_id
				"type": 'FunnelAI',
				"display": f'FunnelAI<1>'
			})
		db.session.commit()
		# models.Object.get_or_create(db, **indirect_object)
		# models.Object.get_or_create(db, **prepositional_object)
		event = db.session.query(models.Event).filter(
			models.Event.id == event_id).first()
		# update event if already exists, otherwise add it
		if event:
			event.duration = event.duration + duration
		else:
			event = models.Event(subject_id=subject.id,
								 verb=verb,
								 direct_object_id=direct_object.id,
								 context=context,
								 duration=duration)
			db.session.add(event)
		db.session.commit()
		db.session.refresh(event)
		#  indirect_object_id=indirect_object_id,
		#  prepositional_object_id=prepositional_object_id,
		#  context=context)
		return CreateUsageEvent(event=event)


# track({user, 'viewed', ''})


class CreateCompany(graphene.Mutation):
	class Arguments:
		name = String(required=True)
		address = String()
		city = String()
		state = String()
		postal_code = String()
		phone = String()
		country = String()
		timezone = String()
		location_link = String()
		is_optin_consent_method = Boolean()
		facebook_link = String()
		google_link = String()

	company = Field(lambda: Company)

	def mutate(self, info, name, address=None, city=None, state=None, postal_code=None, phone=None, country=None, timezone=None, location_link=None,facebook_link=None,google_link=None,is_optin_consent_method=False):
		if info.context.user.is_admin():
			company = CompanyModel(name=name, address=address, city=city, state=state, postal_code=postal_code, 
									phone=phone, country=country,timezone=timezone, location_link=location_link, 
									facebook_link=facebook_link,google_link=google_link,
									is_optin_consent_method=is_optin_consent_method)
			db.session.add(company)
			db.session.commit()
			db.session.refresh(company)

			default_campaign_type = db.session.query(CampaignTypes).filter(CampaignTypes.type == CampaignManageType.DEFAULT).first()
			campaign = CampaignModel(name='Default', method='Text', company_id=company.id, is_disabled=False,
								active_ind=CampaignIndicatorType.Active, campaign_type_id = default_campaign_type.id)
			db.session.add(campaign)
			db.session.commit()
			db.session.refresh(campaign)
			
			campaign_selection = CampaignSelectionsModel(
					campaign_id=campaign.id, type=CampaignType.DEFAULT, value=0)
			db.session.add(campaign_selection)
			db.session.commit()
		else:
			raise GraphQLError('Unauthorized')
		return CreateCompany(company=company)


class UpdateCompany(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		name = String(required=True)
		address = String(required=True)
		city = String(required=True)
		state = String(required=True)
		postal_code = String(required=True)
		phone = String(required=True)
		country = String(required=True)
		website = String()
		industry = String()
		address_detail = String()
		is_disabled = Boolean()
		automatic_engagement=Boolean()
		timezone = String()
		location_link = String()
		facebook_link = String()
		google_link = String()
		is_optin_consent_method = Boolean()

	ok = Boolean()
	company = Field(lambda: Company)

	def mutate(self, info, id, name, address, city, state, postal_code, phone, country, website=None, industry=None, address_detail=None, is_disabled=None,automatic_engagement=None, timezone=None, location_link=None,facebook_link=None,google_link=None, is_optin_consent_method=None):
		ok = False
		if info.context.user.is_admin() or info.context.user.has_permission('can_create_users'):
			company = db.session.query(CompanyModel).filter(
				CompanyModel.id == id).first()
			if company:
				company.name = name
				company.address = address
				company.city = city
				company.state = state
				company.postal_code = postal_code
				company.phone = phone
				company.country = country
				company.website = website
				company.industry = industry
				company.address_detail = address_detail
				if is_disabled is not None:
					company.is_disabled = is_disabled
				if automatic_engagement is not None:
					company.automatic_engagement = automatic_engagement
				company.timezone = timezone
				company.location_link = location_link
				company.facebook_link = facebook_link
				company.google_link = google_link
				if is_optin_consent_method is not None:
					company.is_optin_consent_method = is_optin_consent_method
				db.session.commit()
				ok = True
			else:
				raise GraphQLError(
					'Error: unable to locate company data to update')
		else:
			raise GraphQLError('Unauthorized')
		return UpdateCompany(ok=ok, company=company)


class FilterInputs(InputObjectType):
	type = String(required=True)
	type_name = String(required=True)
	value = String(required=True)

class ScheduleInputs(InputObjectType):
	schedules_option_id = Int(required=True)

class SelectionInputs(InputObjectType):
	value = Int(required=True)

class SourceInputs(InputObjectType):
	source_id = Int()

class VehicleInputs(InputObjectType):
	vehicle_id = Int()
	year = String()
	model = String()
	make = String()
	interest = String()

class UpdateUserFilters(graphene.Mutation):
	class Arguments:
		filters = List(FilterInputs, required=True)
		user_id = Int()
		set_type = String()

	user_filters = List(UserFilter)

	def mutate(self, info, filters, set_type='PROSPECTS', user_id=None):
		user = db.session.query(UserModel).get(
			user_id) if info.context.user.is_admin() and user_id else info.context.user
		if user:
			UserFilterModel.reset_user_filters(user.id, set_type)
			user_filters = []
			for filter in filters:
				filter_type = FilterTypeModel.find_by_type_and_name(
					filter.type, filter.type_name)
				user_filter = UserFilterModel(
					user_id=user.id, filter_type_id=filter_type.id, set_type=set_type)
				if filter.type != 'Text' and filter.type != 'Template':
					company_filter = CompanyFilterModel.find_by_company_and_value_and_type(
						user.company_id, filter.value, filter_type.id)
					if company_filter:
						user_filter.company_filter_id = company_filter.id
					else:
						raise GraphQLError('Unauthorized filter submitted')
				else:
					user_filter.value = filter.value
				db.session.add(user_filter)
				db.session.commit()
				db.session.refresh(user_filter)
				user_filters.append(user_filter)
		else:
			raise GraphQLError(
				'Error: Not able to locate user or/and filter type data to update filters')
		return UpdateUserFilters(user_filters=user_filters)


class ProspectAction(graphene.Mutation):
	class Arguments:
		aingine_data_id = Int(required=True)
		action = String(
			required=True, description='Must match an AingineDataStatus Enum value ("Accepted", "Rejected", "Saved", or "Viewed")')
		post_type = String()

	ok = Boolean()

	def mutate(self, info, aingine_data_id, action, post_type=None):
		user = info.context.user
		status = AingineDataStatus(action)
		aingine_data_received = db.session.query(AingineDataReceived).filter(
			AingineDataReceived.aingine_data_id == aingine_data_id, AingineDataReceived.company_id == user.company_id).first()
		ok = False
		if status and aingine_data_received:
			aingine_data_received.status = status
			aingine_data_received.user_id = user.id
			aingine_data_received.action_date = datetime.utcnow()
			db.session.commit()
			if aingine_data_received.status == AingineDataStatus.ACCEPTED:
				post = get_post(aingine_data_received.aingine_data_id)
				DealRepository.create_deal(
					user, aingine_data_received, post, post_type)
			ok = True
		else:
			raise GraphQLError(
				'Error: unable to update prospect post data status')
		return ProspectAction(ok=ok)


class SaveUserFilterSet(graphene.Mutation):
	class Arguments:
		name = String(required=True)
		set_type = String(required=True)
		user_id = Int()

	filter_set = Field(lambda: FilterSet)

	def mutate(self, info, name, set_type, user_id=None):
		user = db.session.query(UserModel).get(
			user_id) if info.context.user.is_admin() and user_id else info.context.user
		if user:
			filter_set = FilterSetModel(
				user_id=user.id, name=name, set_type=set_type)
			db.session().add(filter_set)
			db.session.commit()
			db.session.refresh(filter_set)
			for user_filter in user.filters:
				if user_filter.set_type == set_type:
					saved_filter = SavedFilterModel(
						user_id=user.id,
						filter_type_id=user_filter.filter_type_id,
						value=user_filter.value,
						company_filter_id=user_filter.company_filter_id,
						filter_set_id=filter_set.id
					)
					db.session().add(saved_filter)
			db.session.commit()
		else:
			raise GraphQLError(
				'Error: Unable to identify User to save filter sets')
		return SaveUserFilterSet(filter_set=filter_set)


class UpdateUserFilterSet(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		name = String(required=True)
		set_type = String(required=True)
		delete = Boolean()

	ok = Boolean()

	def mutate(self, info, id, name, set_type=None, delete=False):
		user = info.context.user
		ok = False
		if delete:
			db.session.query(SavedFilterModel).filter(
				SavedFilterModel.user_id == user.id, SavedFilterModel.filter_set_id == id).delete()
			db.session.query(FilterSetModel).filter(
				FilterSetModel.user_id == user.id, FilterSetModel.id == id).delete()
			db.session.commit()
			ok = True
		else:
			filter_set = db.session.query(FilterSetModel).filter(
				FilterSetModel.user_id == user.id, FilterSetModel.id == id).first()
			db.session.query(SavedFilterModel).filter(SavedFilterModel.user_id ==
													  user.id, SavedFilterModel.filter_set_id == filter_set.id).delete()
			filter_set.name = name
			if (set_type):
				filter_set.set_type = set_type
			db.session.commit()

			for user_filter in filter(lambda x: x.set_type == set_type,user.filters):
				saved_filter = SavedFilterModel(
					user_id=user.id,
					filter_type_id=user_filter.filter_type_id,
					value=user_filter.value,
					company_filter_id=user_filter.company_filter_id,
					filter_set_id=filter_set.id
				)
				db.session().add(saved_filter)

			db.session.commit()
			ok = True

		return UpdateUserFilterSet(ok=ok)


class SelectFilterSet(graphene.Mutation):
	class Arguments:
		filter_set_id = Int(required=True)
		set_type = String(required=True)

	user_filters = List(UserFilter)

	def mutate(self, info, filter_set_id, set_type):
		user = info.context.user
		filter_set = FilterSet.get_query(info).filter(
			FilterSetModel.user_id == user.id, FilterSetModel.id == filter_set_id).first()
		if filter_set:
			UserFilterModel.reset_user_filters(user.id, set_type)
			for saved_filter in filter_set.filters:
				user_filter = UserFilterModel(
					user_id=user.id,
					filter_type_id=saved_filter.filter_type_id,
					value=saved_filter.value,
					company_filter_id=saved_filter.company_filter_id,
					set_type=set_type
				)
				db.session.add(user_filter)
			db.session.commit()
		else:
			raise GraphQLError('Error: unable to locate saved user filter set')
		return SelectFilterSet(user_filters=user.filters)


class SaveFilterType(graphene.Mutation):
	class Arguments:
		id = Int()
		name = String(required=True)
		type = String(required=True)
		filter_field = String(required=True)

	ok = Boolean()
	filter_type = Field(lambda: FilterType)

	def mutate(self, info, name, type, filter_field, id=None):
		ok = False
		filter_type = FilterType()
		if UserModel.is_admin(info.context.user):
			if id:
				filter_type = db.session.query(FilterTypeModel).filter(
					FilterTypeModel.id == id).first()
				filter_type.name = name
				filter_type.type = FilterGroupType(type)
				filter_type.filter_field = filter_field
				db.session.commit()
				ok = True
			else:
				filter_type = FilterTypeModel(
					name=name, type=FilterGroupType(type), filter_field=filter_field)
				db.session.add(filter_type)
				db.session.commit()
				db.session.refresh(filter_type)
				ok = True if filter_type.id else False
		else:
			raise GraphQLError('Unauthorized: must be site admin')
		return SaveFilterType(filter_type=filter_type, ok=ok)


class DeleteFilterType(graphene.Mutation):
	class Arguments:
		filter_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, filter_id):
		ok = False
		if info.context.user.is_admin():
			db.session.query(FilterTypeModel).filter(
				FilterTypeModel.id == filter_id).delete()
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unauthorized')
		return DeleteFilterType(ok=ok)


class SaveSelectionOption(graphene.Mutation):
	class Arguments:
		filter_type_id = Int(required=True)
		value = String(required=True)
		query = String()

	ok = Boolean()
	selection_option = Field(lambda: SelectionOption)

	def mutate(self, info, filter_type_id, value, query=None):
		ok = False
		selection_option = SelectionOptionModel()
		if UserModel.is_admin(info.context.user):
			selection_option.filter_type_id = filter_type_id
			selection_option.value = value
			if query:
				selection_option.query = query
			db.session.add(selection_option)
			db.session.commit()
			db.session.refresh(selection_option)
			ok = True if selection_option.id else False
		else:
			raise GraphQLError('Unauthorized: must be site admin')
		return SaveSelectionOption(ok=ok, selection_option=selection_option)


class RemoveSelectionOption(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, id):
		ok = False
		if UserModel.is_admin(info.context.user):
			db.session.query(SelectionOptionModel).filter(
				SelectionOptionModel.id == id).delete()
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unauthorized: must be site admin')
		return RemoveSelectionOption(ok=ok)


class CompanyFilterValueInput(InputObjectType):
	company_filter_id = Int()
	option_id = Int(required=True)
	value = String(required=True)

class SelectionOptionInput(InputObjectType):
	id = Int()

class CompanyFilterInput(InputObjectType):
	id = Int()
	filter_field = String(required=True)
	type = String(required=True)
	type_name = String(required=True)
	user_can_change = Boolean(required=True)
	value = String()
	selection_option = SelectionOptionInput()

class SaveCompanyFilters(graphene.Mutation):
	class Arguments:
		filters = List(CompanyFilterInput, required=True)
		company_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, filters, company_id):
		ok = False
		if UserModel.is_admin(info.context.user):
			CompanyFilterModel.reset_company_filters(company_id)
			for co_filter in filters:
				filter_type = db.session.query(FilterTypeModel).filter(
					FilterTypeModel.name == co_filter.type_name,
					FilterTypeModel.type == FilterGroupType(co_filter.type),
					FilterTypeModel.filter_field == co_filter.filter_field
				).first()
				if filter_type:
					for option in co_filter.values:
						selection_option = db.session.query(SelectionOptionModel).filter(
							SelectionOptionModel.filter_type_id == filter_type.id,
							SelectionOptionModel.value == option.value,
							SelectionOptionModel.id == option.option_id
						).first()
						if selection_option:
							company_filter = CompanyFilterModel(
								company_id=company_id,
								user_can_change=co_filter.user_can_change,
								selection_option_id=selection_option.id
							)
							db.session.add(company_filter)
						else:
							raise GraphQLError(
								f'Error: Unable to locate selection filter for "{option.value}"')
				else:
					raise GraphQLError(
						f'Error: Unable to locate filter type for "{co_filter.type_name}"')
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unauthorized: must be a site admin')
		return SaveCompanyFilters(ok=ok)


class UpdateDeal(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		first_name = String()
		last_name = String()
		email = String()
		phone = String()
		location = String()
		followup_date = DateTime()
		user_id = Int()
		strength = String(
			description='Must match a DealStrength enum value ("Hot", "Warm", or "Cold"')
		status = String(
			description='Must match a DealStatus enum value ("Active", "Deal Won", "Deal Lost", "Pushed to CRM", "Expired", "Archive"')
		allow_notifications = Boolean()

	ok = Boolean()
	deal = Field(lambda: Deal)

	def mutate(self, info, id, first_name=None, last_name=None, email=None, phone=None, location=None, followup_date=None, strength=None, status=None, user_id=None, allow_notifications=None):
		ok = False
		user = info.context.user
		deal = db.session.query(DealModel).filter(
			DealModel.user_id == user.id, DealModel.id == id).first()
		if deal:
			deal.first_name = first_name if first_name else deal.first_name
			deal.last_name = last_name if last_name else deal.last_name
			deal.email = email if email else deal.email
			deal.phone = phone if phone else deal.phone
			deal.location = location if location else deal.location
			deal.followup_date = followup_date if followup_date else deal.followup_date
			deal.strength = DealStrength(
				strength) if strength else deal.strength
			deal.status = DealStatus(status) if status else deal.status
			deal.user_id = user_id if user_id else deal.user_id
			deal.allow_notifications = allow_notifications if allow_notifications is not None else deal.allow_notifications

			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unable to locate deal data for user')

		return UpdateDeal(ok=ok, deal=deal)


class AddConversationEntryComment(graphene.Mutation):
	class Arguments:
		deal_id = Int(required=True)
		message = String(required=True)

	ok = Boolean()
	deal = Field(lambda: Deal)

	def mutate(self, info, deal_id, message):
		ok = False
		user = info.context.user
		deal = Deal.get_query(info).filter(
			DealModel.id == deal_id, DealModel.user_id == user.id).first()
		if deal:
			entry = ConversationEntryModel(
				deal_id=deal.id, type=EntryType.NOTE, message=message, post_time=datetime.utcnow())
			db.session.add(entry)
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unable to locate deal data to update')
		return AddConversationEntryComment(ok=ok, deal=deal)


class SaveResponseTemplate(graphene.Mutation):
	class Arguments:
		message = String(required=True)
		is_initial_response = Boolean(required=True)
		id = Int()
		user_id = Int()

	ok = Boolean()
	response_template = Field(lambda: ResponseTemplate)

	def mutate(self, info, message, is_initial_response, user_id=None, id=None):
		ok = False
		user = db.session.query(UserModel).get(
			user_id) if info.context.user.is_admin() and user_id else info.context.user
		if user:
			if id:
				response_template = db.session.query(ResponseTemplateModel).filter(
					ResponseTemplateModel.id == id, ResponseTemplateModel.user_id == user.id).first()
				response_template.message = message
				response_template.is_initial_response = is_initial_response
				db.session.commit()
				ok = True
			else:
				response_template = ResponseTemplateModel(
					user_id=user.id, message=message, is_initial_response=is_initial_response)
				db.session.add(response_template)
				db.session.commit()
				db.session.refresh(response_template)
				ok = True
		else:
			raise GraphQLError(
				'Unable to locate user date to add response template')
		return SaveResponseTemplate(ok=ok, response_template=response_template)


class DeleteResponseTemplate(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		user_id = Int()

	ok = Boolean()

	def mutate(self, info, id, user_id=None):
		ok = False
		user = db.session.query(UserModel).get(
			user_id) if info.context.user.is_admin() and user_id else info.context.user
		if user:
			db.session.query(ResponseTemplateModel).filter(
				ResponseTemplateModel.user_id == user.id, ResponseTemplateModel.id == id).delete()
			db.session.commit()
			ok = True
		else:
			raise GraphQLError(
				'Unable to locate user data to remove response template')
		return DeleteResponseTemplate(ok=ok)


class UpdateUserDisabledStatus(graphene.Mutation):
	class Arguments:
		user_id = Int(required=True)
		is_disabled = Boolean(required=True)

	ok = Boolean()

	def mutate(self, info, user_id, is_disabled):
		ok = False
		admin = info.context.user
		if admin.is_admin() or admin.has_permission('can_create_users'):
			user = db.session.query(UserModel).filter(
				UserModel.id == user_id).first()
			if user:
				user.is_disabled = is_disabled
				db.session.commit()
				ok = True
			else:
				raise GraphQLError(
					'Unable to locate user data to update disabled status')
		else:
			raise GraphQLError(
				'Unauthorized - must be admin to perform action')
		return UpdateUserDisabledStatus(ok=ok)

class UpdateUserDisabledCompanyStatus(graphene.Mutation):
	class Arguments:
		user_id = Int(required=True)
		company_id = Int(required=True)
		is_disabled = Boolean(required=True)

	ok = Boolean()

	def mutate(self, info, user_id, company_id, is_disabled):
		ok = False
		admin = info.context.user
		if admin.is_admin() or admin.has_permission('can_create_users'):
			user_account = db.session.query(UserAccountsModel).filter(
				UserAccountsModel.user_id == user_id, UserAccountsModel.company_id == company_id).first()
			if user_account:
				user_account.is_disabled = is_disabled
				db.session.commit()
				ok = True
			else:
				raise GraphQLError(
					'Unable to locate user data to update disabled status')
		else:
			raise GraphQLError(
				'Unauthorized - must be admin to perform action')
		return UpdateUserDisabledCompanyStatus(ok=ok)

class SaveCompanyFilters(graphene.Mutation):
	class Arguments:
		filters = List(CompanyFilterInput, required=True)
		company_id = Int(required=True)

	ok = Boolean()
	conflicts = List(CompanyFilter)

	def mutate(self, info, filters, company_id):
		ok = False
		conflicts = []
		if info.context.user.is_admin():
			co_filters = db.session.query(CompanyFilterModel).filter(CompanyFilterModel.company_id == company_id).all()
			to_update = []
			to_create = []
			to_delete = []
			
			for f in filters:
				if 'id' in f:
					to_update.append(f)
				else:
					to_create.append(f)
			
			for cf in co_filters:
				found = next((x for x in filters if x.id == cf.id), None)
				if found is None:
					existing_saved_filter = db.session.query(CompanyFilterModel).filter(SavedFilterModel.company_filter_id == cf.id).first()
					if existing_saved_filter is None:
						to_delete.append(cf)
					else:
						conflicts.append(cf)
			
			if len(conflicts) > 0:
				return SaveCompanyFilters(ok=ok, conflicts=conflicts)

			for filter in to_create:
				company_filter = CompanyFilterModel(
					company_id=company_id,
					user_can_change=filter.user_can_change,
					selection_option_id=filter.selection_option.id
				)
				db.session.add(company_filter)

			for filter in to_delete:
				db.session.delete(filter)
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unauthorized: must be a site admin')
		return SaveCompanyFilters(ok=ok)


class TeamMemberInputs(InputObjectType):
	member_id = Int(required=True)


class CreateTeam(graphene.Mutation):
	class Arguments:
		name = String(required=True)
		company_id = Int(required=True)
		leader_id = Int(required=True)
		members = List(TeamMemberInputs, required=True)

	team = Field(lambda: Team)

	def mutate(self, info, name, company_id, leader_id, members):
		if info.context.user.has_permission('can_create_teams'):
			team = TeamModel(name=name, company_id=company_id,
							 leader_id=leader_id)
			db.session.add(team)
			db.session.commit()
			db.session.refresh(team)

			for member in members:
				team_member = TeamMemberModel(
					member_id=member.member_id,
					team_id=team.id,
				)
				db.session.add(team_member)
				db.session.commit()
				ok = True
		else:
			raise GraphQLError("Unauthorized")
		return CreateTeam(team=team)


class UpdateTeam(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		name = String(required=True)
		leader_id = Int(required=True)
		members = List(TeamMemberInputs, required=True)

	team = Field(lambda: Team)

	def mutate(self, info, id, name, leader_id, members):
		if info.context.user.has_permission('can_create_teams'):
			team = db.session.query(TeamModel).filter(
				TeamModel.id == id).first()
			if team:
				team.name = name
				team.leader_id = leader_id
				db.session.commit()
				ok = True
			else:
				raise GraphQLError(
					'Unable to locate user data to update disabled status')

			for member in members:
				exist = [m for m in team.members if m.member_id ==
						 member.member_id]
				if len(exist) == 0:
					team_member = TeamMemberModel(
						member_id=member.member_id,
						team_id=team.id,
					)
					db.session.add(team_member)
					ok = True
			for member in team.members:
				exist = [m for m in members if m.member_id == member.member_id]
				if len(exist) == 0:
					db.session.query(TeamMemberModel).filter(
						TeamMemberModel.member_id == member.member_id).delete()
					ok = True
			db.session.commit()
		else:
			raise GraphQLError("Unauthorized")
		return UpdateTeam(team=team)


class DeleteTeam(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, id):
		if info.context.user.has_permission('can_create_teams'):
			ok = False
			db.session.query(TeamMemberModel).filter(
				TeamMemberModel.team_id == id).delete()
			# db.session.commit()
			db.session.query(TeamModel).filter(TeamModel.id == id).delete()
			db.session.commit()
			ok = True
		else:
			raise GraphQLError("Unauthorized")
		return DeleteTeam(ok=ok)


class UpdateUser(graphene.Mutation):
	class Arguments:
		user_id = Int(required=True)
		first_name = String(required=True)
		last_name = String(required=True)
		phone = String()
		email = String()
		old_pass = String()
		new_pass = String()
		role_id = Int()
		user_id = Int()
		company_id=Int()

	ok = Boolean()

	def mutate(self, info, user_id, first_name, last_name, phone=None, email=None, old_pass=None, new_pass=None, role_id=None, company_id=None):
		ok = False
		user = info.context.user
		headers = info.context.headers
		if old_pass and new_pass:
			UserRepository.update_user_pass(
				headers, user.email, old_pass, new_pass)
		if email:
			UserRepository.update_user_email(headers, email, user)

		if info.context.user.is_admin() or info.context.user.has_permission('can_create_users'):
			user = db.session.query(UserModel).filter(
				UserModel.id == user_id).first()
			if user:
				if phone is not None:
					user.phone = phone
				user.first_name = first_name
				user.last_name = last_name
				if role_id:
					role = db.session.query(RoleModel).filter(
						RoleModel.id == role_id, RoleModel.company_id == company_id).first()
					if role:
						db.session.query(UserRolesModel).filter(
							UserRolesModel.user_id == user_id, UserRolesModel.company_id == company_id).delete()
						db.session.add(UserRolesModel(
							user_id=user.id, role_id=role.id,company_id=company_id))
						db.session.commit()
						ok = True
				else:
					db.session.commit()
					ok = True
			else:
				raise GraphQLError('Unable to locate user data to update')
		else:
			raise GraphQLError('Unauthorized')
		return UpdateUser(ok=ok)

class UpdateUserDefaultCompany(graphene.Mutation):
	class Arguments:
		user_id = Int(required=True)
		company_id = Int(required=True)
	ok = Boolean()

	def mutate(self, info, user_id,  company_id=None):
		ok = False
		user = info.context.user

		user = db.session.query(UserModel).filter(
			UserModel.id == user_id).first()
		if user:
			if company_id:
				user.company_id = company_id
				db.session.commit()
				ok = True
		else:
			raise GraphQLError('Unable to locate user data to update')

		return UpdateUser(ok=ok)



class CreateRole(graphene.Mutation):
	class Arguments:
		company_id = Int()
		name = String(required=True)
		can_create_users = Boolean(required=True)
		can_create_teams = Boolean(required=True)
		can_view_prospects = Boolean(required=True)
		is_company_admin = Boolean(required=True)
		can_view_auto_analytics = Boolean(required=True)
		can_view_ad_export = Boolean(required=True)
		can_view_clm = Boolean(required=True)
		can_view_gle = Boolean(required=True)
		can_view_engagements = Boolean(required=True)

	ok = Boolean()

	def mutate(self, info, name, can_create_users, can_create_teams, can_view_prospects, is_company_admin, can_view_auto_analytics, can_view_ad_export, can_view_clm, can_view_gle,can_view_engagements, company_id=None):
		ok = False
		company_id = company_id if info.context.user.is_admin(
		) and company_id else info.context.user.company_id
		role = RoleModel(company_id=company_id, name=name, can_create_users=can_create_users, can_create_teams=can_create_teams, can_view_prospects=can_view_prospects,
						 can_view_auto_analytics=can_view_auto_analytics, can_view_ad_export=can_view_ad_export, can_view_clm=can_view_clm, can_view_gle=can_view_gle,can_view_engagements=can_view_engagements, is_company_admin=is_company_admin)
		if role:
			db.session.add(role)
			db.session.commit()
			ok = True
			if role.can_view_clm:
				ok = CompanyRepository.add_aingine_source_id_if_not_exist(
					company_id)
				if not ok:
					raise GraphQLError(
						'Error when trying to create aingine source id in aingine db')
		return CreateRole(ok=ok)


class AddCompanyReference(graphene.Mutation):
	class Arguments:
		company_id = Int()
		user_id = Int()
		role_id = Int()

	ok = Boolean()

	def mutate(self, info, role_id=None, user_id=None,  company_id=None):
		ok = False
		company_id = company_id if info.context.user.is_admin(
		) and company_id else info.context.user.company_id
		role = UserRolesModel(company_id=company_id,  user_id=user_id, role_id=role_id )
		if role:
			db.session.add(role)
			db.session.commit()
			ok = True
			# if role.can_view_clm:
			#     ok = CompanyRepository.add_aingine_source_id_if_not_exist(
			#         company_id)
			#     if not ok:
			#         raise GraphQLError(
			#             'Error when trying to create aingine source id in aingine db')
		return AddCompanyReference(ok=ok)

class AddUserAccounts(graphene.Mutation):
	class Arguments:
		company_id = Int()
		user_id = Int()
		status = String()
		role_id = Int()
	userAccountId = Int()
	ok = Boolean()
	def mutate(self, info, status=None, user_id=None,  company_id=None,role_id=None):
	   
		company_id = company_id if info.context.user.is_admin(
		) and company_id else info.context.user.company_id

		userAccountObj = UserAccountsModel(company_id=company_id,  user_id=user_id, status=status )
		if userAccountObj:
			db.session.add(userAccountObj)
			db.session.commit()
			db.session.refresh(userAccountObj)

			role = UserRolesModel(company_id=company_id,  user_id=user_id, role_id=role_id )
			db.session.add(role)
			db.session.commit()
			ok = True
		return AddUserAccounts(ok = ok)

class EditRole(graphene.Mutation):
	class Arguments:
		role_id = Int(required=True)
		company_id = Int()
		name = String(required=True)
		can_create_users = Boolean(required=True)
		can_create_teams = Boolean(required=True)
		can_view_prospects = Boolean(required=True)
		is_company_admin = Boolean(required=True)
		can_view_auto_analytics = Boolean(required=True)
		can_view_ad_export = Boolean(required=True)
		can_view_clm = Boolean(required=True)
		can_view_gle = Boolean(required=True)
		can_view_engagements = Boolean(required=True)

	ok = Boolean()

	def mutate(self, info, role_id, name, can_create_users, can_create_teams, can_view_prospects, is_company_admin, can_view_auto_analytics, can_view_ad_export, can_view_clm, can_view_gle, can_view_engagements,company_id=None):
		ok = False
		company_id = company_id if info.context.user.is_admin(
		) and company_id else info.context.user.company_id
		role = db.session.query(RoleModel).filter(
			RoleModel.id == role_id, RoleModel.company_id == company_id).first()
		if role:
			role.name = name
			role.can_create_users = can_create_users
			role.can_create_teams = can_create_teams
			role.can_view_prospects = can_view_prospects
			role.is_company_admin = is_company_admin
			role.can_view_auto_analytics = can_view_auto_analytics
			role.can_view_ad_export = can_view_ad_export
			role.can_view_clm = can_view_clm
			role.can_view_gle = can_view_gle
			role.can_view_engagements = can_view_engagements
			db.session.commit()
			ok = True
			if role.can_view_clm:
				ok = CompanyRepository.add_aingine_source_id_if_not_exist(
					company_id)
				if not ok:
					raise GraphQLError(
						'Error when trying to create aingine source id in aingine db')
		return EditRole(ok=ok)


class DeleteRole(graphene.Mutation):
	class Arguments:
		company_id = Int(required=True)
		role_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, company_id, role_id):
		ok = False
		if info.context.user.is_admin():
			roleUsers = db.session.query(UserRolesModel).filter(
				UserRolesModel.role_id == role_id, UserRolesModel.company_id == company_id).all()
			for roleUser in roleUsers:
				db.session.query(UserAccountsModel).filter(
				UserAccountsModel.user_id == roleUser.user_id, UserAccountsModel.company_id == roleUser.company_id).delete()
				db.session.commit()
			db.session.query(RoleModel).filter(
				RoleModel.id == role_id, RoleModel.company_id == company_id).delete()
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unauthorized')
		return DeleteRole(ok=ok)


class AddScreenName(graphene.Mutation):
	class Arguments:
		screen_name = String(required=True)
		source = String()
		source_id = Int()
		source_url = String()
		id = Int()

	ok = Boolean()
	screen_name = Field(lambda: ScreenName)

	def mutate(self, info, screen_name, source=None, source_id=None, source_url=None, id=None):
		ok = False
		user = info.context.user
		if user:
			if id:
				screen_name_obj = db.session.query(ScreenNameModel).filter(
					ScreenNameModel.id == id).first()
				screen_name_obj.screen_name = screen_name
				db.session.commit()
				ok = True
			else:
				screen_name_obj = ScreenNameModel(
					screen_name=screen_name, source=source, source_id=source_id, source_url=source_url, user_id=user.id)
				db.session.add(screen_name_obj)
				db.session.commit()
				db.session.refresh(screen_name_obj)
				ok = True
			if source_id:
				DealRepository.update_response_config_screen_name(
					source_id, user.id, screen_name_obj.screen_name)
		else:
			raise GraphQLError("Unauthorized")
		return AddScreenName(ok=ok, screen_name=screen_name_obj)


class UpdateDealSubscription(graphene.Mutation):
	class Arguments:
		deal_id = Int(required=True)
		subscribed = Boolean(required=True)

	ok = Boolean()

	def mutate(self, info, deal_id, subscribed):
		ok = False
		user = info.context.user
		if user:
			ok = DealRepository.update_config_subscription(deal_id, subscribed)
		else:
			raise GraphQLError('Unauthorized')
		return UpdateDealSubscription(ok=ok)


class SaveConversationSent(graphene.Mutation):
	class Arguments:
		aingine_id = Int(required=True)
		response = String(required=True)

	ok = Boolean()

	def mutate(self, info, aingine_id, response):
		ok = False
		user = info.context.user
		deal = Deal.get_query(info).filter(
			DealModel.aingine_data_id == aingine_id, DealModel.user_id == user.id).first()
		if deal:
			entry = ConversationEntryModel(deal_id=deal.id, type=EntryType.SENT, message=response,
										   post_time=datetime.utcnow(), is_temp=True)
			db.session.add(entry)
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unable to locate deal data to update')
		return SaveConversationSent(ok=ok)


class CreateCrmIntegration(graphene.Mutation):
	class Arguments:
		company_id = Int(required=True)
		integration_type = String(required=True)
		adf_email = String(required=True)
		crm_dealer_id = String(required=True)
		vs_lead_source_id = String(required=True)

	ok = Boolean()

	def mutate(self, info, company_id, integration_type, adf_email, crm_dealer_id, vs_lead_source_id):
		ok = False
		company_id = company_id if info.context.user.is_admin(
		) and company_id else info.context.user.company_id
		crmIntegration = CrmIntegrationModel(company_id=company_id, integration_type=CrmIntegrationType(
			integration_type), adf_email=adf_email, crm_dealer_id=crm_dealer_id, 
			vs_lead_source_id=vs_lead_source_id, active=True)
		if info.context.user.is_admin() or info.context.user.has_permission('is_company_admin'):
			db.session.add(crmIntegration)
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unauthorized')
		return CreateCrmIntegration(ok=ok)


class DeleteCrmIntegration(graphene.Mutation):
	class Arguments:
		crm_integration_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, crm_integration_id):
		ok = False
		if info.context.user.is_admin() or info.context.user.has_permission('is_company_admin'):
			crm_integration = db.session.query(CrmIntegrationModel).filter(
				CrmIntegrationModel.id == crm_integration_id, CrmIntegrationModel.active == True).first()
			if crm_integration:
				crm_integration.active = False
				db.session.commit()
				ok = True
		else:
			raise GraphQLError('Unauthorized')
		return DeleteCrmIntegration(ok=ok)


class PushDealToCrm(graphene.Mutation):
	class Arguments:
		company_id = Int(required=True)
		deal_id = Int(required=True)
		aingine_data_id = Int()
		type_of_lead = String(required=True)
		status = String()
		interest = String(required=True)
		year = String()
		make = String()
		model = String()
		contact_first_name = String(required=True)
		contact_last_name = String(required=True)
		contact_full_name = String()
		contact_email = String()
		contact_phone_number = String(required=True)
		contact_address_line_1 = String(required=True)
		contact_address_line_2 = String()
		city = String()
		state = String(required=True)
		zip = String()
		country = String(required=True)
		comments = String(required=True)
		contact_email_type = String()
		contact_phone_number_type = String()
		vehicles = List(VehicleInputs)

	status_code = Int()
	message = String()

	def mutate(self, info, company_id, deal_id, type_of_lead, interest,  contact_first_name, contact_last_name, contact_phone_number, contact_address_line_1,state,country,comments, aingine_data_id=None, contact_address_line_2=None,status=None,year=None, make=None, model=None, contact_full_name=None, contact_email=None,city=None,zip=None, contact_email_type=None, contact_phone_number_type=None, vehicles=None):
		try:
			crm_integration = \
				CrmIntegration.get_query(info) \
							.filter(
								CrmIntegrationModel.company_id == company_id,
								CrmIntegrationModel.active == True) \
							.one_or_none()
			company = Company.get_query(info).filter(
				CompanyModel.id == company_id).first()
			if crm_integration:
				ptc_response = push_to_crm(
					company=company,
					user=info.context.user,
					crm_integration=crm_integration,
					deal_id=deal_id,
					aingine_data_id=aingine_data_id,
					type_of_lead=type_of_lead,
					status=status,
					interest=interest,
					year=year,
					make=make,
					model=model,
					contact_first_name=contact_first_name,
					contact_last_name=contact_last_name,
					contact_full_name=contact_full_name,
					contact_email=contact_email,
					contact_email_type=contact_email_type,
					contact_phone_number = contact_phone_number,
					contact_phone_number_type=contact_phone_number_type,
					contact_address_line_1=contact_address_line_1,
					contact_address_line_2=contact_address_line_2,
					city=city,
					state=state,
					zip=zip,
					country=country,
					comments=comments, vehicles=vehicles)
				if ptc_response is not None:
					crm_lead = CrmLeadModel(
						created_at=datetime.utcnow(),
						lead_id=ptc_response['lead_id'],
						customer_id=ptc_response['customer_id'],
						dealer_id=ptc_response['dealer_id'],
						contact_id=ptc_response['contact_id'],
						account_id=ptc_response['account_id'],
						crm_integration_id=crm_integration.id)
					db.session.add(crm_lead)
					db.session.commit()
					ok = True
			else:
				return CreateLead(status_code=HTTPStatus.NOT_FOUND.value, message='Unable to push lead to CRM')
			return CreateLead(status_code=HTTPStatus.OK.value, message='Lead pushed to CRM')
		except Exception as e:
			traceback.print_exc()
			return CreateLead(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


class SubmitSupportTicket(graphene.Mutation):
	class Arguments:
		subject = String(required=True)
		message = String(required=True)

	ok = Boolean()

	def mutate(self, info, subject, message):
		user = info.context.user
		if user:
			send_support_ticket(user, message, subject)
		else:
			raise GraphQLError('Unauthorized')


class NotificationConfigDetailInputs(InputObjectType):
	id = Int()
	set_type = String(required=True)
	filter_set_id = Int()
	count = Int(required=True)

class SaveNotificationConfig(graphene.Mutation):
	class Arguments:
		notifications_allowed = Boolean(required=True)
		id = Int()
		dnd_start = Time()
		dnd_end = Time()
		timezone = String()
		email = Boolean()
		sms = Boolean()
		responses = Boolean()
		app = Boolean()
		interval = String()
		details = List(NotificationConfigDetailInputs)

	ok = Boolean()

	def mutate(self, info, notifications_allowed, id=None, dnd_start=None, dnd_end=None, timezone=None, email=None, sms=None, responses=None, app=None, interval=None, details=None):
		ok = False
		user = info.context.user
		if user:
			if id:
				notification_config = db.session.query(NotificationConfigModel).filter(
					NotificationConfigModel.user_id == user.id, NotificationConfigModel.id == id).first()
				if notification_config:
					notification_config.notifications_allowed = notifications_allowed
					notification_config.dnd_start = dnd_start if dnd_start else notification_config.dnd_start
					notification_config.dnd_end = dnd_end if dnd_end else notification_config.dnd_end
					notification_config.timezone = timezone if timezone else notification_config.timezone
					notification_config.app = app if app != None else notification_config.app
					notification_config.sms = sms if sms != None else notification_config.sms
					notification_config.responses = responses if responses != None else notification_config.responses
					notification_config.email = email if email != None else notification_config.email
					notification_config.interval = interval if interval else notification_config.interval

					for detail in details:
						exist = [d for d in notification_config.details if d.id ==
								detail.id]
						if len(exist) == 0:
							new_detail = NotificationConfigDetailModel(
								set_type=detail.set_type,
								filter_set_id=detail.filter_set_id if detail.filter_set_id else None,
								count=detail.count,
								notification_config_id=notification_config.id
							)
							db.session.add(new_detail)
							ok = True
						else:
							saved_detail = db.session.query(NotificationConfigDetailModel).filter(
								NotificationConfigDetailModel.id == detail.id).first()
							if saved_detail:
								saved_detail.set_type = detail.set_type
								saved_detail.filter_set_id = detail.filter_set_id if detail.filter_set_id else None
								saved_detail.count = detail.count
					for detail in notification_config.details:
						exist = [d for d in details if d.id == detail.id]
						if len(exist) == 0:
							db.session.query(NotificationConfigDetailModel).filter(
								NotificationConfigDetailModel.id == detail.id).delete()
							ok = True

					db.session.commit()
				else:
					raise GraphQLError('Can not locate config data')
			else:
				notification_config = NotificationConfigModel(
					user_id=user.id, notifications_allowed=notifications_allowed, dnd_start=dnd_start, dnd_end=dnd_end, timezone=timezone, email=email, sms=sms, responses=responses, app=app, interval=interval)
				db.session.add(notification_config)
				db.session.commit()
				db.session.refresh(notification_config)

				for detail in details:
					new_detail = NotificationConfigDetailModel(
						set_type=detail.set_type,
						filter_set_id=detail.filter_set_id if detail.filter_set_id else None,
						count=detail.count,
						notification_config_id=notification_config.id
					)
					db.session.add(new_detail)
					db.session.commit()
				
				ok = True
		else:
			raise GraphQLError('Unauthorized')
		return SaveNotificationConfig(ok=ok)


class ResendInvite(graphene.Mutation):
	class Arguments:
		user_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, user_id):
		ok = False
		if info.context.user and info.context.user.is_admin():
			user = User.get_node(info, user_id)
			cognito_user = UserRepository.reset_and_resend_temp_password(user)
			print(cognito_user)
			if cognito_user:
				ok = True
		else:
			raise GraphQLError('Unauthorized')
		return ResendInvite(ok=ok)


class UpdateNotification(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		read = Boolean()

	ok = Boolean()
	notification = Field(lambda: Notification)

	def mutate(self, info, id, read=None):
		ok = False
		user = info.context.user
		notification = db.session.query(NotificationModel).filter(
			NotificationModel.user_id == user.id, NotificationModel.id == id).first()
		if notification:
			notification.read = read if read is not None else notification.read

			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Unable to locate notification data for user')

		return UpdateNotification(ok=ok, notification=notification)


class CreateExportConfig(graphene.Mutation):
	class Arguments:
		filters = List(FilterInputs, required=True)
		name = String(required=True)
		email = String(required=True)
		minimum_count = Int()
		frequency = Int()
		email_time = Time()
		start_date = DateTime()
		end_date = DateTime()
		timezone = String()

	export_config = Field(lambda: ExportConfig)

	def mutate(self, info, filters, name, email, minimum_count=None, frequency=1, email_time="01:00:00", start_date=None, end_date=None, timezone="US/Eastern"):
		set_type = 'EXPORT'
		user = info.context.user
		adhocLimit = 3
		scheduleLimit = 3
		if user:
			if start_date and end_date:
				count = db.session.query(ExportConfigModel).filter(
					ExportConfigModel.ad_hoc == True, ExportConfigModel.deleted == False, ExportConfigModel.user_id == user.id).count()
				if count < adhocLimit:
					export_config = ExportConfigModel(
						user_id=user.id,
						company_id=user.company.id,
						name=name,
						email=email,
						minimum_count=minimum_count,
						frequency=frequency,
						email_time=email_time,
						start_date=start_date,
						end_date=end_date,
						ad_hoc=True,
						timezone=timezone
					)
				else:
					raise GraphQLError(
						f'Can\'t have more than {adhocLimit} active adhoc exports. Delete at least one from your history list.')
			else:
				count = db.session.query(ExportConfigModel).filter(
					ExportConfigModel.ad_hoc == False, ExportConfigModel.deleted == False, ExportConfigModel.user_id == user.id).count()
				if count < scheduleLimit:
					export_config = ExportConfigModel(
						user_id=user.id,
						company_id=user.company.id,
						name=name,
						email=email,
						minimum_count=minimum_count,
						frequency=frequency,
						email_time=email_time,
						ad_hoc=False,
						timezone=timezone
					)
				else:
					raise GraphQLError(
						f'Can\'t have more than {scheduleLimit} active scheduled exports. Delete at least one from your scheduled list.')
			db.session.add(export_config)
			db.session.commit()
			db.session.refresh(export_config)
			if export_config.id:
				for filter in filters:
					filter_type = FilterTypeModel.find_by_type_and_name(
						filter.type, filter.type_name)
					user_filter = UserFilterModel(
						user_id=user.id, filter_type_id=filter_type.id, set_type=set_type, export_config_id=export_config.id)
					if filter.type != 'Text':
						company_filter = CompanyFilterModel.find_by_company_and_value_and_type(
							user.company_id, filter.value, filter_type.id)
						if company_filter:
							user_filter.company_filter_id = company_filter.id
						else:
							raise GraphQLError('Unauthorized filter submitted')
					else:
						user_filter.value = filter.value
					db.session.add(user_filter)
					db.session.commit()
				if export_config.ad_hoc == True:

					try:
						created = adhoc_export(export_config)
					except Exception as e:
						print(e)
						db.session.query(UserFilterModel).filter(
							UserFilterModel.export_config_id == export_config.id).delete()
						db.session.query(ExportConfigModel).filter(
							ExportConfigModel.id == export_config.id).delete()
						db.session.commit()
						raise GraphQLError(
							'Error trying to get data from source.')

					if created == False:
						db.session.query(UserFilterModel).filter(
							UserFilterModel.export_config_id == export_config.id).delete()
						db.session.query(ExportConfigModel).filter(
							ExportConfigModel.id == export_config.id).delete()
						db.session.commit()
						raise GraphQLError(
							'No data matching the selected configuration. Export can’t be created.')
			else:
				raise GraphQLError(
					'Error: Not able to locate user or/and filter type data to update filters')
		return CreateExportConfig(export_config=export_config)


class UpdateExportConfig(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		filters = List(FilterInputs, required=True)
		name = String()
		email = String()
		minimum_count = Int()
		frequency = Int()
		email_time = Time()
		timezone = String()

	ok = Boolean()
	export_config = Field(lambda: ExportConfig)

	def mutate(self, info, id, filters, name, email, minimum_count, frequency=None, email_time=None, timezone=None):
		ok = False
		set_type = 'EXPORT'
		user = info.context.user
		if user:
			export_config = db.session.query(ExportConfigModel).filter(
				ExportConfigModel.id == id).first()
			export_config.name = name if name else export_config.name
			export_config.email = email if email else export_config.email
			export_config.minimum_count = minimum_count if minimum_count else export_config.minimum_count
			export_config.frequency = frequency if frequency else export_config.frequency
			export_config.email_time = email_time if email_time else export_config.email_time
			export_config.timezone = timezone if timezone else export_config.timezone
			db.session.commit()
			if export_config.id:
				UserFilterModel.reset_export_filters(user.id, export_config.id)
				for filter in filters:
					filter_type = FilterTypeModel.find_by_type_and_name(
						filter.type, filter.type_name)
					user_filter = UserFilterModel(
						user_id=user.id, filter_type_id=filter_type.id, set_type=set_type, export_config_id=export_config.id)
					if filter.type != 'Text':
						company_filter = CompanyFilterModel.find_by_company_and_value_and_type(
							user.company_id, filter.value, filter_type.id)
						if company_filter:
							user_filter.company_filter_id = company_filter.id
						else:
							raise GraphQLError('Unauthorized filter submitted')
					else:
						user_filter.value = filter.value
					db.session.add(user_filter)
					db.session.commit()
				ok = True
			else:
				raise GraphQLError(
					'Error: Not able to locate user or/and filter type data to update filters')
		return UpdateExportConfig(ok=ok, export_config=export_config)


class DeleteExportConfig(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, id):
		ok = False
		exports = db.session.query(ExportModel).filter(
			ExportModel.export_config_id == id).all()
		for export in exports:
			export.deleted = True
		config = db.session.query(ExportConfigModel).filter(
			ExportConfigModel.id == id).first()
		config.deleted = True
		db.session.commit()
		ok = True
		return DeleteExportConfig(ok=ok)


class DeleteExport(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, id):
		ok = False
		export = db.session.query(ExportModel).filter(
			ExportModel.id == id).first()
		if export:
			config = db.session.query(ExportConfigModel).filter(
				ExportConfigModel.id == export.export_config_id).first()
			if config.ad_hoc:
				export.deleted = True
				config.deleted = True
			else:
				export.deleted = True
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Error: Not able to locate export')
		return DeleteExport(ok=ok)


class DownloadExportFile(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	url = String()

	def mutate(self, info, id):
		export = Export.get_query(info).filter(ExportModel.id == id).first()
		if export:
			url = get_file_from_s3(export.name)
		else:
			raise GraphQLError('Error: Not able to locate export')

		return DownloadExportFile(url=url)


class UpdatePrediction(graphene.Mutation):
	class Arguments:
		post_id = String(required=True)
		review = Boolean()

	ok = Boolean()

	def mutate(self, info, post_id, review=None):
		user = info.context.user
		ok = False
		if user:
			response = execute_prediction_update(post_id, review, webapp_reviewer_id=user.id)
			if response:
				ok = True
			else:
				raise GraphQLError('Error: unable to locate prediction')
		else:
			raise GraphQLError(
				'Error: unable to update prediction through Labelling API')
		return ProspectAction(ok=ok)


class PersonInput(SQLAlchemyInputObjectType):
	class Meta:
		model = funnel_models.Person


class UpdatePersonInput(SQLAlchemyInputObjectType):
	class Meta:
		model = funnel_models.Person
		include_id = True


# Aingine
call_aingine = create_forwarder(AINGINE_GRAPHQL_API_URL)


class CreatePerson(graphene.Mutation):
	ok = Boolean()
	person = Field(schema.Person)

	class Arguments:
		person_data = PersonInput()
		company_source_id = Int()

	def mutate(self, info, person_data=None, company_source_id=None):
		# person = funnel_models.Person(**person_data)
		ok = True
		# Forward request to aingine
		try:
			response = call_aingine(info, 'person')
			entity = instantiate_graph(
				response, constructor=funnel_models.Person)
		except:
			raise
			ok = False

		# Response comes as json, instantiate it to sqlalchemy objects

		return CreatePerson(person=entity, ok=ok)


class UpdatePerson(graphene.Mutation):
	ok = Boolean()
	person = Field(schema.Person)

	class Arguments:
		person_data = UpdatePersonInput()

	def mutate(self, info, person_data=None, company_source_id=None):
		# person = funnel_models.Person(**person_data)
		ok = True
		# Forward request to aingine
		try:
			response = call_aingine(info, 'ok')
			entity = instantiate_graph(
				response, constructor=funnel_models.Person)
		except:
			raise
			ok = False

		# Response comes as json, instantiate it to sqlalchemy objects

		return UpdatePerson(person=entity, ok=ok)


class CreateUserAccountInput(SQLAlchemyInputObjectType):
	class Meta:
		model = funnel_models.UserAccount


class CreatePersonUserAccount(graphene.Mutation):
	ok = Boolean()
	user_account = Field(schema.UserAccount)

	class Arguments:
		user_account_data = CreateUserAccountInput()
		person_id = Int()

	def mutate(self, info, user_account_data=None, person_id=None):
		ok = True
		# Forward request to aingine
		try:
			response = call_aingine(info, 'ok')
			entity = instantiate_graph(
				response, constructor=funnel_models.UserAccount)
		except:
			raise
			ok = False

		# Response comes as json, instantiate it to sqlalchemy objects

		return CreatePersonUserAccount(user_account=entity, ok=ok)


class UpdateUserAccount(SQLAlchemyMutationAingine):
	class Meta:
		model = funnel_models.UserAccount
		object_type = schema.UserAccount
		action = "Update"


class UnassignPerson(graphene.Mutation):
	class Arguments:
		person_id = Int(required=True)
		source_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, person_id, source_id):
		ok = False
		# Forward request to aingine
		try:
			response = call_aingine(info, 'ok')
			if response:
				ok = True
		except:
			raise GraphQLError('Error: unable to unassign person')
		return UnassignPerson(ok=ok)

class UnassignUserAccount(graphene.Mutation):
	class Arguments:
		person_id = Int(required=True)
		account_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, person_id, account_id):
		ok = False
		# Forward request to aingine
		try:
			response = call_aingine(info, 'ok')
			if response:
				ok = True
		except:
			raise GraphQLError('Error: unable to unassign account')
		return UnassignUserAccount(ok=ok)


#########################
#   Create New Lead     #
#########################

class CreateLead(graphene.Mutation):
	"""Mutation to create a new `Lead`.

	The `mutate` function takes in the lead information (name, DOB, phone, etc.) and returns a `Lead` object with a
	status code (HTTP Status code) and a message.
	"""
	class Arguments:
		full_name = String(required=True)
		lead_source_type = String(required=True)
		first_name = String()
		last_name = String()
		date_of_birth = Date()
		lead_source_original_id = Int()
		status = String()
		email_consent = Boolean()
		email_consent_date = DateTime()
		text_consent = Boolean()
		text_consent_date = DateTime()
		phone = String()
		lead_status_type_id = Int()
		lead_status_description = String()
		other_source = String()

	status_code = Int()
	message = String()
	lead = Field(lambda: Leads)

	def mutate(self, info, full_name, lead_source_type, first_name=None, last_name=None,
			   date_of_birth=None, lead_source_original_id=None, status=None, email_consent=None,
			   email_consent_date=None, text_consent=None, text_consent_date=None, phone=None,
			   lead_status_type_id=None, lead_status_description=None, other_source=None):
		try:
			user = info.context.user
			
			if phone:
				# Get the type of phone
				lookup_type = look_up_phone_type(phone)
				if lookup_type in [None, 'Invalid']:
					return CreateLead(status_code=HTTPStatus.BAD_REQUEST.value, message='Invalid Phone Lookup')
				# Validation for the phone number is already mapped with other/current lead or not.
				lead_phone = db.session.query(LeadPhonesModel)\
					.join(LeadsModel, LeadsModel.id == LeadPhonesModel.lead_id)\
					.filter(
						LeadsModel.company_id == user.company_id,
						LeadPhonesModel.phone == phone,
						LeadsModel.is_deleted == False
					)\
					.first()
				if lead_phone:
					return CreateLead(
						status_code=HTTPStatus.SEE_OTHER.value,
						message='This phone is already mapped with other lead')

			lead = LeadsModel(full_name=full_name, first_name=first_name, last_name=last_name,
							  date_of_birth=date_of_birth, lead_source_type=lead_source_type,
							  lead_source_original_id=lead_source_original_id, company_id=user.company_id,
							  status=status, email_consent=email_consent,
							  email_consent_date=email_consent_date, text_consent=text_consent,
							  text_consent_date=text_consent_date, other_source=other_source)
			db.session.add(lead)
			db.session.commit()
			db.session.refresh(lead)

			# If this lead is being created from a CRM, mark the lead as `ACTIVE` and `NEW_LEAD`
			# If this lead is being created from manual entry, mark the lead as `ACTIVE` and `NEW_SMAI_LEAD`
			util.update_lead_status(lead, user_id=user.id, new_status_type_id=lead_status_type_id,
									new_status_type=f'ACTIVE-NEW_SMAI_LEAD',
									description=lead_status_description)
			db.session.refresh(lead)
			return CreateLead(lead=lead, status_code=HTTPStatus.OK.value, message='Lead created successfully')
		except Exception as e:
			traceback.print_exc()
			return CreateLead(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


###########################
#   Update Exist Lead     #
###########################

class UpdateLead(graphene.Mutation):
	"""Mutation to update an existing `Lead`.

	The `mutate` function takes in the lead information (id, name, DOB, phone, etc.) and returns a `Lead` object with a
	status code (HTTP Status code) and a message.
	"""
	class Arguments:
		lead_id = Int(required=True)
		full_name = String(required=True)
		lead_source_type = String()
		first_name = String()
		last_name = String()
		date_of_birth = Date()
		lead_source_original_id = Int()
		status = String()
		email_consent = Boolean()
		email_consent_date = DateTime()
		text_consent = Boolean()
		text_consent_date = DateTime()
		phone = String()
		lead_status_type_id = Int()
		lead_status_description = String()
		other_source = String()

	status_code = Int()
	message = String()
	lead = Field(lambda: Leads)

	def mutate(self, info, lead_id, full_name, lead_source_type=None, first_name=None, last_name=None,
			   date_of_birth=None, lead_source_original_id=None, status=None, email_consent=None,
			   email_consent_date=None, text_consent=None, text_consent_date=None, phone=None,
			   lead_status_type_id=None, lead_status_description=None, other_source=None):
		try:
			user = info.context.user
			
			if phone:
				# Get the type of phone
				lookup_type = look_up_phone_type(phone)
				if lookup_type in [None, 'Invalid']:
					return UpdateLead(status_code=HTTPStatus.BAD_REQUEST.value, message='Invalid Phone Lookup')
				# Validation for the phone number is already mapped with other/current lead or not.
				lead_phone = db.session.query(LeadPhonesModel)\
					.join(LeadsModel, LeadsModel.id == LeadPhonesModel.lead_id)\
					.filter(
						LeadsModel.company_id == user.company_id,
						LeadPhonesModel.phone == phone,
						LeadsModel.is_deleted == False,
						LeadsModel.id != lead_id
					)\
					.first()
				if lead_phone:
					return UpdateLead(
						status_code=HTTPStatus.SEE_OTHER.value,
						message='This phone is already mapped with other lead')
			
			lead = db.session.query(LeadsModel).filter(LeadsModel.id == lead_id).first()
			if lead:
				lead.full_name = full_name
				lead.first_name = first_name if first_name else lead.first_name
				lead.last_name = last_name if last_name else lead.last_name
				lead.date_of_birth = date_of_birth if date_of_birth else lead.date_of_birth
				lead.lead_source_type = lead_source_type if lead_source_type else lead.lead_source_type
				lead.lead_source_original_id = lead_source_original_id \
					if lead_source_original_id else lead.lead_source_original_id
				lead.company_id = user.company_id
				lead.status = status if status else lead.status
				lead.email_consent = email_consent if email_consent is not None else lead.email_consent
				lead.email_consent_date = email_consent_date if email_consent_date else lead.email_consent_date
				lead.text_consent = text_consent if text_consent is not None else lead.text_consent
				lead.text_consent_date = text_consent_date if text_consent_date else lead.text_consent_date
				lead.other_source = other_source if other_source else lead.other_source
				db.session.commit()

				util.update_lead_status(lead, user_id=user.id, new_status_type_id=lead_status_type_id,
										description=lead_status_description)
				db.session.refresh(lead)
			else:
				# Lead can not be found
				return UpdateLead(
					status_code=HTTPStatus.NOT_FOUND.value, message='Unable to locate lead data to update')
			
			return UpdateLead(lead=lead, status_code=HTTPStatus.OK.value, message='Lead updated successfully')
		except Exception as e:
			traceback.print_exc()
			return UpdateLead(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


class DeleteLead(graphene.Mutation):
	"""Mutation to delete an existing `Lead`.

	The `mutate` function takes in the lead id and returns a `DeletedLead` object with a boolean value that represents
	the status of the mutation. The `Lead` is not physically deleted; it is just marked as deleted.
	"""
	class Arguments:
		lead_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, lead_id):
		ok = False
		lead = db.session.query(LeadsModel).filter(LeadsModel.id == lead_id).first()
		if lead:
			lead.is_deleted = True
			db.session.commit()

			lead_schedules = db.session.query(ScheduledMessages).filter(ScheduledMessages.lead_id == lead.id).all()
			for lead_schedule in lead_schedules:
				try:
					client.stop_execution(executionArn=lead_schedule.execution_arn, cause="Lead deleted")
				except client.exceptions.ExecutionDoesNotExist as e:
					traceback.print_exc()
			
			db.session.query(ScheduledMessages).filter(ScheduledMessages.lead_id == lead.id).delete()
			db.session.commit()
			ok = True
		else:
			raise GraphQLError(f"Error: Unable to locate lead data to update for lead {lead_id}")
		return DeleteLead(ok=ok)


class CreateLeadEmail(graphene.Mutation):
	"""Mutation to create an email for a `Lead`.

	The `mutate` function takes in the data (lead id, email and type of email), updates the database and returns a
	`LeadEmails` object.
	"""
	class Arguments:
		lead_id = Int(required=True)
		email = String(required=True)
		email_type = String()

	lead_email = Field(lambda: LeadEmails)

	def mutate(self, info, lead_id, email, email_type=None):
		# lead_email = db.session.query(LeadEmailsModel).filter(
		#               LeadEmailsModel.lead_id == lead_id, LeadEmailsModel.email == email).first()
		# if lead_email:
		#     raise GraphQLError('Error: You can't add duplicate Email')
		lead_email = LeadEmailsModel(lead_id=lead_id, email=email, email_type=email_type)
		db.session.add(lead_email)
		db.session.commit()
		db.session.refresh(lead_email)
		return CreateLeadEmail(lead_email=lead_email)


class UpdateLeadEmail(graphene.Mutation):
	"""Mutation to update an existing email for a `Lead`.

	The `mutate` function takes in the data (lead email id, email and type of email), updates the database and returns a
	`LeadEmails` object.
	"""
	class Arguments:
		lead_email_id = Int(required=True)
		email = String(required=True)
		email_type = String()

	ok = Boolean()
	lead_email = Field(lambda: LeadEmails)

	def mutate(self, info, lead_email_id, email, email_type=None):
		ok = False
		# lead_email = db.session.query(LeadEmailsModel).filter(
		#               LeadEmailsModel.lead_id == lead_id, LeadEmailsModel.email == email,
		#               LeadEmailsModel.id != id).first()
		# if lead_email:
		#     raise GraphQLError('Error: You can't add duplicate Email')
		lead_email = db.session.query(LeadEmailsModel).filter(LeadEmailsModel.id == lead_email_id).first()
		if lead_email:
			lead_email.email = email
			lead_email.email_type = email_type
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Error: unable to locate lead email to update')
		return UpdateLeadEmail(ok=ok, lead_email=lead_email)


class DeleteLeadEmail(graphene.Mutation):
	"""Mutation to delete an existing email for a `Lead`.

	The `mutate` function takes in the data (lead id, email and type of email), updates the database and returns a
	boolean representing the status of the request.
	"""
	class Arguments:
		lead_email = Int(required=True)

	ok = Boolean()

	def mutate(self, info, lead_email):
		ok = False
		db.session.query(LeadEmailsModel).filter(LeadEmailsModel.id == lead_email).delete()
		db.session.commit()
		ok = True
		return DeleteLeadEmail(ok=ok)


class CreateLeadPhone(graphene.Mutation):
	"""Mutation to create a phone record for a `Lead`.

	The `mutate` function takes in the data (lead id, phone number and type of phone), updates the database and returns
	a `LeadPhones` object.
	"""
	class Arguments:
		lead_id = Int(required=True)
		phone = String(required=True)
		phone_type = String()

	status_code = Int()
	message = String()
	lead_phone = Field(lambda: LeadPhones)

	def mutate(self, info, lead_id, phone, phone_type=None):
		try:
			lookup_type = look_up_phone_type(phone)
			if lookup_type in [None, 'Invalid']:
				return CreateLeadPhone(status_code=HTTPStatus.BAD_REQUEST.value, message='Invalid Phone Lookup')

			user = info.context.user
			
			# Validation for the phone number is already mapped with other/current lead or not.
			lead_phone = db.session.query(LeadPhonesModel)\
				.join(LeadsModel, LeadsModel.id == LeadPhonesModel.lead_id)\
				.filter(
					LeadsModel.company_id == user.company_id,
					LeadPhonesModel.phone == phone,
					LeadsModel.is_deleted == False
				)\
				.first()
			if lead_phone:
				return CreateLeadPhone(
					status_code=HTTPStatus.SEE_OTHER.value,
					message='This phone is already mapped with other lead')
			
			lead_phone = LeadPhonesModel(lead_id=lead_id, phone=phone, phone_type=phone_type, lookup_type=lookup_type)
			db.session.add(lead_phone)
			db.session.commit()
			db.session.refresh(lead_phone)
			return CreateLeadPhone(lead_phone=lead_phone, status_code=HTTPStatus.OK.value,
								   message='Lead Phone created successfully')
		except Exception as e:
			traceback.print_exc()
			return CreateLeadPhone(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


class UpdateLeadPhone(graphene.Mutation):
	"""Mutation to update an existing phone record for a `Lead`.

	The `mutate` function takes in the data (lead phone id, phone number and type of phone), updates the database and
	returns a `LeadPhones` object.
	"""
	class Arguments:
		lead_phone_id = Int(required=True)
		phone = String(required=True)
		phone_type = String()

	status_code = Int()
	message = String()
	lead_phone = Field(lambda: LeadPhones)

	def mutate(self, info, lead_phone_id, phone, phone_type=None):
		try:
			lookup_type = look_up_phone_type(phone)
			if lookup_type in [None, 'Invalid']:
				return UpdateLeadPhone(status_code=HTTPStatus.BAD_REQUEST.value, message='Invalid Phone Lookup')

			user = info.context.user

			# Validation for the phone number is already mapped with other/current lead or not.
			lead_phone = db.session.query(LeadPhonesModel)\
				.join(LeadsModel, LeadsModel.id == LeadPhonesModel.lead_id)\
				.filter(
					LeadsModel.company_id == user.company_id,
					LeadPhonesModel.phone == phone,
					LeadPhonesModel.id != lead_phone_id,
					LeadsModel.is_deleted == False
				)\
				.first()
			if lead_phone:
				return UpdateLeadPhone(
					status_code=HTTPStatus.SEE_OTHER.value, message='This phone is already mapped with other lead')

			lead_phone = db.session.query(LeadPhonesModel).filter(LeadPhonesModel.id == lead_phone_id).first()
			if lead_phone:
				lead_phone.phone = phone
				lead_phone.phone_type = phone_type
				lead_phone.lookup_type = lookup_type
				db.session.commit()
			else:
				# Lead can not be found
				return UpdateLeadPhone(
					status_code=HTTPStatus.NOT_FOUND.value, message='Unable to locate lead phone to update')

			return UpdateLeadPhone(lead_phone=lead_phone, status_code=HTTPStatus.OK.value,
								   message='Lead Phone updated successfully')
		except Exception as e:
			traceback.print_exc()
			return CreateLeadPhone(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


class DeleteLeadPhone(graphene.Mutation):
	"""Mutation to delete an existing phone record for a `Lead`.

	The `mutate` function takes in the data (lead phone id), updates the database and returns a boolean representing the
	status of the request.
	"""
	class Arguments:
		lead_phone_id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, lead_phone_id):
		ok = False
		db.session.query(LeadPhonesModel).filter(LeadPhonesModel.id == lead_phone_id).delete()
		db.session.commit()
		ok = True
		return DeleteLeadPhone(ok=ok)


class CreateLeadAddress(graphene.Mutation):
	class Arguments:
		lead_id = Int(required=True)
		location_text = String()
		address_line_1 = String()
		address_line_2 = String()
		city = String()
		state = String()
		postal_code = String()
		country = String()

	lead_address = Field(lambda: LeadAddresses)

	def mutate(self, info, lead_id, location_text=None, address_line_1=None, address_line_2=None,
				city=None, state=None, postal_code=None, country=None):
		# if info.context.user.is_admin():
		lead_address = LeadAddressesModel(lead_id=lead_id, location_text=location_text,
										address_line_1=address_line_1, address_line_2=address_line_2,
										city=city, state=state, postal_code=postal_code,
										country=country)
		db.session.add(lead_address)
		db.session.commit()
		db.session.refresh(lead_address)
		# else:
		#     raise GraphQLError('Unauthorized')
		return CreateLeadAddress(lead_address=lead_address)

class UpdateLeadAddress(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		location_text = String()
		address_line_1 = String()
		address_line_2 = String()
		city = String()
		state = String()
		postal_code = String()
		country = String()

	ok = Boolean()
	lead_address = Field(lambda: LeadAddresses)

	def mutate(self, info, id, location_text=None, address_line_1=None, address_line_2=None, 
				city=None, state=None, postal_code=None, country=None):
		ok = False
		# if info.context.user.is_admin():
		lead_address = db.session.query(LeadAddressesModel).filter(LeadAddressesModel.id == id).first()
		if lead_address:
			lead_address.location_text = location_text if location_text else lead_address.location_text
			lead_address.address_line_1 = address_line_1 if address_line_1 else lead_address.address_line_1
			lead_address.address_line_2 = address_line_2 if address_line_2 else lead_address.address_line_2
			lead_address.city = city if city else lead_address.city
			lead_address.state = state if state else lead_address.state
			lead_address.postal_code = postal_code if postal_code else lead_address.postal_code
			lead_address.country = country if country else lead_address.country
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Error: unable to locate lead address to update')
		# else:
		#     raise GraphQLError('Unauthorized')
		return UpdateLeadAddress(ok=ok, lead_address=lead_address)

class DeleteLeadAddress(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, id):
		ok = False
		# if info.context.user.is_admin():
		db.session.query(LeadAddressesModel).filter(LeadAddressesModel.id == id).delete()
		db.session.commit()
		ok = True
		# else:
		#     raise GraphQLError('Unauthorized')
		return DeleteLeadAddress(ok=ok)

class CreateLeadVehicleOfInterest(graphene.Mutation):
	class Arguments:
		lead_id = Int(required=True)
		year = String()
		make = String()
		model = String()
		trim = String()
		description = String()
		budget = String()
		is_current = Boolean()
		customer_interest = String()
		is_primary = Boolean()

	lead_vehicle_of_interest = Field(lambda: LeadVehicleOfInterest)

	def mutate(self, info, lead_id, year=None, make=None, model=None, trim=None, description=None, budget=None, is_current=None, customer_interest=None, is_primary=False):
		# if info.context.user.is_admin():
		lead_vehicle_of_interest = LeadVehicleOfInterestModel(lead_id=lead_id, year=year, make=make,model=model, 
												trim=trim, description=description, budget=budget, is_current = is_current, customer_interest= customer_interest, is_primary=is_primary)
		db.session.add(lead_vehicle_of_interest)
		db.session.commit()
		db.session.refresh(lead_vehicle_of_interest)
		# else:
		#     raise GraphQLError('Unauthorized')
		return CreateLeadVehicleOfInterest(lead_vehicle_of_interest=lead_vehicle_of_interest)

class UpdateLeadVehicleOfInterest(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		year = String()
		make = String()
		model = String()
		trim = String()
		description = String()
		budget = String()
		is_current = Boolean()
		customer_interest = String()
		is_primary = Boolean()

	ok = Boolean()
	lead_vehicle_of_interest = Field(lambda: LeadVehicleOfInterest)

	def mutate(self, info, id, year=None, make=None, model=None, trim=None, description=None, budget=None, is_current=None, customer_interest=None, is_primary=None):
		ok = False
		# if info.context.user.is_admin():
		lead_voi = db.session.query(LeadVehicleOfInterestModel).filter(LeadVehicleOfInterestModel.id == id).first()
		if lead_voi:
			lead_voi.year = year if year else lead_voi.year
			lead_voi.make = make if make else lead_voi.make
			lead_voi.model = model if model else lead_voi.model
			lead_voi.trim = trim if trim else lead_voi.trim
			lead_voi.description = description if description else lead_voi.description
			lead_voi.budget = budget if budget else lead_voi.budget
			lead_voi.is_current = is_current if is_current != None else lead_voi.is_current
			lead_voi.customer_interest = customer_interest if customer_interest else lead_voi.customer_interest
			lead_voi.is_primary = is_primary if is_primary != None else lead_voi.is_primary
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Error: unable to locate lead vehicle of interest to update')
		# else:
		#     raise GraphQLError('Unauthorized')
		return UpdateLeadVehicleOfInterest(ok=ok, lead_vehicle_of_interest=lead_voi)

class DeleteLeadVehicleOfInterest(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, id):
		ok = False
		# if info.context.user.is_admin():
		db.session.query(LeadVehicleOfInterestModel).filter(LeadVehicleOfInterestModel.id == id).delete()
		db.session.commit()
		ok = True
		# else:
		#     raise GraphQLError('Unauthorized')
		return DeleteLeadVehicleOfInterest(ok=ok)

class VehicleOfInterestObject(InputObjectType):
	year = String(required=True)
	make = String(required=True)
	model = String(required=True)
	trim = String()
	description = String()
	budget = String()
	is_current = Boolean()
	customer_interest = String()
	is_primary = Boolean()

class CreateLeadVehicleOfInterests(graphene.Mutation):
	class Arguments:
		lead_id = Int(required=True)
		voi_object = List(VehicleOfInterestObject, required=True)

	ok = Boolean()
	vehicle_of_interests = List(LeadVehicleOfInterest)

	def mutate(self, info, lead_id, voi_object):
		ok = False
		vehicle_of_interests = []
		lead = db.session.query(LeadsModel).filter(LeadsModel.id == lead_id).first()
		if lead:
			for voi in voi_object:
				vehicle_of_interest = LeadVehicleOfInterestModel(
					lead_id = lead_id,
					year = voi.year, 
					make = voi.make, 
					model = voi.model, 
					trim = voi.trim if voi.trim else None, 
					description = voi.description if voi.description else None, 
					budget = voi.budget if voi.budget else None, 
					is_current = voi.is_current,
					customer_interest = voi.customer_interest,
					is_primary = voi.is_primary,
				)
				db.session.add(vehicle_of_interest)
				db.session.commit()
				vehicle_of_interests.append(vehicle_of_interest)
				ok = True
		else:
			raise GraphQLError('Error: unable to locate lead to create vehicle of interest')
		return CreateLeadVehicleOfInterests(ok=ok, vehicle_of_interests=vehicle_of_interests)


class UpdateLeadConsentStatus(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		status = String()

	ok = Boolean()
	lead = Field(lambda: Leads)
	def mutate(self, info, id, status = 'PENDING'):
		ok = False
		
		lead = db.session.query(LeadsModel).filter(LeadsModel.id == id).first()
		if lead:
			try:
				lead.text_consent_status = status
				lead.text_consent_date = datetime.utcnow()
				db.session.commit()
				ok = True
			except SQLAlchemyError as e:
				error = str(e.__dict__['orig'])
				raise GraphQLError(error)
		else:
			raise GraphQLError('Error: unable to locate lead data to update')
		return UpdateLeadConsentStatus(ok=ok, lead=lead)


class EnableDisableLeadConversation(graphene.Mutation):
	class Arguments:
		lead_id = Int()
		disable_conversation = Boolean(required=True)
		
	status_code = Int()
	message = String()
	lead = Field(lambda: Leads)

	def mutate(self, info, lead_id, disable_conversation):
		try:
			lead = db.session.query(LeadsModel).filter(
											LeadsModel.id == lead_id).first()
			if lead:
				lead.disable_conversation = disable_conversation
				db.session.add(lead)
				db.session.commit()
				db.session.refresh(lead)
				prev_lead_conversation_histories = db.session.query(LeadConversationHistoryModel).filter(
											LeadsModel.id == lead_id)
				
				for prev_lead_conversation_history in prev_lead_conversation_histories:
					prev_lead_conversation_history.is_active = False
					db.session.commit()

				lead_conversation_history = LeadConversationHistoryModel(
					lead_id = lead_id,
					disable_conversation = disable_conversation, 
					user_id = info.context.user.id, 
					is_text = True, 
					is_active = True	
				)
				db.session.add(lead_conversation_history)
				db.session.commit()
				message = f'{"Disabled" if disable_conversation else "Enabled"} lead conversation'
				return EnableDisableLeadConversation(lead=lead, status_code=HTTPStatus.OK.value, message=message)
			else:
				return EnableDisableLeadConversation(status_code=HTTPStatus.NOT_FOUND.value, message="Unable to locate user data to add engagement message template")

		except Exception as e:
			traceback.print_exc()
			return EnableDisableLeadConversation(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')

class CreateCampaign(graphene.Mutation):
	class Arguments:
		name = String(required=True)
		method= String()
		text_message= String()
		start_date = DateTime()
		end_date = DateTime()
		company_id = Int(required=True)
		user_id = Int(required=True)
		active_ind = String()
		is_disabled = Boolean()
		is_prioritize = Boolean()

	campaign = Field(lambda: Campaign)

	def mutate(self, info, name,method, text_message, company_id,user_id, start_date=None, end_date=None, active_ind=None, is_disabled=None, is_prioritize=None):
		custom_campaign_type = db.session.query(CampaignTypes).filter(CampaignTypes.type == CampaignManageType.CUSTOM).first()
		campaign = CampaignModel(name=name, method=method, text_message=text_message,company_id=company_id, user_id=user_id, 
								start_date=start_date, end_date=end_date, campaign_type_id = custom_campaign_type.id,
								active_ind=active_ind, is_disabled=is_disabled, is_prioritize=is_prioritize)
		db.session.add(campaign)
		db.session.commit()
		db.session.refresh(campaign)
		return CreateCampaign(campaign=campaign)

class UpdateCampaign(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		name = String(required=True)
		method= String()
		text_message= String()
		start_date = DateTime()
		end_date = DateTime()
		active_ind = String()
		is_disabled = Boolean()
		is_accept_terms= Boolean()
		is_prioritize = Boolean()

	ok = Boolean()
	campaign = Field(lambda: Campaign)

	def mutate(self, info, id, name, method,text_message, start_date=None, end_date=None, active_ind=None,is_disabled=None, is_accept_terms=None, is_prioritize=None):
		campaign = db.session.query(CampaignModel).filter(CampaignModel.id == id).first()
		if campaign:
			campaign.name = name
			campaign.method = method
			campaign.text_message = text_message
			campaign.start_date = start_date
			campaign.end_date = end_date
			if active_ind is not None:
				campaign.active_ind = active_ind
			if is_disabled is not None:
				campaign.is_disabled = is_disabled
			if is_accept_terms is not None:
				campaign.is_accept_terms = is_accept_terms
				campaign.accept_terms_timestamp = datetime.utcnow()
			if is_prioritize is not None:
				campaign.is_prioritize = is_prioritize
			
			db.session.commit()
			ok = True
		else:
			raise GraphQLError(
				'Error: unable to locate campaign data to update')
		return UpdateCampaign(ok=ok, campaign=campaign)

class CloneCampaign(graphene.Mutation):
	class Arguments:
		campaign_id = Int(required=True)
		name = String(required=True)
		user_id = Int(required=True)

	campaign = Field(lambda: Campaign)

	def mutate(self, info, campaign_id, name, user_id):
		existingCampaign = db.session.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
		print(existingCampaign)
		if existingCampaign:
			campaign = CampaignModel(name=name, method=existingCampaign.method, text_message=existingCampaign.text_message,company_id=existingCampaign.company_id, user_id=user_id, 
								start_date=existingCampaign.start_date, end_date=existingCampaign.end_date,
								active_ind=existingCampaign.active_ind, is_disabled=existingCampaign.is_disabled, is_prioritize=existingCampaign.is_prioritize)
			db.session.add(campaign)
			db.session.commit()
			db.session.refresh(campaign)
			
			if existingCampaign.campaign_selections:
				campaign_selection = Field(lambda: CampaignSelections)
				for selection in existingCampaign.campaign_selections:
					campaign_selection = CampaignSelectionsModel(
					campaign_id=campaign.id, type=selection.type, value=selection.value)
					db.session.add(campaign_selection)
					db.session.commit()

			if existingCampaign.campaign_schedules:
				campaign_schedule = Field(lambda: CampaignSchedules)
				for schedule in existingCampaign.campaign_schedules:
					campaign_schedule = CampaignSchedulesModel(
													campaign_id = campaign.id, type = schedule.type,
													numeric_value = schedule.numeric_value, temporal_value = schedule.temporal_value,
													sort_order = schedule.sort_order
												)
					db.session.add(campaign_schedule)
					db.session.commit()
					db.session.refresh(campaign_schedule)
					scheduleTemplates = db.session.query(CampaignTemplatesModel).filter(CampaignTemplatesModel.schedule_id == schedule.id).all()
					if scheduleTemplates and len(scheduleTemplates):
						campaign_template = Field(lambda: CampaignTemplates)
						for template in scheduleTemplates:
							campaign_template = CampaignTemplatesModel(campaign_id=campaign.id, schedule_id=campaign_schedule.id, source_id=template.source_id, template_text=template.template_text)
							db.session.add(campaign_template)
							db.session.commit()
				
		else:
			raise GraphQLError(
				'Error: unable to locate campaign data to cloning')
		return CloneCampaign(campaign=campaign)

class DeleteCampaign(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()
	def mutate(self, info, id):
		ok = False
		db.session.query(CampaignModel).filter(CampaignModel.id == id).delete()
		db.session.commit()
		ok = True
		return DeleteCampaign(ok=ok)

class CreateCampaignSchedule(graphene.Mutation):
	class Arguments:
		campaign_id = Int(required=True)
		type = String(required=True)
		numeric_value = Int(required=True)
		temporal_value = String(required=True)
		title = String(required=True)
		sort_order = Int(required=True)

	ok = Field(Boolean)
	campaign_schedule = Field(lambda: CampaignSchedules)

	def mutate(self, info, campaign_id, type,numeric_value,temporal_value,title,sort_order):
		ok = False
		prev_campaign_schedules = None
		if type == 'REPEAT':
			""" 
				If already exist REPEAT schedule then needs to check that condition (Only one REPEAT schedule)
			"""
			prev_campaign_schedules = db.session.query(CampaignSchedulesModel.id).filter(
							CampaignSchedulesModel.campaign_id == campaign_id)
			
			if prev_campaign_schedules.filter(CampaignSchedulesModel.type == 'REPEAT').all():
				return UpdateCampaignSchedules(ok=ok)

		if numeric_value == 0:
			""" 
				If already exist IMMEDIATE schedule then needs to check that condition (Only one IMMEDIATE schedule)
				IMMEDIATE means numeric_value == 0
			"""
			if not prev_campaign_schedules:
				prev_campaign_schedules = db.session.query(CampaignSchedulesModel.id).filter(
							CampaignSchedulesModel.campaign_id == campaign_id)
			
			if prev_campaign_schedules.filter(CampaignSchedulesModel.numeric_value == 0).all():
				return UpdateCampaignSchedules(ok=ok)

		campaign_schedule = CampaignSchedulesModel(campaign_id=campaign_id, type=type, numeric_value=numeric_value, temporal_value=temporal_value,title=title,sort_order=sort_order)
		db.session.add(campaign_schedule)
		db.session.commit()
		db.session.refresh(campaign_schedule)
		ok = True
		return CreateCampaignSchedule(ok=ok, campaign_schedule=campaign_schedule)

class UpdateCampaignSchedules(graphene.Mutation):
	class Arguments:
		type = String(required=True)
		numeric_value = Int(required=True)
		temporal_value = String(required=True)
		id = Int(required=True)
		title = String(required=True)
		sort_order = Int(required=True)

	campaign_schedule = Field(lambda: CampaignSchedules)
	ok = Boolean()
	def mutate(self, info, id, type,numeric_value,temporal_value,title,sort_order):
		ok = False
		campaign_schedule = db.session.query(CampaignSchedulesModel).filter(
				CampaignSchedulesModel.id == id).first()
		if campaign_schedule:
			prev_campaign_schedules = None
			if type == 'REPEAT':
				""" 
					If already exist REPEAT schedule then needs to check that condition (Only one REPEAT schedule)
				"""
				prev_campaign_schedules = db.session.query(CampaignSchedulesModel.id).filter(
								CampaignSchedulesModel.id != campaign_schedule.id,
								CampaignSchedulesModel.campaign_id == campaign_schedule.campaign_id)
				
				if prev_campaign_schedules.filter(CampaignSchedulesModel.type == 'REPEAT').all():
					return UpdateCampaignSchedules(ok=ok)

			if numeric_value == 0:
				""" 
					If already exist IMMEDIATE schedule then needs to check that condition (Only one IMMEDIATE schedule)
					IMMEDIATE means numeric_value == 0
				"""
				if not prev_campaign_schedules:
					prev_campaign_schedules = db.session.query(CampaignSchedulesModel.id).filter(
								CampaignSchedulesModel.id != campaign_schedule.id,
								CampaignSchedulesModel.campaign_id == campaign_schedule.campaign_id)
				
				if prev_campaign_schedules.filter(CampaignSchedulesModel.numeric_value == 0).all():
					return UpdateCampaignSchedules(ok=ok)

			campaign_schedule.type = type
			campaign_schedule.numeric_value = numeric_value
			campaign_schedule.temporal_value = temporal_value
			campaign_schedule.title = title
			campaign_schedule.sort_order = sort_order
			
			db.session.commit()
			ok = True
		else:
			raise GraphQLError(
				'Error: Not able to locate campaign template to update')
		
		return UpdateCampaignSchedules(ok=ok, campaign_schedule=campaign_schedule)

class UpdateCampaignSchedulesSortOrder(graphene.Mutation):
	class Arguments:
		schedules = List(Int,required=True)
		sort_order = List(Int,required=True)

	campaign_schedules = List(CampaignSchedules)
	ok = Boolean()
	def mutate(self, info, schedules,sort_order):
		ok = False
		campaign_schedules = []
		for index, schedule in enumerate(schedules):
			campaign_schedule = db.session.query(CampaignSchedulesModel).filter(CampaignSchedulesModel.id == schedule).first()
			if campaign_schedule:
				campaign_schedule.sort_order = sort_order[index]
				db.session.commit()
				db.session.refresh(campaign_schedule)
				campaign_schedules.append(campaign_schedule)
				ok = True
															
		return UpdateCampaignSchedulesSortOrder(ok=ok, campaign_schedules=campaign_schedules)

class CreateCampaignTemplates(graphene.Mutation):
	class Arguments:
		campaign_id = Int(required=True)
		schedule_id = Int(required=True)
		sources = List(Int, required=True)
		template_text = List(String,required=True)
		after_hour_template_text = List(String,required=True)
		is_after_hour = Boolean(required=True)

	campaign_templates = List(CampaignTemplates)
	
	def mutate(self, info, campaign_id,schedule_id,sources, template_text, after_hour_template_text, is_after_hour):
		campaign_templates = []
		for index, source_id in enumerate(sources):
			source_id = source_id if source_id else None
			campaign_template = CampaignTemplatesModel(
											campaign_id = campaign_id, schedule_id = schedule_id, 
											source_id = source_id, template_text = template_text[index],
											after_hour_template_text = after_hour_template_text[index],
											active_ind = True, is_after_hour = is_after_hour)
			db.session.add(campaign_template)
			db.session.commit()
			db.session.refresh(campaign_template)
			campaign_templates.append(campaign_template)
		
		return CreateCampaignTemplates(campaign_templates=campaign_templates)

class UpdateCampaignScheduleTemplates(graphene.Mutation):
	class Arguments:
		campaign_id = Int(required=True)
		schedule_id = Int(required=True)
		sources = List(Int, required=True)
		template_text = List(String,required=True)
		after_hour_template_text = List(String,required=True)
		is_after_hour = Boolean(required=True)

	campaign_templates = List(CampaignTemplates)
	ok = Boolean()
	def mutate(self, info, campaign_id,schedule_id,sources, template_text, after_hour_template_text, is_after_hour):
		campaign_templates = []
		ok = False
		for index, source_id in enumerate(sources):
			source_id = source_id if source_id else None
			campaign_template = db.session.query(CampaignTemplatesModel).filter(
												CampaignTemplatesModel.campaign_id == campaign_id,
												CampaignTemplatesModel.schedule_id == schedule_id,
												CampaignTemplatesModel.source_id == source_id).first()
			if campaign_template:
				campaign_template.template_text = template_text[index]
				campaign_template.after_hour_template_text = after_hour_template_text[index]
				campaign_template.is_after_hour = is_after_hour
			else:
				campaign_template = CampaignTemplatesModel(
											campaign_id = campaign_id, schedule_id = schedule_id, 
											source_id = source_id, template_text = template_text[index],
											after_hour_template_text = after_hour_template_text[index],
											active_ind = True, is_after_hour = is_after_hour)
				db.session.add(campaign_template)

			db.session.commit()
			db.session.refresh(campaign_template)
			campaign_templates.append(campaign_template)
		ok = True
		return UpdateCampaignScheduleTemplates(ok=ok,campaign_templates=campaign_templates)

class UpdateCampaignTemplate(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		schedule_id = Int()
		source_id = Int()
		template_text = String()
		is_active = Boolean()
		after_hour_template_text = String()
		is_after_hour = Boolean()

	campaign_template = Field(lambda: CampaignTemplates)
	ok = Boolean()
	def mutate(self, info, id, schedule_id,source_id, template_text=None, is_active=None, after_hour_template_text=None, is_after_hour=None):
		ok = False
		campaign_template = db.session.query(CampaignTemplatesModel).filter(
				CampaignTemplatesModel.id == id).first()
		if campaign_template:
			source_id = source_id if source_id else None
			campaign_template.schedule_id = schedule_id
			campaign_template.source_id = source_id
			campaign_template.template_text = template_text
			campaign_template.after_hour_template_text = after_hour_template_text
			if is_after_hour is not None:
				campaign_template.is_after_hour = is_after_hour
			if is_active is not None:
				campaign_template.active_ind = is_active
			campaign_template.is_after_hour = is_after_hour
			db.session.commit()
			ok = True
		else:
			raise GraphQLError(
				'Error: Not able to locate campaign template to update')
		return UpdateCampaignTemplate(ok=ok, campaign_template=campaign_template)

class DeleteCampaignTemplate(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()
	def mutate(self, info, id):
		ok = False
		db.session.query(CampaignTemplatesModel).filter(CampaignTemplatesModel.id == id).delete()
		db.session.commit()
		ok = True
		return DeleteCampaignTemplate(ok=ok)

class DeleteCampaignSchedule(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()
	def mutate(self, info, id):
		ok = False
		db.session.query(CampaignSchedulesModel).filter(CampaignSchedulesModel.id == id).delete()
		db.session.commit()
		ok = True
		return DeleteCampaignSchedule(ok=ok)

# class CreateCampaignScheduleOption(graphene.Mutation):
#     class Arguments:
#         type = String(required=True)
#         numeric_value = Int(required=True)
#         temporal_value = String(required=True)

#     campaign_schedule_option = Field(lambda: CampaignScheduleOption)

#     def mutate(self, info, type,numeric_value,temporal_value):
#         campaign_schedule_option = CampaignScheduleOptionModel(type=type, numeric_value=numeric_value, 
#                                 temporal_value=temporal_value)
#         db.session.add(campaign_schedule_option)
#         db.session.commit()
#         db.session.refresh(campaign_schedule_option)
#         return CreateCampaignScheduleOption(campaign_schedule_option=campaign_schedule_option)

# class DeleteCampaignScheduleOption(graphene.Mutation):
#     class Arguments:
#         id = Int(required=True)

#     ok = Boolean()
#     def mutate(self, info, id):
#         ok = False
#         db.session.query(CampaignScheduleOptionModel).filter(CampaignScheduleOptionModel.id == id).delete()
#         db.session.commit()
#         ok = True
#         return DeleteCampaignScheduleOption(ok=ok)

class CreateCampaignSelections(graphene.Mutation):
	class Arguments:
		campaign_id = Int(required=True)
		type = String(required=True)
		values = List(SelectionInputs, required=True)
		secondaryType = String()
		secondaryValues = List(SelectionInputs)

	campaign_selections = List(CampaignSelections)

	def mutate(self, info, campaign_id, type, values,secondaryType=None, secondaryValues=None):
		campaign = db.session.query(CampaignModel).get(campaign_id)
		if campaign:
			campaign_selections = []
			CampaignSelectionsModel.reset_campaign_selections(campaign_id)
			for item in values:
				campaign_selection = CampaignSelectionsModel(
					campaign_id=campaign_id, type=type, value=item.value)
				
				db.session.add(campaign_selection)
				db.session.commit()
				db.session.refresh(campaign_selection)
				campaign_selections.append(campaign_selection)
			
			if secondaryValues != None:
				for item in secondaryValues:
					campaign_selection = CampaignSelectionsModel(
						campaign_id=campaign_id, type=secondaryType, value=item.value)
					
					db.session.add(campaign_selection)
					db.session.commit()
					db.session.refresh(campaign_selection)
					campaign_selections.append(campaign_selection)

		else:
			raise GraphQLError(
				'Error: Not able to locate campaign to update schedules')
		return CreateCampaignSelections(campaign_selections=campaign_selections)

class CreateCampaignLeadSummary(graphene.Mutation):
	class Arguments:
		campaign_id = Int(required=True)

	campaign_lead_summaries = List(CampaignLeadSummary)
	ok = Boolean()
	def mutate(self, info, campaign_id):
		user = info.context.user
		leads = LeadsModel.query.filter(LeadsModel.company_id == user.company_id, LeadsModel.is_deleted == False)
		q = CampaignSelectionsModel.query.filter(CampaignSelectionsModel.campaign_id == campaign_id).all()
		if q and len(q) and q[0].type.value == 'LEAD':
			list_id = []
			for row in q:
				list_id.append(row.value)
			leads = leads.filter(LeadsModel.id.in_(list_id))
		elif q and len(q) and (q[0].type.value == 'SOURCE' or q[0].type.value == 'STATUS'):
			orFilters = []
			orStatus = []
			for row in q:
				if row.type.value == 'SOURCE':
					source_id = row.value
					lead_source = LeadSourceModel.query.filter(LeadSourceModel.id == source_id).first()
					if lead_source:
						orFilters.append(lead_source.id)
				elif row.type.value == 'STATUS':
					orStatus.append(row.value)

			leads = leads.filter(and_(LeadsModel.lead_source_original_id.in_(orFilters), LeadsModel.lead_status_type_id.in_(orStatus)))

		elif q and len(q) and q[0].type.value == 'FILE':
			file_id = q[0].value
			leads = leads.filter(LeadsModel.lead_file_id == file_id)
		else:
			leads = leads.filter(False)
		
		campaign_leads = leads.order_by(getattr(getattr(LeadsModel, "id"), "asc")())
		if campaign_leads:
			ok = False
			campaign_lead_summaries = []
			for item in campaign_leads:
				campaign_lead_summary = CampaignLeadSummaryModel(
					campaign_id=campaign_id, lead_id=item.id, status="UNCONTACTED", last_message_sent_date=None, last_message_received_date=None, num_attempts_before_response=0)
				
				db.session.add(campaign_lead_summary)
				db.session.commit()
				db.session.refresh(campaign_lead_summary)
				campaign_lead_summaries.append(campaign_lead_summary)
			ok = True
		else:
			raise GraphQLError(
				'Error: Not able to locate campaign to update campaign lead summary')
		return CreateCampaignLeadSummary(ok=ok, campaign_lead_summaries=campaign_lead_summaries)

class CreateMessage(graphene.Mutation):
	class Arguments:
		system_user_id = Int()
		lead_id = Int(required=True)
		user_id = Int(required=True)
		channel_id = Int()
		campaign_id = Int()
		campaign_template_id = Int()
		direction = String()
		content = String(required=True)
		to_phone = String(required=True)

	status_code = Int()
	message = String()
	lead_message = Field(lambda: Message)

	def mutate(self, info, lead_id, user_id, content, to_phone, campaign_id=None, campaign_template_id=None,
				system_user_id=None, channel_id=None, direction=None):
		user = info.context.user
		lead = db.session.query(LeadsModel).filter(LeadsModel.id == lead_id).first()
		if lead and lead.constrains():
			# if lead.disable_conversation:
			#     return CreateMessage(status_code=HTTPStatus.NOT_ACCEPTABLE.value, message="Disable the conversation for that lead, Please enable it and then send the message")

			activity_center_phone, _  = util.get_from_number(db.session, user.company_id, 'ACTIVITY_CENTER')
			if not activity_center_phone:
				return CreateMessage(status_code=HTTPStatus.NOT_FOUND.value, message="Unable to find System User/Phone for the company")

			print(f"activity_center_phone (twilio) = {activity_center_phone}, user_phone (user) = {to_phone}")

			if not direction:
				direction = 'TO_LEAD'
			if channel_id:
				channel = db.session.query(ChannelModel).filter(ChannelModel.id == channel_id).first()
				if channel and channel.name == "Text" and channel.channel_type == "SMS":
					message_sid = send_sms(from_number=activity_center_phone, to_number=to_phone, message_body=content)
			else:
				message_sid = send_sms(from_number=activity_center_phone, to_number=to_phone, message_body=content)
			if message_sid:
				last_message = db.session.query(MessageModel).filter(MessageModel.lead_id == lead_id, MessageModel.date_sent != None, MessageModel.user_id == None).order_by(MessageModel.id.desc()).first()
				if last_message:
					campaign_id = last_message.campaign_id
				else:
					default_campaign = db.session.query(CampaignModel) \
							.join(CampaignTypes) \
							.filter(CampaignTypes.type == CampaignManageType.DEFAULT, CampaignModel.company_id == user.company_id) \
							.first()
					campaign_id = default_campaign.id if default_campaign else None
					
				date_sent = datetime.utcnow()
				lead_message = MessageModel(
					system_user_id=system_user_id, lead_id=lead_id, user_id=user_id, channel_id=channel_id,
					campaign_id=campaign_id, campaign_template_id=campaign_template_id, direction=direction,
					date_sent=date_sent, content=content, message_sid=message_sid
				)
				db.session.add(lead_message)
				db.session.commit()
				db.session.refresh(lead_message)

				# socketio_obj.trigger('received_message', {
                #             "lead_id": lead_id, "user_id": user_id, 
                #             "message": f"You have received new message from {lead.full_name}"
                #         })

				util.update_lead_status(lead, lead_activity = 'SENT_MESSAGE')

				trigger_nudge_event.stop_scheduler('REMINDER_SP_LEAD_MESSAGE', user, lead_id, lead_message.id)

				camp_lead_sum = db.session.query(CampaignLeadSummaryModel).filter(
					CampaignLeadSummaryModel.campaign_id == campaign_id,
					CampaignLeadSummaryModel.lead_id == lead_id
				).first()
				if not camp_lead_sum:
					camp_lead_sum = CampaignLeadSummaryModel(
												campaign_id = campaign_id, lead_id = lead_id, 
												status = "SENT", last_message_sent_date = date_sent, 
												last_message_received_date = None, num_attempts_before_response = 1)
					db.session.add(camp_lead_sum)
					db.session.commit()
					db.session.refresh(camp_lead_sum)
				else:
					camp_lead_sum.last_message_sent_date = date_sent
					
					if camp_lead_sum.status not in ['RESPONDED', 'ENGAGED']:
						if camp_lead_sum.num_attempts_before_response:
							camp_lead_sum.num_attempts_before_response += 1
						else:
							camp_lead_sum.num_attempts_before_response = 1

					if camp_lead_sum.status in ['UNCONTACTED', 'QUEUED']:
						camp_lead_sum.status = 'SENT'
					
					db.session.add(camp_lead_sum)
					db.session.commit()
				return CreateMessage(lead_message=lead_message, status_code=HTTPStatus.OK.value, message="Sent message")
			else:
				return CreateMessage(status_code=HTTPStatus.BAD_REQUEST.value, message="Error sending message to lead")
		else:
			return CreateMessage(status_code=HTTPStatus.BAD_REQUEST.value, message="Lead Has Opted out of Messaging or 180 days have from the last received message/first sent message")

class CreateMessageLog(graphene.Mutation):
	class Arguments:
		message_id = Int(required=True)
		to_phone = String(required=True)

	message_log = Field(lambda: MessageLog)

	def mutate(self, info, message_id, to_phone):
		user = info.context.user
		activity_center_phone, _  = util.get_from_number(db.session, user.company_id, 'ACTIVITY_CENTER')
		if not activity_center_phone:
			raise GraphQLError(
				'Error: Unable to find System User/Phone for the company')

		print(f"activity_center_phone (twilio) = {activity_center_phone}, user_phone (user) = {to_phone}")

		message_log = MessageLogModel(message_id=message_id, from_phone=activity_center_phone, to_phone=to_phone)
		db.session.add(message_log)
		db.session.commit()
		db.session.refresh(message_log)
		return CreateMessageLog(message_log=message_log)

class CreateChannel(graphene.Mutation):
	class Arguments:
		name = String(required=True)
		channel_type = String(required=True)

	channel = Field(lambda: Channel)

	def mutate(self, info, name, channel_type):
		channel = ChannelModel(name=name, channel_type=channel_type)
		db.session.add(channel)
		db.session.commit()
		db.session.refresh(channel)
		return CreateChannel(channel=channel)

class UpdateChannel(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		name = String(required=True)
		channel_type = String(required=True)

	ok = Boolean()
	channel = Field(lambda: Channel)

	def mutate(self, info, id, name, channel_type):
		ok = False
		channel = db.session.query(ChannelModel).filter(ChannelModel.id == id).first()
		if channel:
			channel.name = name
			channel.channel_type = channel_type
			db.session.commit()
			ok = True
		else:
			raise GraphQLError('Error: unable to locate channel to update')
		return UpdateChannel(ok=ok, channel=channel)

class DeleteChannel(graphene.Mutation):
	class Arguments:
		id = Int(required=True)

	ok = Boolean()

	def mutate(self, info, id):
		ok = False
		db.session.query(ChannelModel).filter(ChannelModel.id == id).delete()
		db.session.commit()
		ok = True
		return DeleteChannel(ok=ok)

class UpdateCrmIntegrationUser(graphene.Mutation):
	class Arguments:
		user_id = Int(required=True)
		crm_integration_id = Int(required=True)
		vin_user_id = Int(required=True)

	vin_solutions_user = Field(lambda: VinSolutionsUser)
	ok = Boolean()
	def mutate(self, info, user_id, crm_integration_id, vin_user_id):
		ok = False
		vin_solutions_user = db.session.query(VinSolutionsUserModel).filter(
				VinSolutionsUserModel.user_id == user_id, VinSolutionsUserModel.crm_integration_id == crm_integration_id).first()
		if vin_solutions_user:
			vin_solutions_user.vs_user_id = vin_user_id
			db.session.commit()
			ok = True
		else:
			vin_solutions_user = VinSolutionsUserModel(user_id=user_id, crm_integration_id=crm_integration_id, vs_user_id=vin_user_id, active=True)
			db.session.add(vin_solutions_user)
			db.session.commit()
			db.session.refresh(vin_solutions_user)

		return UpdateCrmIntegrationUser(ok=ok, vin_solutions_user=vin_solutions_user)

class CreateAppointment(graphene.Mutation):
	class Arguments:
		lead_id = Int(required=True)
		start_date = DateTime(required=True)
		end_date = DateTime(required=True)
		summary = String(required=True)
		appointment_timezone = String(required=True)
		description = String()
		discussed_voi_id = Int()

	appointment = Field(lambda: Appointment)
	ok = Boolean()

	def mutate(self, info, lead_id, start_date, end_date, summary, appointment_timezone, description=None, discussed_voi_id=None):
			ok = False
			_uuid = uuid.uuid4()
			user = info.context.user

			appointments = db.session.query(AppointmentModel).filter(
				AppointmentModel.lead_id == lead_id, AppointmentModel.end_datetime > datetime.utcnow(), AppointmentModel.appointment_status != "CANCELLED"
			).all()
			if appointments:
				raise GraphQLError("Appointment Already Scheduled")

			if start_date <= datetime.utcnow():
				raise GraphQLError("Error: Can't schedule appointment in past")

			whens = { 'Primary': 0, 'Personal': 1, 'Alternate': 2, 'Work': 3, 'Unknown': 4, None: 5}
			lead_email = db.session.query(LeadEmailsModel).filter(LeadEmailsModel.lead_id == lead_id) \
						.order_by(case(value=LeadEmailsModel.email_type, whens=whens).label("email_type"), LeadEmailsModel.id.desc()).first()
		
			ical = generate_ical(_uuid, start_date, end_date, f'{user.first_name} {user.last_name}', user.email if user.email else "", lead_email.email if lead_email else "", util.get_formatted_address(user.company), description, summary=summary)
			if lead_email:
				send_appointment_email(lead_email.email, summary, ical)
			if user.email:
				send_appointment_email(user.email, summary, ical)

			whens = { 'Cellular': 0, 'Cell': 1, 'Mobile': 2, 'Home': 3, 'Work': 4, 'Unknown': 5, 'None': 6, None: 7}
			lead_phone = db.session.query(LeadPhonesModel).filter(LeadPhonesModel.lead_id == lead_id, LeadPhonesModel.lookup_type.in_(["mobile", "voip"])) \
						.order_by(case(value=LeadPhonesModel.phone_type, whens=whens).label("phone_type"), LeadPhonesModel.id.desc()).first()

			if lead_phone:
				lead = db.session.query(LeadsModel).filter(LeadsModel.id == lead_id).one()
				if lead and lead.constrains():
					appt_notif_phone, _ = util.get_from_number(db.session, user.company_id, 'APPOINTMENT')
					if not appt_notif_phone:
						raise GraphQLError(
							'Error: Unable to find System User/Phone for the company')
					
					print(f"appt_notif_phone (twilio) = {appt_notif_phone}, user_phone (user) = {lead_phone.phone}")

					timezone = pytz.timezone(appointment_timezone)
					utc_start_date = start_date.replace(tzinfo=pytz.UTC)
					local_start_date = utc_start_date.astimezone(timezone)
					text_start_date = local_start_date.strftime("%A, %B %d, %Y")
					text_start_time = local_start_date.strftime("%I:%M %p")
					
					content = f"""Your appointment at {user.company.name} is booked on {text_start_date} at {text_start_time}  {local_start_date.tzname()}. 
Reply C to Confirm, R to Reschedule, D to Decline, STOP to opt out. 
Location: {util.get_formatted_address(user.company)}"""

					message_sid = send_sms(from_number=appt_notif_phone, to_number=lead_phone.phone, message_body=content)
					if message_sid:
						message = MessageModel(
							system_user_id=None, lead_id=lead_id, user_id=user.id, direction="TO_LEAD",
							date_sent=datetime.utcnow(), content=content, message_sid=message_sid
						)
						db.session.add(message)
						db.session.commit()
					else:
						raise GraphQLError("Error occured while messaging lead")
				else:
					raise GraphQLError("Error: Lead Not found/Cannot message lead")

			if lead_email or lead_phone:
				appointment = AppointmentModel(
					start_datetime=start_date, end_datetime=end_date, uid=_uuid, description=description,
					location=user.company.address, sequence=0, status='CONFIRMED', summary=summary,
					appointment_status="SCHEDULED", lead_id=lead_id, user_id=user.id,
					lead_email=lead_email.email if lead_email else None, timezone=appointment_timezone,
					lead_phone=lead_phone.phone if lead_phone else None, company_id=user.company_id,
					discussed_voi_id=discussed_voi_id
				)
				appointment_history = AppointmentHistory(
					start_datetime=start_date, end_datetime=end_date, uid=_uuid, description=description,
					location=user.company.address, sequence=0, status='CONFIRMED', summary=summary,
					appointment_status="SCHEDULED", lead_id=lead_id, user_id=user.id,
					lead_email=lead_email.email if lead_email else None, timezone=appointment_timezone,
					lead_phone=lead_phone.phone if lead_phone else None, company_id=user.company_id,
					discussed_voi_id=discussed_voi_id
				)
				db.session.add(appointment_history)
				db.session.add(appointment)
				db.session.commit()

				lead = db.session.query(LeadsModel).filter(LeadsModel.id == lead_id).first()
				util.update_lead_status(lead, lead_activity = 'CREATE_APPOINTMENT')
				
				return CreateAppointment(appointment=appointment, ok=True)
			else:
				return CreateAppointment(ok=False)

class UpdateAppointment(graphene.Mutation):
	class Arguments:
		appointment_id = Int(required=True)
		start_date = DateTime(required=True)
		end_date = DateTime(required=True)
		summary = String(required=True)
		appointment_timezone = String(required=True)
		description = String()
		appointment_status = String()
		discussed_voi_id = Int()

	appointment = Field(lambda: Appointment)
	ok = Boolean()

	def mutate(self, info, appointment_id, start_date, end_date, summary, appointment_timezone, description=None, appointment_status=None, discussed_voi_id=None):
			ok = False
			user = info.context.user
			#appointment = db.session.query(AppointmentModel).filter(AppointmentModel.id == appointment_id).first()
			#if not appointment:
				#raise GraphQLError("Error: Appointment wasn't scheduled")
			_appointment = db.session.query(AppointmentModel).filter(
				AppointmentModel.id == appointment_id, AppointmentModel.appointment_status.notin_(["CANCELLED", "NO_SHOWED"])
			).first()
			if not _appointment:
				raise GraphQLError("Error: Appointment wasn't scheduled")
			
			old_status = _appointment.appointment_status.value
			timezone = pytz.timezone(appointment_timezone)
			utc_start_date = start_date.replace(tzinfo=pytz.UTC)
			local_start_date = utc_start_date.astimezone(timezone)
			text_start_date = local_start_date.strftime("%A, %B %d, %Y")
			text_start_time = local_start_date.strftime("%I:%M %p")

			if appointment_status is None:
				appointments = db.session.query(AppointmentModel).filter(
					AppointmentModel.lead_id == _appointment.lead_id,
					AppointmentModel.end_datetime > datetime.utcnow(),
					AppointmentModel.appointment_status != "CANCELLED"
				).all()
			
				if len(appointments) > 1:
					raise GraphQLError("Error: More then two appointment schedule for a single lead")

				if appointments:
					appointment = appointments[0]
				else:
					appointment = _appointment
					# raise GraphQLError("Error: This Appointment has become a inactive appointment so you can't reschedule it. ")

				if start_date <= datetime.utcnow():
					raise GraphQLError("Error: Can't schedule appointment in past")
					
				ical = generate_ical(appointment.uid, start_date, end_date, f'{user.first_name} {user.last_name}', user.email if user.email else "", appointment.lead_email if appointment.lead_email else "", util.get_formatted_address(user.company), description, sequence=appointment.sequence+1, summary=summary)

				if appointment.lead_email:
					send_appointment_email(appointment.lead_email, summary, ical)
				if user.email:
					send_appointment_email(user.email, summary, ical)

				content = f"""Your appointment at {user.company.name} is rescheduled to {text_start_date} at {text_start_time} {local_start_date.tzname()}. 
Reply C to Confirm, R to Reschedule, D to Decline, STOP to opt out.
Location: {util.get_formatted_address(user.company)}"""
				
				if appointment.lead_phone:
					lead = db.session.query(LeadsModel).filter(LeadsModel.id == appointment.lead_id).first()
					if lead and lead.constrains():
						appt_notif_phone, _  = util.get_from_number(db.session, user.company_id, 'APPOINTMENT')
						if not appt_notif_phone:
							raise GraphQLError(
								'Error: Unable to find System User/Phone for the company')
						
						print(f"appt_notif_phone (twilio) = {appt_notif_phone}, user_phone (user) = {appointment.lead_phone}")

						message_sid = send_sms(from_number=appt_notif_phone, to_number=appointment.lead_phone, message_body=content)
						if message_sid:
							message = MessageModel(
								system_user_id=None, lead_id=appointment.lead_id, user_id=user.id, direction="TO_LEAD",
								date_sent=datetime.utcnow(), content=content, message_sid=message_sid
							)
							db.session.add(message)
							db.session.commit()
						else:
							raise GraphQLError("Error occured while messaging lead")
					else:
						raise GraphQLError("Error: Lead Not found/Cannot message lead")
			else:
				appointment = _appointment

			appointment.sequence += 1
			appointment.start_datetime = start_date
			appointment.end_datetime = end_date
			appointment.summary = summary
			appointment.description = description
			appointment.timezone = appointment_timezone
			appointment.appointment_status = appointment_status if appointment_status is not None else "RESCHEDULED"
			appointment.discussed_voi_id = discussed_voi_id
			appointment_history = AppointmentHistory(
				start_datetime=start_date, end_datetime=end_date, uid=appointment.uid, description=description,
				location=user.company.address, sequence=1, summary=summary,
				status=appointment_status if appointment_status is not None else 'CONFIRMED',
				appointment_status=appointment_status if appointment_status is not None else "RESCHEDULED", 
				lead_id=appointment.lead_id, user_id=user.id,
				lead_email=appointment.lead_email, lead_phone=appointment.lead_phone, timezone=appointment_timezone,
				discussed_voi_id=discussed_voi_id
			)
			db.session.add(appointment_history)
			db.session.add(appointment)
			db.session.commit()
			db.session.refresh(appointment)

			if appointment.appointment_status.value in ['SHOWED', 'NO_SHOWED', 'CANCELLED']:
				trigger_nudge_event.stop_scheduler('REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS', user, appointment.lead_id, appointment.id)

			if old_status != 'NO_SHOWED' and appointment.appointment_status.value == 'NO_SHOWED' and appointment.start_datetime < datetime.utcnow():
				content = f"""Reminder: It looks like you were not able to make it to the appointment at {user.company.name} with {user.first_name} {user.last_name} on {text_start_date} at {text_start_time} {local_start_date.tzname()}.  Reply ‘R’ to reschedule and ‘D’ to decline."""

				if appointment.lead_phone:
					lead = db.session.query(LeadsModel).filter(LeadsModel.id == appointment.lead_id).first()
					if lead and lead.constrains():
						appt_notif_phone, _  = util.get_from_number(db.session, user.company_id, 'APPOINTMENT')
						if not appt_notif_phone:
							raise GraphQLError(
								'Error: Unable to find System User/Phone for the company')
						
						print(f"appt_notif_phone (twilio) = {appt_notif_phone}, user_phone (user) = {appointment.lead_phone}")

						message_sid = send_sms(from_number=appt_notif_phone, to_number=appointment.lead_phone, message_body=content)
						if message_sid:
							message = MessageModel(
								system_user_id=None, lead_id=appointment.lead_id, user_id=user.id, direction="TO_LEAD",
								date_sent=datetime.utcnow(), content=content, message_sid=message_sid
							)
							db.session.add(message)
							db.session.commit()
						else:
							raise GraphQLError("Error occured while messaging lead")
					else:
						raise GraphQLError("Error: Lead Not found/Cannot message lead")

			return UpdateAppointment(appointment=appointment, ok=True)

class DeleteAppointment(graphene.Mutation):
	class Arguments:
		appointment_id = Int(required=True)
		appointment_status = String()

	ok = Boolean()

	def mutate(self, info, appointment_id, appointment_status="CANCELLED"):
			ok = False
			user = info.context.user
			#appointment = db.session.query(Appointment).filter(Appointment.id == appointment_id).first()
			#if not appointment:
				#raise GraphQLError('Error: No appointment found')
			_appointment = db.session.query(AppointmentModel).filter(
				AppointmentModel.id == appointment_id, AppointmentModel.appointment_status != "CANCELLED"
			).first()
			if not _appointment:
				raise GraphQLError("Error: Appointment wasn't scheduled")
			appointments = db.session.query(AppointmentModel).filter(
				AppointmentModel.lead_id == _appointment.lead_id, AppointmentModel.end_datetime > datetime.utcnow(),
				AppointmentModel.appointment_status != "CANCELLED"
			).all()
			if len(appointments) > 1:
				raise GraphQLError("Error: More then two appointment schedule for a single lead")
			if appointments:
				appointment = appointments[0]
			else:
				appointment = _appointment
				# raise GraphQLError("Error: This Appointment has become a inactive appointment so you can't delete it.")

			ical = generate_ical(appointment.uid, appointment.start_datetime, appointment.end_datetime, f'{user.first_name} {user.last_name}', user.email if user.email else "" , appointment.lead_email if appointment.lead_email else "", util.get_formatted_address(user.company), appointment.description, sequence=appointment.sequence+1, status='CANCELLED', summary=appointment.summary)

			if appointment.lead_email:
				send_appointment_email(appointment.lead_email, appointment.summary, ical)
			if user.email:
				send_appointment_email(user.email, appointment.summary, ical)

			timezone = pytz.timezone(appointment.timezone)
			utc_start_date = appointment.start_datetime.replace(tzinfo=pytz.UTC)
			local_start_date = utc_start_date.astimezone(timezone)
			text_start_date = local_start_date.strftime("%A, %B %d, %Y")
			text_start_time = local_start_date.strftime("%I:%M %p")
			content = f"Your appointment at {user.company.name} on {text_start_date} at {text_start_time} {local_start_date.tzname()} has been cancelled."

			if appointment.lead_phone:
				lead = db.session.query(LeadsModel).filter(LeadsModel.id == appointment.lead_id).first()
				if lead and lead.constrains():
					appt_notif_phone, _  = util.get_from_number(db.session, user.company_id, 'APPOINTMENT')
					if not appt_notif_phone:
						raise GraphQLError(
							'Error: Unable to find System User/Phone for the company')

					print(f"appt_notif_phone (twilio) = {appt_notif_phone}, user_phone (user) = {appointment.lead_phone}")
					
					message_sid = send_sms(from_number=appt_notif_phone, to_number=appointment.lead_phone, message_body=content)
					if message_sid:
						message = MessageModel(
							system_user_id=None, lead_id=appointment.lead_id, user_id=user.id, direction="TO_LEAD",
							date_sent=datetime.utcnow(), content=content, message_sid=message_sid
						)
						db.session.add(message)
						db.session.commit()
					else:
						raise GraphQLError("Error occured while messaging lead")
				else:
					raise GraphQLError("Error: Lead Not found/Cannot message lead")
			
			appointment.sequence += 1
			appointment.appointment_status = appointment_status
			appointment_history = AppointmentHistory(
				start_datetime=appointment.start_datetime, end_datetime=appointment.end_datetime, uid=appointment.uid,
				description=appointment.description, location=user.company.address, sequence=appointment.sequence+1,
				status=appointment_status, summary=appointment.summary, appointment_status=appointment_status,
				lead_id=appointment.lead_id, user_id=user.id, lead_email=appointment.lead_email,
				lead_phone=appointment.lead_phone, discussed_voi_id=appointment.discussed_voi_id
			)
			db.session.add(appointment_history)
			db.session.add(appointment)
			#db.session.query(Appointment).filter(Appointment.id == appointment_id).delete()
			db.session.commit()
			return DeleteAppointment(ok=True)

class SaveEngagementMessageTemplate(graphene.Mutation):
	class Arguments:
		title = String(required=True)
		message = String(required=True)
		id = Int()
		user_id = Int()
		company_id = Int()
		is_active = Boolean()
		is_company_shared = Boolean()

	status_code = Int()
	message = String()
	engagement_message_template = Field(lambda: EngagementMessageTemplate)

	def mutate(self, info, title, message,company_id=None, user_id=None, id=None, is_active=None, is_company_shared=None):
		try:
			user = db.session.query(UserModel).get(user_id) \
							if (info.context.user.is_admin() or info.context.user.has_permission('is_company_admin')) and user_id \
							else info.context.user
			if user:
				msg = "Template created successfully"
				if id:
					engagement_message_template = db.session.query(EngagementMessageTemplateModel).filter(
											EngagementMessageTemplateModel.id == id).first()
					if not engagement_message_template:
						return SaveEngagementMessageTemplate(status_code=HTTPStatus.NOT_FOUND.value, message="Unable to locate to update engagement message template")
					engagement_message_template.message = message
					engagement_message_template.title = title
					if is_active is not None:
						engagement_message_template.is_active = is_active
					if is_company_shared is not None:
						engagement_message_template.is_company_shared = is_company_shared
					db.session.commit()
					msg = "Template updated successfully"
				else:
					engagement_message_template = EngagementMessageTemplateModel(
													user_id = user.id, company_id = company_id,
													message = message, title = title, 
													is_company_shared=is_company_shared)
					db.session.add(engagement_message_template)
					db.session.commit()
					db.session.refresh(engagement_message_template)
				return SaveEngagementMessageTemplate(
								engagement_message_template=engagement_message_template, 
								status_code=HTTPStatus.OK.value, 
								message = msg)
			else:
				return SaveEngagementMessageTemplate(status_code=HTTPStatus.NOT_FOUND.value, message="Unable to locate user data to add engagement message template")
		except Exception as e:
			traceback.print_exc()
			return SaveEngagementMessageTemplate(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')

class DeleteEngagementMessageTemplate(graphene.Mutation):
	class Arguments:
		id = Int(required=True)
		user_id = Int()

	status_code = Int()
	message = String()

	def mutate(self, info, id, user_id=None):
		try:
			if not (info.context.user.is_admin() or info.context.user.has_permission('is_company_admin')):
				return DeleteEngagementMessageTemplate(status_code=HTTPStatus.UNAUTHORIZED.value, message="You are not authorized to delete the records")

			user = db.session.query(UserModel).get(user_id)
			if user:
				engagement_message_template = db.session.query(EngagementMessageTemplateModel).filter( 
											EngagementMessageTemplateModel.id == id).first()
				if not engagement_message_template:
					return DeleteEngagementMessageTemplate(status_code=HTTPStatus.NOT_FOUND.value, message="Unable to locate to delete engagement message template")

				if engagement_message_template.is_active:
					return DeleteEngagementMessageTemplate(status_code=HTTPStatus.UNAUTHORIZED.value, message="You can not delete the active template, First make inactive template.")
				
				engagement_message_template.is_deleted = True
				db.session.commit()
				return DeleteEngagementMessageTemplate(status_code=HTTPStatus.OK.value, message="Template deleted successfully")
			else:
				return DeleteEngagementMessageTemplate(status_code=HTTPStatus.NOT_FOUND.value, message="Unable to locate user data to remove engagement message template")
				
		except Exception as e:
			traceback.print_exc()
			return DeleteEngagementMessageTemplate(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


########################################
#   INPUT-OBJECT-TYPE Working Hour     #
########################################

class WorkingHourInputs(InputObjectType):
	week_day = String(required=True)
	is_working_day = Boolean(required=True)
	start_time = Time()
	end_time = Time()


####################################
#   Update Exist Working Hours     #
####################################

class UpdateWorkingHours(graphene.Mutation):
	'''
		Mutation Query for update the Working Hour & return the Working Hour object with status code and message
		
		args   : company_id, working_hours
		return : working_hours, status_code, message
	'''
	class Arguments:
		company_id = Int(required=True)
		input_working_hours = List(WorkingHourInputs, required=True)

	status_code = Int()
	message = String()
	working_hours = List(CompanyWorkingHours)

	def mutate(self, info, company_id, input_working_hours):
		try:
			user = info.context.user
			
			if user.is_admin() or user.has_permission('is_company_admin'):
				working_hours = []
				for input_working_hour in input_working_hours:
					start_time = input_working_hour.start_time if input_working_hour.start_time else None
					end_time = input_working_hour.end_time if input_working_hour.end_time else None
					working_hour = db.session.query(CompanyWorkingHoursModel).filter(
										CompanyWorkingHoursModel.week_day == input_working_hour.week_day,
										CompanyWorkingHoursModel.company_id == company_id,
										CompanyWorkingHoursModel.is_active == True, CompanyWorkingHoursModel.is_deleted == False).first()
					if working_hour:
						working_hour.is_working_day = input_working_hour.is_working_day
						working_hour.start_time = start_time
						working_hour.end_time = end_time
					else:
						working_hour = CompanyWorkingHoursModel(company_id = company_id, week_day = input_working_hour.week_day, 
													is_working_day = input_working_hour.is_working_day, start_time = start_time, end_time = end_time)
						db.session.add(working_hour)
					
					db.session.commit()
					db.session.refresh(working_hour)
					working_hours.append(working_hour)
				
				return UpdateWorkingHours(working_hours = working_hours, status_code=HTTPStatus.OK.value, message='Working hour updated successfully')
			else:
				return UpdateWorkingHours(status_code=HTTPStatus.UNAUTHORIZED.value, message="You are not authorized to update the record")
		except SQLAlchemyError as e:
			error = str(e.__dict__['orig'])
			return UpdateWorkingHours(status_code=HTTPStatus.BAD_REQUEST.value, message = error)
		except Exception:
			traceback.print_exc()
			return UpdateWorkingHours(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


#########################################
#   Create New Twilio Phone Service     #
#########################################

class CreateTwilioPhoneService(graphene.Mutation):
	'''
		Mutation Query for create new Twilio Phone Service & return the Twilio Phone Service object with status code and message
		
		args   : Twilio Phone Service Data
		return : twilio_phone_service, status_code, message
	'''
	class Arguments:
		company_id = Int(required=True)
		phone = String(required=True)
		phone_service_type = String(required=True)
		service_name = String(required=True)
		description = String()

	status_code = Int()
	message = String()
	twilio_phone_service = Field(lambda: TwilioPhoneService)

	def mutate(self, info, company_id, phone, phone_service_type, service_name, description=None):
		try:
			user = info.context.user
			if user.is_admin():
				lookup_type = look_up_phone_type(phone)
				if lookup_type in [None, 'Invalid']:
					return CreateTwilioPhoneService(
						status_code=HTTPStatus.BAD_REQUEST.value, message='Invalid Phone Lookup')

				if db.session.query(UserModel).filter(UserModel.phone == phone).first():
					return CreateTwilioPhoneService(
						status_code=HTTPStatus.SEE_OTHER.value,
						message="This phone number is already mapped to another Phone Bot")
				
				company_phone_bots = db.session.query(UserModel).filter(
								UserModel.company_id == company_id, 
								UserModel.first_name == "Otto",
								UserModel.last_name == "").count()

				email = f'smaibot_{company_id}_{company_phone_bots if company_phone_bots else 0}@socialminingai.com'

				user = UserModel(email=email, first_name="Otto", last_name="", company_id=company_id, phone=phone)
				db.session.add(user)
				db.session.commit()
				db.session.refresh(user)

				twilio_phone_service = TwilioPhoneServiceModel(
					company_id=company_id, user_id=user.id, type=phone_service_type, service_name=service_name,
					description=description)
				db.session.add(twilio_phone_service)
				db.session.commit()
				return CreateTwilioPhoneService(
					twilio_phone_service=twilio_phone_service, status_code=HTTPStatus.OK.value,
					message='TwilioPhoneService created successfully')
			else:
				return CreateTwilioPhoneService(
					status_code=HTTPStatus.UNAUTHORIZED.value, message="You are not authorized to add the record")

		except Exception as e:
			db.session.rollback()
			if user:
				db.session.query(UserModel).filter(UserModel.id == user.id).delete()
				db.session.commit()
			traceback.print_exc()
			return CreateTwilioPhoneService(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


#####################################
#   Update Twilio Phone Service     #
#####################################

class UpdateTwilioPhoneService(graphene.Mutation):
	'''
		Mutation Query for Update new Twilio Phone Service & return the Twilio Phone Service object with status code and message
		
		args   : Twilio Phone Service Data
		return : twilio_phone_service, status_code, message
	'''
	class Arguments:
		twilio_phone_service_id = Int(required=True)
		phone = String(required=True)
		phone_service_type = String(required=True)
		service_name = String(required=True)
		description = String()
		is_active = Boolean()

	status_code = Int()
	message = String()
	twilio_phone_service = Field(lambda: TwilioPhoneService)

	def mutate(self, info, twilio_phone_service_id, phone, phone_service_type, service_name, description=None, is_active=None):
		try:
			user = info.context.user
			if user.is_admin():
				lookup_type = look_up_phone_type(phone)
				if lookup_type in [None, 'Invalid']:
					return UpdateTwilioPhoneService(
						status_code=HTTPStatus.BAD_REQUEST.value,
						message='Invalid Phone Lookup')

				twilio_phone_service = db.session.query(TwilioPhoneServiceModel)\
					.filter(TwilioPhoneServiceModel.id == twilio_phone_service_id)\
					.first()
				if not twilio_phone_service:
					return UpdateTwilioPhoneService(
						status_code=HTTPStatus.NOT_FOUND.value,
						message="Unable to locate twilio phone service data to update")

				phone_bot_user = db.session.query(UserModel) \
					.join(TwilioPhoneServiceModel, TwilioPhoneServiceModel.user_id == UserModel.id) \
					.filter(UserModel.phone == phone, TwilioPhoneServiceModel.id != twilio_phone_service.id) \
					.first()
				if phone_bot_user:
					return UpdateTwilioPhoneService(
						status_code=HTTPStatus.SEE_OTHER.value,
						message="This phone number is already mapped with another Phone Bot")
				
				bot_user = db.session.query(UserModel).filter(
								UserModel.id == twilio_phone_service.user_id).first()

				bot_user.phone = phone
				if is_active is not None:
					twilio_phone_service.is_active = is_active
				twilio_phone_service.type = phone_service_type
				twilio_phone_service.service_name = service_name
				twilio_phone_service.description = description
				db.session.commit()
				return UpdateTwilioPhoneService(
					twilio_phone_service=twilio_phone_service, status_code=HTTPStatus.OK.value,
					message='Twilio Phone Service updated successfully')
			else:
				return UpdateTwilioPhoneService(
					status_code=HTTPStatus.UNAUTHORIZED.value, message="You are not authorized to update the record")

		except Exception as e:
			db.session.rollback()
			traceback.print_exc()
			return UpdateTwilioPhoneService(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


#####################################
#   Delete Twilio Phone Service     #
#####################################

class DeleteTwilioPhoneService(graphene.Mutation):
	class Arguments:
		twilio_phone_service_id = Int(required=True)

	status_code = Int()
	message = String()

	def mutate(self, info, twilio_phone_service_id):
		try:
			user = info.context.user
			if user.is_admin():
				twilio_phone_service = db.session.query(TwilioPhoneServiceModel)\
					.filter(TwilioPhoneServiceModel.id == twilio_phone_service_id)\
					.first()
				if twilio_phone_service:
					twilio_phone_service.is_deleted = True
					db.session.commit()
				else:
					return DeleteTwilioPhoneService(
						status_code=HTTPStatus.NOT_FOUND.value,
						message="Unable to locate TwilioPhoneService data to delete")
				
				return DeleteTwilioPhoneService(
					status_code=HTTPStatus.OK.value, message="TwilioPhoneService deleted successfully")
			else:
				return DeleteTwilioPhoneService(
					status_code=HTTPStatus.UNAUTHORIZED.value, message="You are not authorized to add the record")
		except Exception as e:
			traceback.print_exc()
			return DeleteTwilioPhoneService(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')


class SaveLeadNote(graphene.Mutation):
	class Arguments:
		lead_id = Int()
		note = String(required=True)
		
	status_code = Int()
	message = String()
	lead_note = Field(lambda: LeadNotes)

	def mutate(self, info, lead_id, note):
		try:
			lead_note = db.session.query(LeadNotesModel).filter(
											LeadNotesModel.lead_id == lead_id).first()
			if lead_note:
				lead_note.note = note
				db.session.commit()
				return SaveLeadNote(status_code=HTTPStatus.OK.value, message='Lead Note updated successfully')
			else:
				lead_note = LeadNotesModel(lead_id=lead_id, note=note)
				db.session.add(lead_note)
				db.session.commit()
				db.session.refresh(lead_note)
				return SaveLeadNote(status_code=HTTPStatus.OK.value, message='Lead Note created successfully')

		except Exception as e:
			traceback.print_exc()
			return SaveLeadNote(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')

class RescheduleAppointment(graphene.Mutation):
	class Arguments:
		appointment_id = Int(required=True)
		start_date = DateTime(required=True)
		end_date = DateTime(required=True)
		appointment_timezone = String(required=True)

	appointment = Field(lambda: Appointment)
	status_code = Int()
	message = String()

	def mutate(self, info, appointment_id, start_date, end_date, appointment_timezone):
		try:
			appointment = db.session.query(AppointmentModel).filter(AppointmentModel.id == appointment_id).first()
			if not appointment:
				return RescheduleAppointment(status_code=HTTPStatus.NOT_FOUND.value, message="Appointment wasn't scheduled")

			if appointment.appointment_status.value in ["CANCELLED", "NO_SHOWED"]:
				return RescheduleAppointment(status_code=HTTPStatus.NOT_FOUND.value, message='Appointment is cancelled')
			
			appointments = db.session.query(AppointmentModel).filter(
					AppointmentModel.id != appointment.id,
					AppointmentModel.lead_id == appointment.lead_id,
					AppointmentModel.end_datetime > datetime.utcnow(),
					AppointmentModel.appointment_status != "CANCELLED"
				).all()

			if len(appointments) > 1:
				return RescheduleAppointment(status_code=HTTPStatus.NOT_FOUND.value, message='More then two appointment schedule for a single lead')

			if appointments:
				appointment = appointments[0]
			# else:
			# 	appointment = _appointment
				# return RescheduleAppointment(status_code=HTTPStatus.NOT_FOUND.value, message="This Appointment has become a inactive appointment so you can't reschedule it.")

			if start_date <= datetime.utcnow():
				return RescheduleAppointment(status_code=HTTPStatus.NOT_FOUND.value, message="Can't schedule appointment in past")
					
			timezone = pytz.timezone(appointment_timezone)
			utc_start_date = start_date.replace(tzinfo=pytz.UTC)
			local_start_date = utc_start_date.astimezone(timezone)
			text_start_date = local_start_date.strftime("%A, %B %d, %Y")
			text_start_time = local_start_date.strftime("%I:%M %p")

			user = appointment.user
			lead = appointment.lead

			lead_content = f"""Your appointment at {user.company.name} has been rescheduled to {text_start_date} at {text_start_time} {local_start_date.tzname()}. 
Reply C to Confirm, R to Reschedule, D to Decline, STOP to opt out.
Location: {util.get_formatted_address(user.company)}"""
			
			sp_content = f"""{lead.first_name} {lead.last_name} has rescheduled their appointment to {text_start_time} on {text_start_date} {local_start_date.tzname()}. Login to the SMAI platform at  https://app.funnelai.co to engage with the lead from the Activity Center."""

			if appointment.lead_phone and lead and lead.constrains():
				appt_notif_phone, _  = util.get_from_number(db.session, user.company_id, 'APPOINTMENT')
				if not appt_notif_phone:
					return RescheduleAppointment(status_code=HTTPStatus.NOT_FOUND.value, message="Unable to find System User/Phone for the company")
					
				print(f"appt_notif_phone (twilio) = {appt_notif_phone}, user_phone (user) = {appointment.lead_phone}")

				message_sid = send_sms(from_number=appt_notif_phone, to_number=appointment.lead_phone, message_body=lead_content)
				if message_sid:
					message = MessageModel(
						system_user_id=None, lead_id=appointment.lead_id, user_id=user.id, direction="TO_LEAD",
						date_sent=datetime.utcnow(), content=lead_content, message_sid=message_sid
					)
					db.session.add(message)
					db.session.commit()
					
					message_sid = send_sms(from_number=appt_notif_phone, to_number=user.phone, message_body=sp_content)
					if not message_sid:
						return RescheduleAppointment(status_code=HTTPStatus.NOT_FOUND.value, message="Error occured while messaging salesperson")
				else:
					return RescheduleAppointment(status_code=HTTPStatus.NOT_FOUND.value, message="Error occured while messaging lead")
				
			ical = generate_ical(appointment.uid, start_date, end_date, f'{user.first_name} {user.last_name}', user.email if user.email else "", appointment.lead_email if appointment.lead_email else "", util.get_formatted_address(user.company), "", sequence=appointment.sequence+1, summary="")

			if appointment.lead_email:
				send_appointment_email(appointment.lead_email, "", ical)
			if user.email:
				send_appointment_email(user.email, "", ical)

			appointment.sequence += 1
			appointment.start_datetime = start_date
			appointment.end_datetime = end_date
			appointment.timezone = appointment_timezone
			appointment.appointment_status = "RESCHEDULED"
			appointment_history = AppointmentHistory(
				start_datetime=start_date, end_datetime=end_date, uid=appointment.uid,
				location=appointment.location, sequence=1, status='CONFIRMED', appointment_status="RESCHEDULED", 
				lead_id=appointment.lead_id, user_id=appointment.user_id, lead_email=appointment.lead_email, 
				lead_phone=appointment.lead_phone, timezone=appointment_timezone
			)
			db.session.add(appointment_history)
			db.session.add(appointment)
			db.session.commit()
			db.session.refresh(appointment)

			return RescheduleAppointment(appointment=appointment, status_code=HTTPStatus.OK.value, message='Rescheduled appointment')
		except Exception:
			traceback.print_exc()
			return RescheduleAppointment(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')



###########################
#   Create FCM Device     #
###########################

class CreateFcmDevice(graphene.Mutation):
	class Arguments:
		registration_id = String(required=True)
		
	status_code = Int()
	message = String()

	def mutate(self, info, registration_id):
		try:
			user = info.context.user
			fcm_device = db.session.query(FCMDeviceModel) \
								.filter(FCMDeviceModel.user_id == user.id, FCMDeviceModel.registration_id == registration_id).first()
			if not fcm_device:
				fcm_device = FCMDeviceModel(
									registration_id=registration_id, 
									user_id=user.id, type="WEB")
				db.session.add(fcm_device)
				db.session.commit()
			return CreateFcmDevice(status_code=HTTPStatus.OK.value, message='Added FCM Device')

		except Exception as e:
			traceback.print_exc()
			return CreateFcmDevice(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')

###########################
#   Delete FCM Device     #
###########################

class DeleteFcmDevice(graphene.Mutation):
	class Arguments:
		registration_id = String(required=True)
		
	status_code = Int()
	message = String()

	def mutate(self, info, registration_id):
		try:
			user = info.context.user
			db.session.query(FCMDeviceModel) \
								.filter(FCMDeviceModel.user_id == user.id, 
											FCMDeviceModel.registration_id == registration_id).delete()
			db.session.commit()
			return DeleteFcmDevice(status_code=HTTPStatus.OK.value, message='Removed FCM Device')

		except Exception as e:
			traceback.print_exc()
			return DeleteFcmDevice(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')



###############################################
#   INPUT-OBJECT-TYPE Company Nudge Event     #
###############################################

class CompanyNudgeEventInputs(InputObjectType):
	nudge_event_id = Int(required=True)
	start_delay = Int(required=True)
	start_delay_type = String(required=True)
	frequency = Int(required=True)
	frequency_type = String(required=True)
	first_template_text = String(required=True)
	reminder_template_text = String(required=True)
	is_sms = Boolean(required=True)
	is_web_push = Boolean(required=True)
	is_active = Boolean(required=True)


####################################
#   Update Company Nudge Event     #
####################################

class UpdateCompanyNudgeEvent(graphene.Mutation):
	'''
		Mutation Query for update the Company Nudge Event & return the Company Nudge Event object with status code and message
		
		args   : company_id, company_nudge_events
		return : company_nudge_events, status_code, message
	'''
	class Arguments:
		company_id = Int(required=True)
		company_nudge_event_inputs = List(CompanyNudgeEventInputs, required=True)

	status_code = Int()
	message = String()
	company_nudge_events = List(CompanyNudgeEvents)

	def mutate(self, info, company_id, company_nudge_event_inputs):
		try:
			user = info.context.user
			
			if user.is_admin() or user.has_permission('is_company_admin'):
				company_nudge_events = []
				for company_nudge_event_input in company_nudge_event_inputs:
					company_nudge_event = db.session.query(CompanyNudgeEventModel).filter(
										CompanyNudgeEventModel.nudge_event_id == company_nudge_event_input.nudge_event_id,
										CompanyNudgeEventModel.company_id == company_id).first()
					if company_nudge_event:
						company_nudge_event.start_delay = company_nudge_event_input.start_delay
						company_nudge_event.start_delay_type = company_nudge_event_input.start_delay_type
						company_nudge_event.frequency = company_nudge_event_input.frequency 
						company_nudge_event.frequency_type = company_nudge_event_input.frequency_type  
						company_nudge_event.first_template_text = company_nudge_event_input.first_template_text  
						company_nudge_event.reminder_template_text = company_nudge_event_input.reminder_template_text  
						company_nudge_event.is_sms = company_nudge_event_input.is_sms  
						company_nudge_event.is_web_push = company_nudge_event_input.is_web_push  
						company_nudge_event.is_active = company_nudge_event_input.is_active  
					else:
						company_nudge_event = CompanyNudgeEventModel(
														nudge_event_id = company_nudge_event_input.nudge_event_id,
														company_id = company_id,
														start_delay = company_nudge_event_input.start_delay,
														start_delay_type = company_nudge_event_input.start_delay_type,
														frequency = company_nudge_event_input.frequency,
														frequency_type = company_nudge_event_input.frequency_type,
														first_template_text = company_nudge_event_input.first_template_text,
														reminder_template_text = company_nudge_event_input.reminder_template_text,
														is_sms = company_nudge_event_input.is_sms,
														is_web_push = company_nudge_event_input.is_web_push,
														is_active = company_nudge_event_input.is_active
													)
						
					db.session.add(company_nudge_event)
					db.session.commit()
					db.session.refresh(company_nudge_event)
					company_nudge_events.append(
									CompanyNudgeEvents(
										nudge_event=company_nudge_event.nudge_event, 
										company_nudge_event=company_nudge_event
									))
				
				return UpdateCompanyNudgeEvent(company_nudge_events = company_nudge_events, status_code=HTTPStatus.OK.value, message='Company nudge event updated successfully')
			else:
				return UpdateCompanyNudgeEvent(status_code=HTTPStatus.UNAUTHORIZED.value, message="You are not authorized to update the record")
		except SQLAlchemyError as e:
			error = str(e.__dict__['orig'])
			return UpdateCompanyNudgeEvent(status_code=HTTPStatus.BAD_REQUEST.value, message = error)
		except Exception:
			traceback.print_exc()
			return UpdateCompanyNudgeEvent(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')



####################################
#   Create Review Nudge Event      #
# 		Akash 03-12-2021		   #
####################################

class CreateReview(graphene.Mutation):
	class Arguments:
		email = String(required=True)
		head = String(required=True)
		body = String(required=True)
		company = Int(required=True)
		_type = String()

	ok = Boolean()

	def mutate(self, info, email, head, body, company, _type=None):
		print('1')
		try:
			review = Review(email=email, head=head, body=body, company=company, _type=_type)
			db.session.add(review)
			db.session.commit()
			return CreateReview(ok=True)
		except Exception as e:
			traceback.print_exc()
			return CreateReview(ok=False)
			# return CreateReview(status_code=HTTPStatus.BAD_REQUEST.value, message='Something went wrong')
			# raise GraphQLError(
			# 	'Error occurred while creating user. Please try again.')

############################################
#   Create Review Message Nudge Event      #
# 			Akash 03-12-2021		   	   #
############################################
# class CreateReviewMessage(graphene.Mutation):
# 	class Arguments:
# 		to = String(required=True)
# 		body = String(required=True)

# 	status_code = Int()
# 	message= String()

# 	def mutate(self, info, to, body):
# 		try:
# 			# user = info.context.user
# 			# activity_center_phone, _  = util.get_from_number(db.session, 1, 'ACTIVITY_CENTER')
# 			message_sid = send_sms(from_number="+1 (512) 361-5571", to_number=to, message_body=body)
# 			return CreateReviewMessage(status_code=HTTPStatus.OK.value, message="Sent message")
# 		except Exception as e:
# 			print(e)
# 			return CreateReviewMessage(status_code=HTTPStatus.BAD_REQUEST.value, message="Error sending review message.")



class CreateMmsMessage(graphene.Mutation):
	class Arguments:
		system_user_id = Int()
		lead_id = Int(required=True)
		user_id = Int(required=True)
		channel_id = Int()
		campaign_id = Int()
		campaign_template_id = Int()
		direction = String()
		content = String(required=True)
		to_phone = String(required=True)
		image_url = String(required=True)

	status_code = Int()
	message = String()
	lead_message = Field(lambda: Message)

	def mutate(self, info, lead_id, user_id, content, to_phone, image_url, campaign_id=None, campaign_template_id=None,
				system_user_id=None, channel_id=None, direction=None):
		user = info.context.user
		lead = db.session.query(LeadsModel).filter(LeadsModel.id == lead_id).first()
		if lead and lead.constrains():
			# if lead.disable_conversation:
			#     return CreateMessage(status_code=HTTPStatus.NOT_ACCEPTABLE.value, message="Disable the conversation for that lead, Please enable it and then send the message")

			activity_center_phone, _  = util.get_from_number(db.session, user.company_id, 'ACTIVITY_CENTER')
			if not activity_center_phone:
				return CreateMessage(status_code=HTTPStatus.NOT_FOUND.value, message="Unable to find System User/Phone for the company")

			print(f"activity_center_phone (twilio) = {activity_center_phone}, user_phone (user) = {to_phone}")

			if not direction:
				direction = 'TO_LEAD'
			if channel_id:
				channel = db.session.query(ChannelModel).filter(ChannelModel.id == channel_id).first()
				if channel and channel.name == "Text" and channel.channel_type == "SMS":
					message_sid = send_mms(from_number=activity_center_phone, to_number=to_phone, message_body=content, image_url=image_url)
			else:
				message_sid = send_mms(from_number=activity_center_phone, to_number=to_phone, message_body=content, image_url=image_url)
			if message_sid:
				last_message = db.session.query(MessageModel).filter(MessageModel.lead_id == lead_id, MessageModel.date_sent != None, MessageModel.user_id == None).order_by(MessageModel.id.desc()).first()
				if last_message:
					campaign_id = last_message.campaign_id
				else:
					default_campaign = db.session.query(CampaignModel) \
							.join(CampaignTypes) \
							.filter(CampaignTypes.type == CampaignManageType.DEFAULT, CampaignModel.company_id == user.company_id) \
							.first()
					campaign_id = default_campaign.id if default_campaign else None
					
				date_sent = datetime.utcnow()
				lead_message = MessageModel(
					system_user_id=system_user_id, lead_id=lead_id, user_id=user_id, channel_id=channel_id,
					campaign_id=campaign_id, campaign_template_id=campaign_template_id, direction=direction,
					date_sent=date_sent, content=content, message_sid=message_sid
				)
				db.session.add(lead_message)
				db.session.commit()
				db.session.refresh(lead_message)

				# socketio_obj.trigger('received_message', {
                #             "lead_id": lead_id, "user_id": user_id, 
                #             "message": f"You have received new message from {lead.full_name}"
                #         })

				util.update_lead_status(lead, lead_activity = 'SENT_MESSAGE')

				trigger_nudge_event.stop_scheduler('REMINDER_SP_LEAD_MESSAGE', user, lead_id, lead_message.id)

				camp_lead_sum = db.session.query(CampaignLeadSummaryModel).filter(
					CampaignLeadSummaryModel.campaign_id == campaign_id,
					CampaignLeadSummaryModel.lead_id == lead_id
				).first()
				if not camp_lead_sum:
					camp_lead_sum = CampaignLeadSummaryModel(
												campaign_id = campaign_id, lead_id = lead_id, 
												status = "SENT", last_message_sent_date = date_sent, 
												last_message_received_date = None, num_attempts_before_response = 1)
					db.session.add(camp_lead_sum)
					db.session.commit()
					db.session.refresh(camp_lead_sum)
				else:
					camp_lead_sum.last_message_sent_date = date_sent
					
					if camp_lead_sum.status not in ['RESPONDED', 'ENGAGED']:
						if camp_lead_sum.num_attempts_before_response:
							camp_lead_sum.num_attempts_before_response += 1
						else:
							camp_lead_sum.num_attempts_before_response = 1

					if camp_lead_sum.status in ['UNCONTACTED', 'QUEUED']:
						camp_lead_sum.status = 'SENT'
					
					db.session.add(camp_lead_sum)
					db.session.commit()
				return CreateMessage(lead_message=lead_message, status_code=HTTPStatus.OK.value, message="Sent message")
			else:
				return CreateMessage(status_code=HTTPStatus.BAD_REQUEST.value, message="Error sending message to lead")
		else:
			return CreateMessage(status_code=HTTPStatus.BAD_REQUEST.value, message="Lead Has Opted out of Messaging or 180 days have from the last received message/first sent message")



class Mutation(ObjectType):
	create_user = CreateUser.Field()
	create_usage_event = CreateUsageEvent.Field()
	create_company = CreateCompany.Field()
	update_company = UpdateCompany.Field()
	update_user_filters = UpdateUserFilters.Field()
	prospect_action = ProspectAction.Field()
	save_user_filter_set = SaveUserFilterSet.Field()
	update_user_filter_set = UpdateUserFilterSet.Field()
	select_filter_set = SelectFilterSet.Field()
	save_filter_type = SaveFilterType.Field()
	delete_filter_type = DeleteFilterType.Field()
	save_selection_option = SaveSelectionOption.Field()
	remove_selection_option = RemoveSelectionOption.Field()
	save_company_filters = SaveCompanyFilters.Field()
	update_deal = UpdateDeal.Field()
	add_deal_comment = AddConversationEntryComment.Field()
	save_response_template = SaveResponseTemplate.Field()
	delete_response_template = DeleteResponseTemplate.Field()
	update_user_disabled_status = UpdateUserDisabledStatus.Field()
	update_user_disabled_company_status = UpdateUserDisabledCompanyStatus.Field()
	create_team = CreateTeam.Field()
	update_team = UpdateTeam.Field()
	delete_team = DeleteTeam.Field()
	update_user = UpdateUser.Field()
	update_user_default_company=UpdateUserDefaultCompany.Field()
	create_role = CreateRole.Field()
	add_company_reference=AddCompanyReference.Field()
	add_user_accounts=AddUserAccounts.Field()
	edit_role = EditRole.Field()
	delete_role = DeleteRole.Field()
	add_screen_name = AddScreenName.Field()
	create_crm_integration = CreateCrmIntegration.Field()
	delete_crm_integration = DeleteCrmIntegration.Field()
	update_deal_subscription = UpdateDealSubscription.Field()
	save_sent_conversation = SaveConversationSent.Field()
	push_deal_to_crm = PushDealToCrm.Field()
	submit_support_ticket = SubmitSupportTicket.Field()
	save_notification_config = SaveNotificationConfig.Field()
	resend_invite = ResendInvite.Field()
	update_notification = UpdateNotification.Field()
	create_export_config = CreateExportConfig.Field()
	update_export_config = UpdateExportConfig.Field()
	delete_export_config = DeleteExportConfig.Field()
	delete_export = DeleteExport.Field()
	download_export_file = DownloadExportFile.Field()
	update_prediction = UpdatePrediction.Field()

	# Message Mutation
	create_message = CreateMessage.Field()
	create_mms_message = CreateMmsMessage.Field()
	create_message_log = CreateMessageLog.Field()
	create_channel = CreateChannel.Field()
	update_channel = UpdateChannel.Field()
	delete_channel = DeleteChannel.Field()

	# Lead Mutation
	create_lead = CreateLead.Field()
	update_lead = UpdateLead.Field()
	delete_lead = DeleteLead.Field()
	create_lead_email = CreateLeadEmail.Field()
	update_lead_email = UpdateLeadEmail.Field()
	delete_lead_email = DeleteLeadEmail.Field()
	create_lead_phone = CreateLeadPhone.Field()
	update_lead_phone = UpdateLeadPhone.Field()
	delete_lead_phone = DeleteLeadPhone.Field()
	create_lead_address = CreateLeadAddress.Field()
	update_lead_address = UpdateLeadAddress.Field()
	delete_lead_address = DeleteLeadAddress.Field()
	create_lead_vehicle_of_interest = CreateLeadVehicleOfInterest.Field()
	update_lead_vehicle_of_interest = UpdateLeadVehicleOfInterest.Field()
	delete_lead_vehicle_of_interest = DeleteLeadVehicleOfInterest.Field()
	create_lead_vehicle_of_interests = CreateLeadVehicleOfInterests.Field()
	update_lead_consent_status = UpdateLeadConsentStatus.Field()
	enable_disable_lead_conversation = EnableDisableLeadConversation.Field()

	# Campaign Mutation
	create_campaign = CreateCampaign.Field()
	update_campaign = UpdateCampaign.Field()
	clone_campaign = CloneCampaign.Field()
	delete_campaign = DeleteCampaign.Field()
	update_campaign_schedules = UpdateCampaignSchedules.Field()
	create_campaign_templates = CreateCampaignTemplates.Field()
	update_campaign_template = UpdateCampaignTemplate.Field()
	delete_campaign_template = DeleteCampaignTemplate.Field()
	delete_campaign_schedule = DeleteCampaignSchedule.Field()
	update_campaign_schedule_templates = UpdateCampaignScheduleTemplates.Field()
	update_campaign_schedules_sortOrder = UpdateCampaignSchedulesSortOrder.Field()
	create_campaign_selections=CreateCampaignSelections.Field()
	create_campaign_schedule=CreateCampaignSchedule.Field()
	create_campaign_lead_summary=CreateCampaignLeadSummary.Field()
	
	# Person Mutation
	create_person = CreatePerson.Field()
	create_person_user_account = CreatePersonUserAccount.Field()
	create_person_address = person.CreatePersonAddress.Field()
	create_person_email = person.CreatePersonEmail.Field()
	create_person_source = person.CreatePersonSource.Field()
	create_person_image = person.CreatePersonImage.Field()
	create_person_phone_number = person.CreatePersonPhoneNumber.Field()
	create_person_experience = person.CreatePersonExperience.Field()
	create_person_education = person.CreatePersonEducation.Field()
	create_person_possession = person.CreatePersonPossession.Field()
	create_vehicle_detail = person.CreateVehicleDetail.Field()
	create_estate_detail = person.CreateEstateDetail.Field()
	create_person_skill = person.CreatePersonSkill.Field()
	create_person_language = person.CreatePersonLanguage.Field()
	create_person_interest = person.CreatePersonInterest.Field()
	create_person_accomplishment = person.CreatePersonAccomplishment.Field()
	create_person_license_certificate = person.CreatePersonLicenseCertificate.Field()
	create_person_volunteering = person.CreatePersonVolunteering.Field()
	create_person_publication = person.CreatePersonPublication.Field()
	create_person_award = person.CreatePersonAward.Field()

	update_person = UpdatePerson.Field()
	update_person_address = person.UpdatePersonAddress.Field()
	update_person_email = person.UpdatePersonEmail.Field()
	update_person_source = person.UpdatePersonSource.Field()

	update_person_image = person.UpdatePersonImage.Field()
	update_person_phone_number = person.UpdatePersonPhoneNumber.Field()
	update_person_experience = person.UpdatePersonExperience.Field()
	update_person_education = person.UpdatePersonEducation.Field()
	update_person_possession = person.UpdatePersonPossession.Field()

	update_person_vehicle_detail = person.UpdateVehicleDetail.Field()
	update_person_estate_detail = person.UpdateEstateDetail.Field()
	update_person_skill = person.UpdatePersonSkill.Field()
	update_person_interest = person.UpdatePersonInterest.Field()
	update_person_accomplishment = person.UpdatePersonAccomplishment.Field()

	update_person_license_certificate = person.UpdatePersonLicenseCertificate.Field()
	update_person_volunteering = person.UpdatePersonVolunteering.Field()
	update_person_publication = person.UpdatePersonPublication.Field()
	update_person_award = person.UpdatePersonAward.Field()
	update_person_language = person.UpdatePersonLanguage.Field()

	remove_person_phone_number = person.RemovePersonPhoneNumber.Field()
	remove_person_email = person.RemovePersonEmail.Field()
	# remove_person_source = person.RemovePersonSource.Field()
	remove_person_image = person.RemovePersonImage.Field()
	remove_person_experience = person.RemovePersonExperience.Field()
	remove_person_education = person.RemovePersonEducation.Field()
	remove_person_possession = person.RemovePersonPossession.Field()
	# remove_vehicle_detail = person.RemoveVehicleDetail.Field()
	# remove_estate_detail = person.RemoveEstateDetail.Field()
	remove_person_skill = person.RemovePersonSkill.Field()
	remove_person_interest = person.RemovePersonInterest.Field()
	remove_person_accomplishment = person.RemovePersonAccomplishment.Field()
	remove_person_license_certificate = person.RemovePersonLicenseCertificate.Field()
	remove_person_volunteering = person.RemovePersonVolunteering.Field()
	remove_person_publication = person.RemovePersonPublication.Field()
	remove_person_award = person.RemovePersonAward.Field()
	remove_person_address = person.RemovePersonAddress.Field()
	remove_person_language = person.RemovePersonLanguage.Field()

	unassign_person = UnassignPerson.Field()
	unassign_user_account = UnassignUserAccount.Field()
	update_user_account = UpdateUserAccount.Field()
	update_crm_integration_user = UpdateCrmIntegrationUser.Field()

	create_appointment = CreateAppointment.Field()
	update_appointment = UpdateAppointment.Field()
	delete_appointment = DeleteAppointment.Field()

	save_engagement_message_template = SaveEngagementMessageTemplate.Field()
	delete_engagement_message_template = DeleteEngagementMessageTemplate.Field()

	# Company Working Hours
	update_working_hours = UpdateWorkingHours.Field()

	# Twilio Phone Service Bot
	create_twilio_phone_service = CreateTwilioPhoneService.Field()
	update_twilio_phone_service = UpdateTwilioPhoneService.Field()
	delete_twilio_phone_service = DeleteTwilioPhoneService.Field()

	# Save Lead Note
	save_lead_note = SaveLeadNote.Field()

	# FCM device
	create_fcm_device = CreateFcmDevice.Field()
	delete_fcm_device = DeleteFcmDevice.Field()

	# Create Review Nudge Event
	create_review = CreateReview.Field()
	# create_review_message = CreateReviewMessage.Field()

	# Company Company Nudge Event
	update_company_nudge_event = UpdateCompanyNudgeEvent.Field()

	


class LeadMutation(ObjectType):
	reschedule_appointment = RescheduleAppointment.Field()

class ReviewMutation(ObjectType):
	# Create Review Nudge Event
	create_review = CreateReview.Field()
	# create_review_message = CreateReviewMessage.Field()

