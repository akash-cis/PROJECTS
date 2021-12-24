from operator import imod
from botocore import model
from graphene import Schema, ObjectType, String, Field, ID, relay, Int, DateTime, List, Connection, NonNull, DateTime, JSONString, Boolean, Float
from graphene.types.datetime import Date
from graphene_sqlalchemy import SQLAlchemyConnectionField, SQLAlchemyObjectType
from datetime import datetime

from api.models import User as UserModel
from api.models import Company as CompanyModel
from api.models import UserAccounts as UserAccountsModel
from api import models
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy import case
from api.models import UserFilter as UserFilterModel
from api.models import CompanyFilter as CompanyFilterModel
from api.models import FilterType as FilterTypeModel
from api.models import SelectionOption as SelectionOptionModel
from api.models import SavedFilter as SavedFilterModel
from api.models import FilterSet as FilterSetModel
from api.models import AingineDataReceived as AingineDataReceivedModel
from api.models import Deal as DealModel
from api.models import ConversationEntry as ConversationEntryModel
from api.models import ResponseTemplate as ResponseTemplateModel
from api.models import Team as TeamModel
from api.models import TeamMember as TeamMemberModel
from api.models import Role as RoleModel
from api.models import UserRoles as UserRolesModel
from api.models import ScreenName as ScreenNameModel
from api.models import CrmIntegration as CrmIntegrationModel
from api.models import NotificationConfig as NotificationConfigModel
from api.models import NotificationConfigDetail as NotificationConfigDetailModel
from api.models import Notification as NotificationModel
from api.models import ExportConfig as ExportConfigModel
from api.models import Export as ExportModel
from api.models import CrmLead as CrmLeadModel
from api.models import EvalTerm as EvalTermModel
from api.models import CompanyLeadFiles as CompanyLeadFilesModel
from api.models import Leads as LeadsModel
from api.models import LeadEmails as LeadEmailsModel
from api.models import LeadPhones as LeadPhonesModel
from api.models import LeadAddresses as LeadAddressesModel
from api.models import LeadVehicleOfInterest as LeadVehicleOfInterestModel
from api.models import Campaign as CampaignModel
from api.models import CampaignSchedules as CampaignSchedulesModel
from api.models import CampaignSelections as CampaignSelectionsModel
from api.models import CampaignTemplates as CampaignTemplatesModel
from api.models import LeadSource as LeadSourceModel
from api.models import Message as MessageModel
from api.models import Channel as ChannelModel
from api.models import MessageLog as MessageLogModel
from api.models import CampaignLeadSummary as CampaignLeadSummaryModel
from api.models import VinSolutionsUser as VinSolutionsUserModel
from api.models import Appointment as AppointmentModel
from api.models import EngagementMessageTemplate as EngagementMessageTemplateModel
from api.models import CompanyWorkingHours as CompanyWorkingHoursModel
from api.models import TwilioPhoneService as TwilioPhoneServiceModel
from api.models import LeadStatusType as LeadStatusTypeModel
from api.models import LeadStatusHistory as LeadStatusHistoryModel
from api.models import VehicleOfInterest as VehicleOfInterestModel
from api.models import LeadNotes as LeadNotesModel
from api.models import VinSolutionsVehicles as VinSolutionsVehiclesModel
from api.models import FCMDevice as FCMDeviceModel
from api.models import LeadConversationHistory as LeadConversationHistoryModel
from api.models import NudgeEvent as NudgeEventModel
from api.models import CompanyNudgeEvent as CompanyNudgeEventModel
from api.models import NudgeActivity as NudgeActivityModel
from api.models import NudgeActivityHistory as NudgeActivityHistoryModel
from api.models import Review as ReviewModel
from api.models import ReviewMessageTemplate as ReviewMessageTemplateModel

import json
from collections import OrderedDict
from api.repository import DealRepository, UserRepository
from funnel_models import models as funnel_models
from api.utils import SQLAlchemyDescriptor
from api.sms import look_up_phone_type

from api import db
# replacing ID
class CustomNode(relay.Node): 
    class Meta:
        name = 'CustomNode'

    @staticmethod
    def to_global_id(type, id):
        #returns a non-encoded ID
        return id

    @staticmethod
    def get_node_from_global_id(info, global_id, only_type=None):
        model = getattr(Query,info.field_name).field_type._meta.model
        return model.objects.get(id=global_id)

class Role(SQLAlchemyObjectType):
    class Meta:
        model = RoleModel


class User(SQLAlchemyObjectType):
    class Meta:
        model = UserModel

    full_name = String()
    role = Field(Role)
    status = String()
    is_company_admin = Boolean()

    def resolve_full_name(parent, info):
        return f"{parent.first_name} {parent.last_name}"

    def resolve_role(parent, info):
        user_role = parent.user_roles
        if len(user_role) > 0:
            return Role.get_node(info, user_role[0].role_id)
        else:
            return None

    def resolve_status(parent, info):
        return parent.status.value if parent.status else None

    def resolve_is_company_admin(parent, info):
        return info.context.user.has_permission('is_company_admin')


class Review(SQLAlchemyObjectType):
    class Meta:
        model = ReviewModel


class ReviewMessageTemplate(SQLAlchemyObjectType):
    class Meta:
        model = ReviewMessageTemplateModel

    full_file_path = String()

    def resolve_full_file_path(parent, info):
        return parent.file_location + parent.file_name

class Company(SQLAlchemyObjectType):
    class Meta:
        model = CompanyModel

    user_count = Int()

    def resolve_user_count(parent, info):
        return len(parent.user_accounts)
    
class Accounts(SQLAlchemyObjectType):
    class Meta:
        model = UserAccountsModel


class DurationConnection(Connection):
    duration = NonNull(JSONString)

    class Meta:
        abstract = True

    def resolve_duration(self, info, period='day', **kwargs):
        ''' 
        This assumes there are only 2 levels of information: an organizational one and user specific.
        Depending on how the authorization middleware is setup, this defaults the org-level to be the 
        current user's company. And the other one the user specific data. That means if we want
        to aggregate data in deeper hierarchies we need to extend this method.

        by default the top level duration refers to company usage duration
        '''
        duration_by_day = {}
        date_formats = {
            'day': '%Y-%m-%d',
            'week': '%Y-%U',
            'month': '%Y-%m'
        }
        for edge in self.edges:
            isoday = edge.node.timestamp.strftime(date_formats[period])
            if isoday in duration_by_day:
                #day total (company)
                duration_by_day[isoday]['value'] += edge.node.duration
                subject_id = edge.node.subject_id
                session_user = info.context.user
                #user (current session user)
                if subject_id == session_user.id:
                    if hasattr(
                            duration_by_day[isoday], 'user'
                    ):  #subject_id in duration_by_day[isoday]['user']:
                        duration_by_day[isoday]['user'][
                            'value'] += edge.node.duration
                        #top
                        if duration_by_day[isoday]['user'][
                                'value'] > duration_by_day[isoday]['top'][
                                    'value']:
                            duration_by_day[isoday]['top'].update(
                                duration_by_day[isoday]['user'])
                    else:
                        full_name = f'{session_user.first_name} {session_user.last_name}'
                        duration_by_day[isoday]['user'] = {
                            "id": subject_id,
                            "name": full_name,
                            "value": edge.node.duration
                        }
                        if duration_by_day[isoday]['user'][
                                'value'] > duration_by_day[isoday]['top'][
                                    'value']:
                            duration_by_day[isoday]['top'].update(
                                duration_by_day[isoday]['user'])
                # users
                if subject_id in duration_by_day[isoday]['users']:
                    duration_by_day[isoday]['users'][subject_id][
                        'value'] += edge.node.duration
                else:
                    #this is current in the iteration sense
                    current_user = UserModel.query.get(subject_id)
                    username = f'{current_user.first_name} {current_user.last_name}',
                    duration_by_day[isoday]['users'][subject_id] = {
                        "id": current_user.id,
                        "name": full_name,
                        "value": edge.node.duration
                    }
            else:

                duration_by_day[isoday] = {
                    'value': 0.0,
                    'users': {},
                    'top': {
                        'value': 0.0
                    }
                }
                
        duration_list = sorted(list(OrderedDict(duration_by_day).items()), key=lambda x: x[0])
        prev_durations = duration_list[:-1]
        current_durations = duration_list[1:]

        res = []
        for prev, current in zip(prev_durations, current_durations):
            current_date = current[0]
            prev_date = prev[0]
            current_top = current[1]['top']
            prev_top = prev[1]['top']
            current_user = current[1]['user']
            prev_user = prev[1]['user']
            
            current_users = sorted(list(OrderedDict(current[1]['users']).items()), key=lambda x: x[0])
            prev_users = sorted(list(OrderedDict(prev[1]['users']).items()), key=lambda x: x[0])
            
            current_company_usage = current[1]['value']
            prev_company_usage = prev[1]['value']
            res.append({
                'top': {
                    "id": current_top['id'],
                    "name": current_top['name'],
                    "current": {
                        "date": current_date,
                        "value": current_top['value']
                    },
                    "prev": {
                        "date": prev_date,
                        "value": prev_top['value']
                    },
                    "value": current_top["value"]
                },
                'user': {
                    "id": current_user['id'],
                    "name": current_user['name'],
                    "current": {
                        "date": current_date,
                        "value": current_user['value']
                    },
                    "prev": {
                        "date": prev_date,
                        "value": prev_user['value']
                    },
                    "value": current_user["value"]
                },
                'users': [{
                    "id": cur_u[1]['id'],
                    "name": cur_u[1]['name'],
                    "current": {
                        "date": current_date,
                        "value": cur_u[1]['value']
                    },
                    "prev": {
                        "date": prev_date,
                        "value": prev_u[1]['value']
                    },
                    "value": cur_u[1]["value"]
                } for prev_u, cur_u in zip(prev_users, current_users)],
                'company': {  #todo
                    "id": info.context.user.company_id,
                    "name": info.context.user.company.name,
                    "current": {
                        "date": current_date,
                        "value": current_company_usage
                    },
                    "prev": {
                        "date": prev_date,
                        "value": prev_company_usage
                    },
                    "value": current_company_usage
                },
            })
        return json.dumps(res[0]) if len(res) > 0 else json.dump(res)
      

class Object(SQLAlchemyObjectType):
    class Meta:
        model = models.Object
        interfaces = (relay.Node, )


class Event(SQLAlchemyObjectType):
    # current_user
    # current_company
    class Meta:
        model = models.Event
        interfaces = (CustomNode, )
        connection_class = DurationConnection


class UserFilter(SQLAlchemyObjectType):
    class Meta:
        model = UserFilterModel

    type = String()
    type_name = String()

    def resolve_type(parent, info):
        return parent.filter_type.type.value

    def resolve_type_name(parent, info):
        return parent.filter_type.name

    def resolve_value(parent, info):
        return parent.company_filter.selection_option.value if parent.company_filter_id else parent.value


class CompanyFilter(SQLAlchemyObjectType):
    class Meta:
        model = CompanyFilterModel

    value = String()
    type = String()
    type_name = String()
    filter_field = String()

    def resolve_value(parent, info):
        return parent.selection_option.value

    def resolve_type(parent, info):
        return parent.selection_option.filter_type.type.value

    def resolve_type_name(parent, info):
        return parent.selection_option.filter_type.name

    def resolve_filter_field(parent, info):
        return parent.selection_option.filter_type.filter_field


class FilterType(SQLAlchemyObjectType):
    class Meta:
        model = FilterTypeModel
    options_count = Int()

    def resolve_options_count(parent, info):
        return len(parent.selection_options)


class SelectionOption(SQLAlchemyObjectType):
    class Meta:
        model = SelectionOptionModel


class FilterSet(SQLAlchemyObjectType):
    class Meta:
        model = FilterSetModel


class SavedFilter(SQLAlchemyObjectType):
    class Meta:
        model = SavedFilterModel

    type = String()
    type_name = String()

    def resolve_type(parent, info):
        return parent.filter_type.type.value

    def resolve_type_name(parent, info):
        return parent.filter_type.name

    def resolve_value(parent, info):
        return parent.company_filter.selection_option.value if parent.company_filter_id else parent.value


# TODO: Build out rest of schema for implementation
class Post(ObjectType):
    id = Field(String)
    body = Field(String)
    url = Field(String)
    author = Field(String)
    author_id = Field(Int)
    author_profile_url = Field(String)
    location = Field(String)
    timestamp = Field(DateTime)
    source = Field(String)
    source_type = Field(String)
    source_id = Field(Int)
    source_url = Field(String)
    thread_id = Field(Int)
    thread_title = Field(String)
    status = Field(String)
    tags = Field(List(String))
    count = Field(Int) # for analytics only
    makes = Field(List(String))
    models = Field(List(String))
    review = Field(Boolean)
    person_full_name = Field(String)
    person_id = Field(String)
    # subforums = Field(String)


from api.elasticsearch import get_post


class AingineDataReceived(SQLAlchemyObjectType):
    class Meta:
        model = AingineDataReceivedModel

    post = Field(Post)

    def resolve_post(parent, info, set_type="PROSPECTS"):
        try:
            return parent.post or get_post(parent.aingine_data_id, set_type)
        except AttributeError:
            return get_post(parent.aingine_data_id, set_type)


class Deal(SQLAlchemyObjectType):
    class Meta:
        model = DealModel

    subscribed = Boolean()
    tags = List(String)

    def resolve_subscribed(parent, info):
        return DealRepository.is_subscribed(parent)

    def resolve_tags(parent, info):
        return parent.tags



class ConversationEntry(SQLAlchemyObjectType):
    class Meta:
        model = ConversationEntryModel


class ResponseTemplate(SQLAlchemyObjectType):
    class Meta:
        model = ResponseTemplateModel


class Team(SQLAlchemyObjectType):
    class Meta:
        model = TeamModel


class TeamMember(SQLAlchemyObjectType):
    class Meta:
        model = TeamMemberModel


class UserRoles(SQLAlchemyObjectType):
    class Meta:
        model = UserRolesModel


class PaginatedTeam(ObjectType):
    data = List(Team)
    count = Field(Int)


class PaginatedUser(ObjectType):
    data = List(User)
    count = Field(Int)


class ScreenName(SQLAlchemyObjectType):
    class Meta:
        model = ScreenNameModel


class CrmIntegration(SQLAlchemyObjectType):
    class Meta:
        model = CrmIntegrationModel


class KPIResponse(ObjectType):
    user_id = Field(Int)
    user_name = Field(String)
    date = Field(DateTime)
    status = Field(String)
    count = Field(Int)
    source = Field(String)

class ModelResponse(ObjectType):
    name = Field(String)
    count = Field(String)

class MakeModelResponse(ObjectType):
    name = Field(String)
    total = Field(String)
    children = List(ModelResponse)

class UsageResponse(ObjectType):
    user_id = Field(Int)
    user_name = Field(String)
    date = Field(DateTime)
    time = Field(Int)
    provided = Field(Int)
    engaged = Field(Int)
    converted = Field(Int)
    crm = Field(Int)


class AingineSource(ObjectType):
    source = Field(String)
    source_id = Field(Int)
    source_url = Field(String)


class NotificationConfig(SQLAlchemyObjectType):
    class Meta:
        model = NotificationConfigModel

class NotificationConfigDetail(SQLAlchemyObjectType):
    class Meta:
        model = NotificationConfigDetailModel

class Notification(SQLAlchemyObjectType):
    class Meta:
        model = NotificationModel

class ExportConfig(SQLAlchemyObjectType):
    class Meta:
        model = ExportConfigModel

class Export(SQLAlchemyObjectType):
    class Meta:
        model = ExportModel

class Person(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.Person


class PersonEmail(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonEmail


class PersonSource(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonSource

class PersonUserAccount(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonUserAccount


class PersonAddress(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonAddress

class PersonImage(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonImage


class PersonPhoneNumber(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonPhoneNumber


class PersonExperience(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonExperience


class PersonEducation(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonEducation

class PersonPossession(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonPossession


class VehicleDetail(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.VehicleDetail


class EstateDetail(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.EstateDetail


class PersonSkill(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonSkill


class PersonLanguage(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonLanguage


class PersonInterest(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonInterest


class PersonAccomplishment(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonAccomplishment


class PersonLicenseCertificate(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonLicenseCertificate


class PersonVolunteering(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonVolunteering


class PersonPublication(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonPublication

class UserAccount(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.UserAccount

class Source(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.Source

class PersonAward(SQLAlchemyObjectType):
    class Meta:
        model = funnel_models.PersonAward

class CrmLead(SQLAlchemyObjectType):
    class Meta:
        model = CrmLeadModel

class DescriptorField(ObjectType):
    name = String()
    type = String()
    nullable = Boolean()
    options = List(String)

class Descriptor(ObjectType):
    model_name = String()
    fields = List(DescriptorField)

class PaginatedPerson(ObjectType):
    data = List(Person)
    count = Field(Int)

class PaginatedReview(ObjectType):
    data = List(Review)
    count = Field(Int)

class PaginatedReviewMessageTemplate(ObjectType):
    data = List(ReviewMessageTemplate)
    count = Field(Int)
    
class PaginatedPost(ObjectType):
    data = List(Post)
    count = Field(Int)

class EvalTerm(SQLAlchemyObjectType):
    class Meta:
        model = EvalTermModel

class CompanyLeadFiles(SQLAlchemyObjectType):
    class Meta:
        model = CompanyLeadFilesModel

class LeadStatusType(SQLAlchemyObjectType):
    class Meta:
        model = LeadStatusTypeModel

class Appointment(SQLAlchemyObjectType):
    class Meta:
        model = AppointmentModel

class LeadConversationHistory(SQLAlchemyObjectType):
    class Meta:
        model = LeadConversationHistoryModel

class Leads(SQLAlchemyObjectType):
    class Meta:
        model = LeadsModel

    conversation_status = Field(LeadConversationHistory)

    def resolve_status(self, info, *kwargs):
        campaign_lead_summry_status = { 'OPT_OUT': 0, 'ENGAGED': 1, 'RESPONDED': 2, 'DELIVERED': 3, 'SENT': 4, 'FAILED': 5, 'QUEUED': 6, 'UNCONTACTED': 7}

        campaign_lead_summry = db.session.query(CampaignLeadSummaryModel.status).filter(CampaignLeadSummaryModel.lead_id == self.id) \
                        .order_by(case(value=CampaignLeadSummaryModel.status, whens=campaign_lead_summry_status).label("status"), CampaignLeadSummaryModel.id.desc()).first()
        
        status = 'UNCONTACTED'
        if campaign_lead_summry:
            if campaign_lead_summry[0].value in ['OPT_OUT', 'ENGAGED', 'RESPONDED']:
                status = 'RESPONDED'
            elif campaign_lead_summry[0].value in ['DELIVERED', 'SENT', 'FAILED']:
                status = 'WAITING_FOR_REPLY'
        return status

    def resolve_conversation_status(self, info, **kwargs):
        return LeadConversationHistory.get_query(info).filter(
            LeadConversationHistoryModel.lead_id == self.id, 
            LeadConversationHistoryModel.is_active == True
        ).first()


class PaginatedAppointment(ObjectType):
    data = List(Appointment)
    count = Field(Int)

class PrimaryLeads(SQLAlchemyObjectType):
    class Meta:
        model = LeadsModel

    active_appointment = Field(Appointment)
    conversation_status = Field(LeadConversationHistory)
    consent_expire_day = Field(Int)

    def resolve_status(self, info, *kwargs):
        campaign_lead_summry_status = { 'OPT_OUT': 0, 'ENGAGED': 1, 'RESPONDED': 2, 'DELIVERED': 3, 'SENT': 4, 'FAILED': 5, 'QUEUED': 6, 'UNCONTACTED': 7}

        campaign_lead_summry = db.session.query(CampaignLeadSummaryModel.status).filter(CampaignLeadSummaryModel.lead_id == self.id) \
                        .order_by(case(value=CampaignLeadSummaryModel.status, whens=campaign_lead_summry_status).label("status"), CampaignLeadSummaryModel.id.desc()).first()
        
        status = 'UNCONTACTED'
        if campaign_lead_summry:
            if campaign_lead_summry[0].value in ['OPT_OUT', 'ENGAGED', 'RESPONDED']:
                status = 'RESPONDED'
            elif campaign_lead_summry[0].value in ['DELIVERED', 'SENT', 'FAILED']:
                status = 'WAITING_FOR_REPLY'
        return status

    def resolve_emails(self, info, **kwargs):
        whens = { 'Primary': 0, 'Personal': 1, 'Alternate': 2, 'Work': 3, 'Unknown': 4, None: 5}
        lead_email = db.session.query(LeadEmailsModel).filter(LeadEmailsModel.lead_id == self.id) \
                        .order_by(case(value=LeadEmailsModel.email_type, whens=whens).label("email_type"), LeadEmailsModel.id.desc()).first()
        
        return [lead_email]

    def resolve_phone_numbers(self, info, **kwargs):
        lead_phones = LeadPhones.get_query(info).filter(LeadPhonesModel.lead_id == self.id, LeadPhonesModel.lookup_type == None).all()
        for phone in lead_phones:
            phone.lookup_type = look_up_phone_type(phone.phone)
            db.session.add(phone)
            db.session.commit()

        whens = { 'Cellular': 0, 'Cell': 1, 'Mobile': 2, 'Home': 3, 'Work': 4, 'Unknown': 5, 'None': 6, None: 7}
        lead_phone = db.session.query(LeadPhonesModel).filter(LeadPhonesModel.lead_id == self.id, LeadPhonesModel.lookup_type.in_(["mobile", "voip"])) \
                        .order_by(case(value=LeadPhonesModel.phone_type, whens=whens).label("phone_type"), LeadPhonesModel.id.desc()).first()

        return [lead_phone]

    def resolve_addresses(self, info, **kwargs):
        return LeadAddresses.get_query(info).filter(LeadAddressesModel.lead_id == self.id).all()

    def resolve_vehicle_of_interest(self, info, **kwargs):
        return LeadVehicleOfInterest.get_query(info).filter(LeadVehicleOfInterestModel.lead_id == self.id).all()
    
    def resolve_active_appointment(self, info, **kwargs):
        return Appointment.get_query(info).filter(
                        AppointmentModel.lead_id == self.id, 
                        AppointmentModel.start_datetime > datetime.utcnow(),
                        AppointmentModel.appointment_status.in_(['SCHEDULED', 'RESCHEDULED'])).order_by(AppointmentModel.id).first()

    def resolve_conversation_status(self, info, **kwargs):
        return LeadConversationHistory.get_query(info).filter(
            LeadConversationHistoryModel.lead_id == self.id, 
            LeadConversationHistoryModel.is_active == True
        ).first()

    def resolve_messages(self, info, **kwargs):
        query = Message.get_query(info)
        return [query.filter(MessageModel.lead_id == self.id).order_by(MessageModel.id.desc()).first()]

    def resolve_consent_expire_day(self, info, **kwargs):
        consent_expire_day = 0
        if self.text_consent_status and self.text_consent_status.value == 'ACCEPTED':
            last_conversation = self.text_consent_date
            exclude_text = ['START', 'YES', 'UNSTOP', 'STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
            last_received = Message.get_query(info).filter(
                                            MessageModel.lead_id == self.id, 
                                            MessageModel.date_received.__gt__(last_conversation),
                                            MessageModel.content.notin_(exclude_text)) \
                                            .order_by(MessageModel.id.desc()).first()
            if last_received:
                last_conversation = last_received.date_received
            consent_expire_day = 180 - (datetime.utcnow() - last_conversation).days

        return consent_expire_day

class PaginatedLeads(ObjectType):
    data = List(PrimaryLeads)
    count = Field(Int)

class LeadEmails(SQLAlchemyObjectType):
    class Meta:
        model = LeadEmailsModel

class LeadPhones(SQLAlchemyObjectType):
    class Meta:
        model = LeadPhonesModel

class LeadAddresses(SQLAlchemyObjectType):
    class Meta:
        model = LeadAddressesModel

class LeadVehicleOfInterest(SQLAlchemyObjectType):
    class Meta:
        model = LeadVehicleOfInterestModel

class Campaign(SQLAlchemyObjectType):
    class Meta:
        model = CampaignModel

    def resolve_campaign_selections(self, info, **kwargs):
      query = CampaignSelections.get_query(info)
      return query.filter(CampaignSelectionsModel.campaign_id == self.id).all()

    def resolve_campaign_schedules(self, info, **kwargs):
      query = CampaignSchedules.get_query(info)
      return query.filter(CampaignSchedulesModel.campaign_id == self.id).all()

    def resolve_campaign_templates(self, info, **kwargs):
      query = CampaignTemplates.get_query(info)
      return query.filter(CampaignTemplatesModel.campaign_id == self.id).all()

class CampaignSelections(SQLAlchemyObjectType):
    class Meta:
        model = CampaignSelectionsModel

class CampaignSchedules(SQLAlchemyObjectType):
    class Meta:
        model = CampaignSchedulesModel
    
    def resolve_schedule_templates(self, info, **kwargs):
      query = CampaignTemplates.get_query(info)
      return query.filter(CampaignTemplatesModel.schedule_id == self.id).all()

class CampaignTemplates(SQLAlchemyObjectType):
    class Meta:
        model = CampaignTemplatesModel

class LeadSource(SQLAlchemyObjectType):
    class Meta:
        model = LeadSourceModel

class CampaignLeadSummary(SQLAlchemyObjectType):
    class Meta:
        model = CampaignLeadSummaryModel

class CampaignLeadMessageCount(ObjectType):
        campaign_id = Field(Int)
        total= Field(Int)
        total_uncontacted = Field(Int)
        total_sent = Field(Int)
        total_delivered = Field(Int)
        total_responded = Field(Int)
        total_engaged = Field(Int)
        avg_attempts_before_response = Field(Float)
        response_rate = Field(Float)
        opt_out_rate = Field(Float)
        appointment_count = Field(Int)

class EngagementAnalysis(ObjectType):
        count = Field(Int)
        status = Field(String)
        date = Field(DateTime)
        attempts = Field(Int)

class EngagementLeadAnalysis(ObjectType):
        count = Field(Int)
        source = Field(String)
        status = Field(String)
        date = Field(DateTime)

class LeadAnalytics(ObjectType):
        count = Field(Int)
        source = Field(String)
        
class AppointmentSourceAnalytics(ObjectType):
    count = Field(Int)
    source = Field(String)

class AppointmentSalesAnalytics(ObjectType):
    count = Field(Int)
    user_name = Field(String)

class AppointmentAnalysis(ObjectType):
    title = Field(String)
    count = Field(Int)
    prev_count = Field(Int)
    growth_rate = Field(Float)

class PaginatedCampaign(ObjectType):
    data = List(Campaign)
    lead_message_count=List(CampaignLeadMessageCount)
    count = Field(Int)

class PaginatedCampaignTemplates(ObjectType):
    data = List(CampaignTemplates)
    count = Field(Int)

class PaginatedCampaignLeadSummary(ObjectType):
    data = List(CampaignLeadSummary)
    count = Field(Int)
    lead_message_count= Field(CampaignLeadMessageCount)

class Message(SQLAlchemyObjectType):
    class Meta:
        model = MessageModel

    def resolve_message_log(self, info, **kwargs):
        query = MessageLog.get_query(info)
        return query.filter(MessageLogModel.message_id == self.id).all()

class PaginatedMessage(ObjectType):
    data = List(Message)
    count = Field(Int)
    last_id = Field(Int)
    is_refresh = Field(Boolean)

class Channel(SQLAlchemyObjectType):
    class Meta:
        model = ChannelModel

class MessageLog(SQLAlchemyObjectType):
    class Meta:
        model = MessageLogModel

class VinSolutionsUser(SQLAlchemyObjectType):
    class Meta:
        model = VinSolutionsUserModel

class CrmUsers(ObjectType):
        id = Field(Int)
        user_name = Field(String)



class EngagementMessageTemplate(SQLAlchemyObjectType):
    class Meta:
        model = EngagementMessageTemplateModel

class CompanyWorkingHours(SQLAlchemyObjectType):
    class Meta:
        model = CompanyWorkingHoursModel

class LeadsByStatus(ObjectType):
    count = Field(Int)
    status = Field(String)

class TwilioPhoneService(SQLAlchemyObjectType):
    class Meta:
        model = TwilioPhoneServiceModel

class PaginatedTwilioPhoneService(ObjectType):
    data = List(TwilioPhoneService)
    count = Field(Int)
    status_code = Field(Int)
    message = Field(String)
        
class LeadStatusHistory(SQLAlchemyObjectType):
    class Meta:
        model = LeadStatusHistoryModel

class VehicleOfInterest(SQLAlchemyObjectType):
    class Meta:
        model = VehicleOfInterestModel

class LeadNotes(SQLAlchemyObjectType):
    class Meta:
        model = LeadNotesModel

class VehicleMake(ObjectType):
    Make_ID = Field(Int)
    Make_Name = Field(String)

class VehicleMakes(ObjectType):
    data = List(VehicleMake)
    count = Field(Int)
    status_code = Field(Int)
    message = Field(String)

class VehicleModel(ObjectType):
    Model_ID = Field(Int)
    Model_Name = Field(String)
    VehicleTypeName = Field(String)

class VehicleModels(ObjectType):
    data = List(VehicleModel)
    count = Field(Int)
    status_code = Field(Int)
    message = Field(String)

class VinSolutionsVehicles(ObjectType):
    class Meta:
        model = VinSolutionsVehiclesModel

class LeadAppointmentDetails(ObjectType):
    appointment = Field(Appointment)
    company = Field(Company)
    working_hours = List(CompanyWorkingHours)
    active_appointments = List(Appointment)
    status_code = Field(Int)
    message = Field(String)

class FCMDevice(ObjectType):
    class Meta:
        model = FCMDeviceModel

class NudgeEvent(SQLAlchemyObjectType):
    class Meta:
        model = NudgeEventModel

class CompanyNudgeEvent(SQLAlchemyObjectType):
    class Meta:
        model = CompanyNudgeEventModel

class NudgeActivity(SQLAlchemyObjectType):
    class Meta:
        model = NudgeActivityModel

class NudgeActivityHistory(SQLAlchemyObjectType):
    class Meta:
        model = NudgeActivityHistoryModel

class CompanyNudgeEvents(ObjectType):
    nudge_event = Field(NudgeEvent)
    company_nudge_event = Field(CompanyNudgeEvent)



from api.query import Query, LeadQuery, ReviewQuery
from api.mutation import Mutation, LeadMutation, ReviewMutation

schema = Schema(query=Query,
                mutation=Mutation,
                types=[User, Company, Post, Event, Object, KPIResponse, UsageResponse, ModelResponse, MakeModelResponse, AingineSource, Campaign, EngagementAnalysis, Review, PaginatedReview, ReviewMessageTemplate])

review_schema = Schema(query=ReviewQuery,
                mutation=ReviewMutation,
                types=[Review, PaginatedReview])

lead_schema = Schema(query=LeadQuery,
                mutation=LeadMutation)
