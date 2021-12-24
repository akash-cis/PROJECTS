import traceback, requests
from graphene import ObjectType, Field, List, String, Int, DateTime, Boolean, Date
from sqlalchemy.orm import session
from sqlalchemy.sql.functions import user
from api.schema import *
from api import schema, models, elasticsearch
from api.auth import get_auth_user, admin_protected
from api.repository import AnalyticsRepository, EngagementDashboardRepository, UserRepository, DealRepository, CampaignRepository
from sqlalchemy import exc, func, and_, or_, cast, String as SqlString, case, text, nullslast
from graphene_sqlalchemy import SQLAlchemyConnectionField, SQLAlchemyObjectType
from graphene_sqlalchemy_filter import FilterableConnectionField, FilterSet
from graphql import GraphQLError
from api.models import CampaignType, CampaignTypes, DealStatus, UserStatus, AingineDataStatus, CampaignManageType
from api.utils import create_forwarder, instantiate_graph, util, encrypt_decrypt
from api.utils.get_requested_fields import get_fields
from config import AINGINE_GRAPHQL_API_URL
from api.crm_service import pull_crm_users
from datetime import datetime, timedelta
from http import HTTPStatus

# External API utils
call_aingine = create_forwarder(AINGINE_GRAPHQL_API_URL)

campaign_lead_summry_status = { 'OPT_OUT': 0, 'ENGAGED': 1, 'RESPONDED': 2, 'DELIVERED': 3, 'SENT': 4, 'FAILED': 5, 'QUEUED': 6, 'UNCONTACTED': 7}

def get_count(q):
    count_q = q.statement.with_only_columns([func.count()]).order_by(None)
    count = q.session.execute(count_q).scalar()
    return count

def get_campaign_leads(campaign_id, user):
        leads = LeadsModel.query.filter(LeadsModel.company_id == user.company_id, LeadsModel.is_deleted == False)
        orFilters = []
        orStatus = []
        q = CampaignSelectionsModel.query.filter(CampaignSelectionsModel.campaign_id == campaign_id).all()
        if q and len(q) and q[0].type.value == 'LEAD':
            list_id = []
            for row in q:
                list_id.append(row.value)
            return leads.filter(LeadsModel.id.in_(list_id))
        elif q and len(q) and (q[0].type.value == 'SOURCE' or q[0].type.value == 'STATUS'):
            for row in q:
                if row.type.value == 'SOURCE':
                    source_id = row.value
                    lead_source = LeadSourceModel.query.filter(LeadSourceModel.id == source_id).first()
                    if lead_source:
                        orFilters.append(lead_source.id)
                elif row.type.value == 'STATUS':
                    orStatus.append(row.value)  

            return leads.filter(and_(LeadsModel.lead_source_original_id.in_(orFilters), LeadsModel.lead_status_type_id.in_(orStatus)))
        elif q and len(q) and q[0].type.value == 'FILE':
            file_id = q[0].value
            return leads.filter(LeadsModel.lead_file_id == file_id)
        else:
            return leads.filter(False)

class EventFilter(FilterSet):
    fromDate = DateTime()
    toDate = DateTime()
    EXTRA_EXPRESSIONS = {}

    class Meta:
        model = models.Event
        fields = {
            'timestamp': ['eq', 'ne', 'gt', 'lt', 'range', 'is_null'],
            # 'subject_id': ['current_user']
        }


class ScreenNameCheck(ObjectType):
    source_id = Int()
    has_screen_name = Boolean()
    screen_name = Field(ScreenName)

    def resolve_has_screen_name(self, info, **args):
        user = info.context.user
        source_id = self.source_id
        if user:
            screenName = ScreenName.get_query(info).filter(ScreenNameModel.source_id == source_id, ScreenNameModel.user_id == user.id).first()
            return True if screenName else False
        else:
            raise GraphQLError('Unauthorized')

    def resolve_screen_name(self, info, **args):
        source_id = self.source_id
        user = info.context.user
        if user:
            return ScreenName.get_query(info).filter(ScreenNameModel.source_id == source_id, ScreenNameModel.user_id == user.id).first()
        else:
            raise GraphQLError('Unauthorized')


class Query(ObjectType):
    me = Field(User)
    users = List(User)
    company_user_by_id = Field(User, id=Int(required=True))
    system_user = Field(User)
    all_events = FilterableConnectionField(schema.Event, filters=EventFilter())
    all_objects = SQLAlchemyConnectionField(schema.Object)

    my_events = List(schema.Event)
    my_objects = List(schema.Object)

    # review
    get_review = Field(Review, email=String(), head=String(), body=String(), company=Int(), _type=String())
    get_paginated_review_message_template = Field(PaginatedReviewMessageTemplate, company_id=Int(required=True), user_id=Int(required=True))


    # my_company_usage
    get_posts = Field(PaginatedPost, older=DateTime(), newer=DateTime(), range=Int(description='Number of days back to include in the results. (i.e 1 equals just todays posts'), hide_viewed=Boolean())
    get_life_events_posts = Field(PaginatedPost, older=DateTime(), newer=DateTime(), range=Int(description='Number of days back to include in the results. (i.e 1 equals just todays posts'), global_events=Boolean(description="Get all life events, not only customers life events"))
    get_user_display_filters = List(CompanyFilter)
    get_companies = List(Company)
    company = Field(Company, id=Int(required=True))
    get_saved_posts = List(AingineDataReceived, set_type=String())
    get_deals = List(Deal, post_type=String(), status=String(), order_by=String(), order_direction=String())
    deal = Field(Deal, id=Int(required=True))
    get_filter_types = List(FilterType)
    filter_type = Field(FilterType, id=Int(required=True))
    search_company_by_name = List(Company, name=String(required=True))
    user = Field(User, id=Int(required=True))
    get_user_by_email = List(User, email=String(required=True))
    get_user_roles_by_company=List(UserRoles, company_id=Int(required=True), user_id=Int(required=True))
    get_teams = Field(PaginatedTeam, page=Int(), page_size=Int(), search=String(), company_id=Int(required=True))
    team = Field(Team, id=Int(required=True))
    roles = List(Role, company_id=Int())
    get_roles_by_company = List(Role, company_id=Int(required=True), user_id=Int(required=True))
    get_users = Field(PaginatedUser, page=Int(), page_size=Int(), search=String(), company_id=Int(required=True))
    screen_name_check = Field(ScreenNameCheck, source_id=Int(required=True))
    crm_integration_by_company = Field(CrmIntegration, company_id=Int(required=True))
    search_deals = List(Deal, search_term=String(required=True))
    get_sources = List(AingineSource)
    get_notifications = List(Notification, older=DateTime())
    get_unread_notifications_count = Field(Int)
    get_export_configs = List(ExportConfig)
    export_config = Field(ExportConfig, id=Int(required=True))
    get_exports = List(Export)
    get_users_appointment = List(Appointment, user_id=Int(required=True))
    get_company_appointment = List(Appointment, company_id=Int(required=True))
    
    get_analytics_kpis = List(KPIResponse, range=(Int(description='Number of days back to include in the results. (i.e 1 equals just todays counts')), all_members=Boolean(description="Get all team members data independently from the position of the member"))
    get_analytics_app_usage = List(UsageResponse, range=(Int(description='Number of days back to include in the results. (i.e 1 equals just todays counts')), all_members=Boolean(description="Get all team members data independently from the position of the member")) 
    get_analytics_posts = List(Post, older=DateTime(), newer=DateTime(), range=Int(description='Number of days back to include in the results. (i.e 1 equals just todays posts'))
    get_analytics_categories = List(MakeModelResponse, older=DateTime(), newer=DateTime(), range=Int(description='Number of days back to include in the results. (i.e 1 equals just todays posts'))

    # Aingine API
    all_persons = List(schema.Person, source_id=Int())
    paginated_persons =Field(PaginatedPerson, page=Int(), page_size=Int(), source_id=Int(), search=String(), order_by=String(), order_direction=String())
    person = Field(Person, id=Int(required=True))
    person_descriptor = List(schema.Descriptor, description="Describes person related tables")
    all_unique_sources = List(schema.Source, exclude=List(String))

    get_eval_terms = List(EvalTerm)
    
    company_lead_files = Field(CompanyLeadFiles)
    leads = List(Leads)
    lead = Field(Leads, id=Int(required=True))
    get_leads = Field(PaginatedLeads, page=Int(), page_size=Int(), source=List(String), source_original=List(String), combined_source=List(String), search=String(), order_by=String(), order_direction=String(), voi=List(String), campaign_id=Int(), status=String(), lead_status_types=List(Int))
    lead_descriptor = List(schema.Descriptor, description="Describes lead related tables")
    get_all_voi = List(String, page=Int(), page_size=Int(), source=List(String), source_original=List(String), combined_source=List(String), search=String())
    get_all_source_original = List(String)

    campaigns = List(Campaign)
    campaign = Field(Campaign, id=Int(required=True))
    get_campaigns =Field(PaginatedCampaign, company_id=Int(), page=Int(), page_size=Int(), search=String(), order_by=String(), order_direction=String(), active_ind=String())
    lead_sources = List(LeadSource)
    
    campaign_schedules = List(CampaignSchedules,campaign_id=Int(required=True))
    get_campaign_schedules =Field(PaginatedCampaign, company_id=Int())

    get_campaign_templates =Field(PaginatedCampaignTemplates, campaign_id=Int(), source_id=Int(),schedule_id=Int(), page=Int(), page_size=Int(), search=String(), order_by=String(), order_direction=String())

    messages = Field(PaginatedMessage, lead_id=Int(required=True), last_id=Int(), page=Int(), page_size=Int())
    message = Field(Message, id=Int(required=True))
    channels = List(Channel)
    channel = Field(Channel, id=Int(required=True))
    message_log = Field(MessageLog, id=Int(required=True))
    get_campaign_lead_summary =Field(PaginatedCampaignLeadSummary, campaign_id=Int(), lead_id=Int(),status=List(String), attempt=List(String),search=String(),page=Int(),page_size=Int(), order_by=String(), order_direction=String())

    get_engagement_analytics = List(EngagementAnalysis, range=Int())
    get_engagement_lead_analytics = List(EngagementLeadAnalysis, range=Int())
    get_lead_analytics = List(LeadAnalytics, range=Int())
    get_appointment_source = List(AppointmentSourceAnalytics, range=Int())
    get_appointment_salesperson = List(AppointmentSalesAnalytics, range=Int())
    get_appointment_analysis = List(AppointmentAnalysis, range=Int())

    get_crm_users = List(CrmUsers)
    get_vin_crm_user = Field(VinSolutionsUser,  crm_integration_id=Int(required=True), user_id=Int(required=True))

    engagement_message_templates = List(EngagementMessageTemplate, template_type=String(), company_id=Int(), user_id=Int(), is_active=Boolean())
    
    get_lead_appointment = Field(PaginatedAppointment, lead_id=Int(required=True), page=Int(), page_size=Int(), search=String(), order_by=String(), order_direction=String(), start_date=Date(), end_date=Date(), appointment_status=List(String))
    get_user_appointment = Field(PaginatedAppointment, user_id=Int(), company_id=Int(), lead_id=Int(), page=Int(), page_size=Int(), search=String(), order_by=String(), order_direction=String(), start_date=Date(), end_date=Date(), appointment_status=List(String))

    get_company_working_hours = List(CompanyWorkingHours, company_id=Int(required=True))

    leads_by_status = List(LeadsByStatus)

    get_twilio_phone_services = Field(PaginatedTwilioPhoneService, company_id=Int(required=True), types=List(String), search=String(), page=Int(), page_size=Int(), order_by=String(), order_direction=String())

    lead_status_types = List(LeadStatusType)

    vehicle_of_interest = List(VehicleOfInterest)

    get_vehicle_makes = Field(VehicleMakes, search=String(), page=Int(), page_size=Int())
    get_vehicle_models = Field(VehicleModels, make_name=String(required=True), year=Int(required=True), search=String())

    get_campaign_by_lead = Field(PaginatedCampaign, lead_id=Int(), page=Int(), page_size=Int())

    get_company_nudge_event = List(CompanyNudgeEvents, company_id=Int())

    def resolve_me(parent, info):
        user = info.context.user
        if user.status is None or user.status == UserStatus.PENDING:
            UserRepository.update_user_status(user)
        return user

    def resolve_users(parent, info):
        return User.get_query(info).all()

    def resolve_company_user_by_id(parent, info, id):
        user = info.context.user
        return User.get_query(info).filter(UserModel.id == id, UserModel.company_id == user.company_id).one()

    def resolve_system_user(parent, info):
        user = info.context.user
        return User.get_query(info).filter(
                UserModel.company_id == user.company_id, UserModel.first_name == "Otto",
                UserModel.last_name == "").one()

    def resolve_get_user_by_email(parent, info, email):
        return User.get_query(info).filter(UserModel.email == email).all()

    def resolve_my_events(parent, info):
        #TODO: Turn this into a UserContext decorator for resolvers that need it
        token = info.context.headers.get('Authorization').split('Bearer ')[1]
        email = get_auth_user(token)
        user = User.get_query(info).filter(UserModel.email == email).first()
        user_id = user.id
        my_viewed_events = models.Event.get_query(info).filter_by(
            subject_id=user_id)

    def resolve_get_review(parent, info, **args):
        print("in resolve_get_reviews")
        result = elasticsearch.execute_search(info.context.user, args)
        return PaginatedReview(
            data=result["review_list"],
            count=result["total_hits"]
        )

        
    def resolve_get_paginated_review_message_template(parent, info, company_id, user_id):
        print("in resolve_get_review_message_template")
        _data = ReviewMessageTemplate.get_query(info).filter(ReviewMessageTemplateModel.company_id == company_id, ReviewMessageTemplateModel.user_id == user_id).all()
        _count = ReviewMessageTemplate.get_query(info).filter(ReviewMessageTemplateModel.company_id == company_id, ReviewMessageTemplateModel.user_id == user_id).count()
        return PaginatedReviewMessageTemplate(
            data=_data,
            count=_count
        )

    def resolve_get_posts(parent, info, **args):
        # print("in resolve_get_posts")
        result = elasticsearch.execute_search(info.context.user, args)
        return PaginatedPost(
            data=result["post_list"],
            count=result["total_hits"]
        )
        
    def resolve_get_life_events_posts(parent, info, **args):
        fields = get_fields(info)
        include_person = "personId" in fields or "personFullName" in fields['data']
        result = elasticsearch.search_life_events(info.context.user, args, include_person=include_person, global_events=args['global_events'])
        return PaginatedPost(
            data=result["post_list"],
            count=result["total_hits"]
        )

    def resolve_get_user_display_filters(parent, info):
        user = info.context.user
        return CompanyFilter.get_query(info).filter(CompanyFilterModel.company_id == user.company_id, CompanyFilterModel.user_can_change == True)

    def resolve_get_companies(parent, info):
        return admin_protected(info, Company.get_query(info).all())

    def resolve_company(parent, info, id):
        return admin_protected(info, Company.get_node(info, id))

    def resolve_get_saved_posts(parent, info, set_type="PROSPECTS"):
        aingine_data = AingineDataReceived.get_query(info).filter(AingineDataReceivedModel.user_id == info.context.user.id, AingineDataReceivedModel.company_id == info.context.user.company_id, AingineDataReceivedModel.status == AingineDataStatus.SAVED).all()
        results = []
        for data in aingine_data:
            data.post = AingineDataReceived.resolve_post(data, info, set_type)
            if data.post:
                results.append(data)

        results.sort(key=lambda x: x.post.timestamp, reverse=True)

        return results

    def resolve_get_deals(parent, info, post_type=None, status=None, order_by='date_created', order_direction='desc'):
        user = info.context.user
        andFilter = [ DealModel.user_id == user.id ]

        if post_type and post_type == 'PROSPECTS':
            andFilter.append(or_(DealModel.post_type == post_type, DealModel.post_type == None))
        elif post_type and post_type != 'ALL':
            andFilter.append(DealModel.post_type == post_type)

        if status:
            andFilter.append(DealModel.status == DealStatus(status))
            
        data = Deal.get_query(info).filter(*andFilter).order_by(getattr(getattr(DealModel, order_by), order_direction)())
        return data

    def resolve_deal(parent, info, id):
        user = info.context.user
        return Deal.get_query(info).filter(DealModel.user_id == user.id, DealModel.id == id).first()

    def resolve_get_filter_types(parent, info):
        return admin_protected(info, FilterType.get_query(info).all())

    def resolve_filter_type(parent, info, id):
        return admin_protected(info, FilterType.get_node(info, id))

    def resolve_search_company_by_name(parent, info, name):
        return admin_protected(info, Company.get_query(info).filter(CompanyModel.name.ilike(f'%{name}%')).all())

    def resolve_user(parent, info, id):
        return admin_protected(info, User.get_node(info, id))

    def resolve_get_teams(parent, info, company_id, page=None, page_size=None, search='%', order_by='date_created', order_direction='desc'):
        user = info.context.user
        # data = Team.get_query(info).filter(TeamModel.company_id == user.company_id).order_by(getattr(getattr(TeamModel, order_by), order_direction)())

        # orFilter = and_(UserModel.company_id == company_id, or_(TeamModel.name.ilike(f"%{search}%"), UserModel.first_name.ilike(f"%{search}%"), UserModel.last_name.ilike(f"%{search}%")))
        orFilter = and_(UserModel.company_id == company_id, TeamModel.company_id == company_id, or_(TeamModel.name.ilike(f"%{search}%"), UserModel.first_name.ilike(f"%{search}%"), UserModel.last_name.ilike(f"%{search}%")))
        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = Team.get_query(info).join(TeamModel.leader).filter(orFilter).order_by(getattr(getattr(TeamModel, order_by), order_direction)())
        elif page == 1:
            data = Team.get_query(info).join(TeamModel.leader).filter(orFilter).order_by(getattr(getattr(TeamModel, order_by), order_direction)()).limit(page_size)
        else:
            data = Team.get_query(info).join(TeamModel.leader).filter(orFilter).order_by(getattr(getattr(TeamModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)
        count = Team.get_query(info).join(TeamModel.leader).filter(orFilter).order_by(getattr(getattr(TeamModel, order_by), order_direction)()).count()
        return PaginatedTeam(
            data=data,
            count=count
        )
    
    def resolve_team(parent, info, id):
        user = info.context.user
        return Team.get_query(info).filter(TeamModel.id == id).first()


    def resolve_roles(parent, info, company_id=None):
        company_id = company_id if company_id and info.context.user.is_admin() else info.context.user.company_id
        return Role.get_query(info).filter(RoleModel.company_id == company_id).order_by(RoleModel.name).all()

    def resolve_get_user_roles_by_company(parent, info, company_id=None, user_id=None):
        company_id = company_id if company_id and info.context.user.is_admin() else info.context.user.company_id
        return UserRoles.get_query(info).filter(UserRolesModel.company_id == company_id, UserRolesModel.user_id == user_id).all()


    def resolve_get_users(parent, info, company_id, page=None, page_size=None, search='%', order_by='date_created', order_direction='desc'):
        user = info.context.user

        # orFilter = and_(UserModel.company_id == company_id, or_(UserModel.email.ilike(f"%{search}%"), UserModel.first_name.ilike(f"%{search}%"), UserModel.last_name.ilike(f"%{search}%")))
        orFilter = and_(or_(UserModel.company_id == company_id, UserModel.id.in_(Accounts.get_query(info).filter(UserAccountsModel.company_id == company_id).with_entities(UserAccountsModel.user_id).all())), or_(UserModel.email.ilike(f"%{search}%"), UserModel.first_name.ilike(f"%{search}%"), UserModel.last_name.ilike(f"%{search}%")))
        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = User.get_query(info).filter(orFilter).order_by(getattr(getattr(UserModel, order_by), order_direction)())
        elif page == 1:
            data = User.get_query(info).filter(orFilter).order_by(getattr(getattr(UserModel, order_by), order_direction)()).limit(page_size)
        else:
            data = User.get_query(info).filter(orFilter).order_by(getattr(getattr(UserModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)
        count = User.get_query(info).filter(orFilter).order_by(getattr(getattr(UserModel, order_by), order_direction)()).count()
        return PaginatedUser(
            data=data,
            count=count
        )

    def resolve_screen_name_check(self, info, source_id):
        return ScreenNameCheck(source_id)

    def resolve_crm_integration_by_company(self, info, company_id):
        return CrmIntegration.get_query(info).filter(CrmIntegrationModel.company_id == company_id, CrmIntegrationModel.active == True).first()
    
    def resolve_get_analytics_kpis(parent, info, range=30, all_members=False, **args):
        user = info.context.user
        return AnalyticsRepository.get_analytics_kpis(user, range, all_members)
    
    def resolve_get_analytics_app_usage(parent, info, range=30, all_members=False, **args):
        user = info.context.user
        return AnalyticsRepository.get_analytics_app_usage(user, range, all_members)

    def resolve_get_analytics_posts(parent, info, **args):
        return elasticsearch.execute_analytics_search(info.context.user, args, 'barchart')

    def resolve_get_analytics_categories(parent, info, **args):
        rsp = elasticsearch.execute_analytics_search(info.context.user, args, 'treemap')
        return rsp

    def resolve_search_deals(parent, info, search_term):
        return DealRepository.search_deals(info.context.user.id, search_term)

    def resolve_get_sources(parent, info):
        return elasticsearch.get_unique_sources()

    def resolve_get_notifications(parent, info, older=None):
        user = info.context.user
        size = 5 # limit
        if older:
            return Notification.get_query(info).filter(NotificationModel.user_id == user.id, NotificationModel.date < older).order_by(getattr(getattr(NotificationModel, 'date'), 'desc')()).limit(size)
        else:
            return Notification.get_query(info).filter(NotificationModel.user_id == user.id).order_by(getattr(getattr(NotificationModel, 'date'), 'desc')()).limit(size)

    def resolve_get_unread_notifications_count(parent, info):
        user = info.context.user
        return Notification.get_query(info).filter(NotificationModel.user_id == user.id, NotificationModel.read == False).count()
    
    def resolve_get_export_configs(parent, info):
        user = info.context.user
        return ExportConfig.get_query(info).filter(ExportConfigModel.company_id != None, ExportConfigModel.company_id == user.company.id, ExportConfigModel.ad_hoc == False, ExportConfigModel.deleted == False).all()

    def resolve_export_config(parent, info, id):
        return ExportConfig.get_query(info).filter(ExportConfigModel.id == id).first()

    def resolve_get_exports(parent, info):
        user = info.context.user
        configs = ExportConfig.get_query(info).filter(ExportConfigModel.company_id != None, ExportConfigModel.company_id == user.company.id, ExportConfigModel.deleted == False).all()
        configs_list = [config.id for config in configs]
        return Export.get_query(info).filter(ExportModel.export_config_id.in_(configs_list), ExportModel.deleted == False).all()

    def resolve_all_persons(parent, info, source_id=None):
        # Forward request to aingine
        response = call_aingine(info)

        # Response comes as json, instantiate it to sqlalchemy objects
        result = instantiate_graph(response, constructor=funnel_models.Person)

        return result

    def resolve_paginated_persons(parent, info, page=None, page_size=None, source_id=None, search=None, order_by='id', order_direction='asc'):
        # Forward request to aingine
        response = call_aingine(info)
        # Response comes as json, instantiate it to sqlalchemy objects
        result = instantiate_graph(response["data"], constructor=funnel_models.Person)

        return PaginatedPerson(
            data=result,
            count=response["count"]
        )

    def resolve_person(parent, info, id=None):
       # Forward request to aingine
        response = call_aingine(info)

        # Response comes as json, instantiate it to sqlalchemy objects
        result = instantiate_graph(response, constructor=funnel_models.Person)

        return result 
    
    def resolve_person_descriptor(self, info):
        descriptor = SQLAlchemyDescriptor(model=funnel_models.Person)
        return descriptor.fields

    def resolve_all_unique_sources(parent, info, exclude=None):
        # Forward request to aingine
        response = call_aingine(info)

        # Response comes as json, instantiate it to sqlalchemy objects
        result = instantiate_graph(response, constructor=funnel_models.Source)

        return result 
    
    def resolve_get_eval_terms(parent, info):
        return EvalTerm.get_query(info).filter(or_(EvalTermModel.include == True, EvalTermModel.exclude == True)).all()

    def resolve_company_lead_files(parent, info):
        user = info.context.user
        return CompanyLeadFiles.get_query(info).filter(CompanyLeadFilesModel.company_id == user.company_id).all()

    def resolve_leads(parent, info):
        user = info.context.user
        return Leads.get_query(info).filter(LeadsModel.company_id == user.company_id, LeadsModel.is_deleted == False).all()

    def resolve_lead(parent, info, id):
        user = info.context.user
        return Leads.get_query(info).filter(LeadsModel.company_id == user.company_id, LeadsModel.id == id, LeadsModel.is_deleted == False).one()

    def resolve_get_leads(parent, info, page=None, page_size=None, source=None, source_original=None, combined_source=None, order_by='id', order_direction='asc', search=None, voi=None, campaign_id=None, status=None, lead_status_types=[]):
        user = info.context.user

        if order_by == 'latest_chat':
            latest_messages = db.session.query(MessageModel.id).order_by(MessageModel.lead_id, MessageModel.id.desc()).distinct(MessageModel.lead_id).all()
            
            last_chat_date = case(
                [(MessageModel.date_sent != None, MessageModel.date_sent),
                (MessageModel.date_received != None, MessageModel.date_received)],
                else_ = None
            ).label('last_chat_date')
        
            leads = db.session.query(LeadsModel, last_chat_date) \
                        .join(LeadStatusTypeModel, isouter = True) \
                        .join(MessageModel, MessageModel.lead_id == LeadsModel.id, isouter = True) \
                        .filter(LeadsModel.company_id == user.company_id, 
                                LeadsModel.is_deleted == False,
                                or_(MessageModel.id.in_(latest_messages),
                                MessageModel.id.is_(None)))
        else:
            leads = db.session.query(LeadsModel) \
                        .join(LeadStatusTypeModel, isouter = True) \
                        .filter(LeadsModel.company_id == user.company_id, 
                                LeadsModel.is_deleted == False)
        
        if campaign_id != None:
            if campaign_id == -1:
                or_lead_id_list = []
                or_source_list = []
                or_file_id_list = []
                or_status_list = []
                other_lead_source = db.session.query(LeadSource).filter(LeadSource.name == 'Other').first()
                campaigns = CampaignModel.query.filter(CampaignModel.company_id == user.company_id).all()
                for campaign in campaigns:
                    if campaign.campaign_type.type.value != 'DEFAULT':
                        q = CampaignSelectionsModel.query.filter(CampaignSelectionsModel.campaign_id == campaign.id).all()
                        if q and len(q) and q[0].type.value == 'LEAD':
                            campaign_leads = get_campaign_leads(campaign.id, user)
                            for lead in campaign_leads:
                                or_lead_id_list.append(LeadsModel.id != lead.id)
                        elif q and len(q) and (q[0].type.value == 'SOURCE' or q[0].type.value == 'STATUS'):
                            for row in q:
                                if row.type.value == 'SOURCE':
                                    source_id = row.value
                                    or_source_list(or_(~LeadsModel.lead_source_original_id == source_id, LeadsModel.lead_source_original_id == other_lead_source.id))
                                elif row.type.value == 'STATUS':
                                    or_status_list.append(LeadsModel.lead_status_type_id != row.value)
                                
                        elif q and len(q) and q[0].type.value == 'FILE':
                            or_file_id_list.append(LeadsModel.lead_file_id != q[0].value)
                
                leads = leads.filter(*or_lead_id_list, *or_source_list, *or_file_id_list, *or_status_list)
            elif campaign_id != -1:
                leads = get_campaign_leads(campaign_id, user)

        if status:
            campaign_lead_summries = db.session.query(LeadsModel.id,
                                                func.min(case(value=CampaignLeadSummaryModel.status, whens=campaign_lead_summry_status).label("status"))). \
                                        join(CampaignLeadSummaryModel, isouter=True). \
                                        group_by(LeadsModel.id).filter(LeadsModel.is_deleted == False)

            db_status = [6, 7, None]
            if status == 'RESPONDED':
                db_status = [0, 1, 2]
            elif status == 'WAITING_FOR_REPLY':
                db_status = [3, 4, 5]
                
            status_lead_ids = [campaign_lead_summry[0] for campaign_lead_summry in campaign_lead_summries if  campaign_lead_summry[1] in db_status]
            leads = leads.filter(LeadsModel.id.in_(status_lead_ids))

        orFilter = []
        if source and len(source) >= 1 and source[0] != "":
            for x in source:
                orFilter.append(cast(LeadsModel.lead_source_type, SqlString) == x)
            leads = leads.filter(or_(*orFilter))

        if lead_status_types and len(lead_status_types) >= 1 and lead_status_types[0] != "":
            leads = leads.filter(LeadsModel.lead_status_type_id.in_(lead_status_types))

        orFilter = []
        if source_original and len(source_original) >= 1 and source_original[0] != "":
            for x in source_original:
                orFilter.append(LeadsModel.lead_source_original_id == x)
            leads = leads.filter(or_(*orFilter))

        orFilter = []
        if combined_source and len(combined_source) >= 1 and combined_source[0] != "":
            for x in combined_source:
                sourceList = x.split("/")
                if len(sourceList) == 2:
                    lead_source = LeadSourceModel.query.filter(LeadSourceModel.id == sourceList[1].strip()).first()
                    if lead_source:
                        orFilter.append(and_(cast(LeadsModel.lead_source_type, SqlString) == sourceList[0].strip(), LeadsModel.lead_source_original_id == lead_source.id))
            leads = leads.filter(or_(*orFilter))

        orFilter = []
        if voi and len(voi)>=1 and voi[0] != "":
            for x in voi:
                voi_list = x.split(" ")
                make = voi_list[0]
                model = " ".join(voi_list[1:-1])
                year = voi_list[-1]
                orFilter.append(and_(LeadVehicleOfInterestModel.make == make, LeadVehicleOfInterestModel.model == model, LeadVehicleOfInterestModel.year == year))
            leads = leads.join(LeadVehicleOfInterestModel).filter(or_(*orFilter))

        if search:
            lead_name = leads.filter(or_(LeadsModel.full_name.ilike(f"%{search}%"), cast(LeadsModel.lead_source_type, SqlString).ilike(f"%{search}%")))
            lead_email = leads.join(LeadEmailsModel).filter(LeadEmailsModel.email.ilike(f"%{search}%"))
            lead_number = leads.join(LeadPhonesModel).filter(LeadPhonesModel.phone.ilike(f"%{search}%"))
            lead_address = leads.join(LeadAddressesModel).filter(LeadAddressesModel.location_text.ilike(f"%{search}%"))
            lead_source = leads.join(LeadSourceModel,LeadSourceModel.id == LeadsModel.lead_source_original_id ).filter(LeadSourceModel.name.ilike(f"%{search}%"))
            if voi and len(voi)>=1 and voi[0] != "":
                lead_voi = leads.filter(or_(LeadVehicleOfInterestModel.make.ilike(f"%{search}%"), LeadVehicleOfInterestModel.model.ilike(f"%{search}%"), LeadVehicleOfInterestModel.year.ilike(f"%{search}%")))
            else:
                lead_voi = leads.join(LeadVehicleOfInterestModel).filter(or_(LeadVehicleOfInterestModel.make.ilike(f"%{search}%"), LeadVehicleOfInterestModel.model.ilike(f"%{search}%"), LeadVehicleOfInterestModel.year.ilike(f"%{search}%")))

            leads = lead_name.union_all(lead_email, lead_number, lead_address, lead_voi, lead_source)

        sort_by_fn = None
        if order_by == 'latest_chat':
            sort_by_fn = nullslast(text(f'last_chat_date {order_direction}'))
        elif order_by == 'lead_status_type':
            sort_by_fn = getattr(getattr(LeadStatusTypeModel, 'type'), order_direction)()
        else:
            sort_by_fn = getattr(getattr(LeadsModel, order_by), order_direction)()
        
        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = leads.order_by(sort_by_fn)
        elif page == 1:
            data = leads.order_by(sort_by_fn).limit(page_size)
        else:
            data = leads.order_by(sort_by_fn).offset((page-1)*page_size).limit(page_size)
        
        count = get_count(leads)
        
        return PaginatedLeads(
            data=[lead[0] for lead in data] if order_by == 'latest_chat' else data,
            count=count
        )

    def resolve_lead_descriptor(self, info):
        descriptor = SQLAlchemyDescriptor(model=LeadsModel)
        return descriptor.fields

    def resolve_get_all_voi(self, info, page=None, page_size=None, source=None, source_original=None, search=None, combined_source=None):
        user = info.context.user
        query = LeadVehicleOfInterest.get_query(info).join(LeadsModel, LeadsModel.id == LeadVehicleOfInterestModel.lead_id).filter(user.company_id == LeadsModel.company_id, LeadsModel.is_deleted == False)

        orFilter = []
        if source and len(source) >= 1 and source[0] != "":
            for x in source:
                orFilter.append(cast(LeadsModel.lead_source_type, SqlString) == x)
            query = query.filter(or_(*orFilter))

        orFilter = []
        if source_original and len(source_original) >= 1 and source_original[0] != "":
            for x in source_original:
                lead_source = LeadSourceModel.query.filter(LeadSourceModel.name == x).first()
                if lead_source:
                    orFilter.append(LeadsModel.lead_source_original_id == lead_source.id)
            query = query.filter(or_(*orFilter))

        orFilter = []
        if combined_source and len(combined_source) >= 1 and combined_source[0] != "":
            for x in combined_source:
                sourceList = x.split("/")
                if len(sourceList) == 2:
                    lead_source = LeadSourceModel.query.filter(LeadSourceModel.name == sourceList[1].strip()).first()
                    if lead_source:
                        orFilter.append(and_(cast(LeadsModel.lead_source_type, SqlString) == sourceList[0].strip(), LeadsModel.lead_source_original_id == lead_source.id))
            query = query.filter(or_(*orFilter))

        if search:
            query = query.filter(or_(LeadVehicleOfInterestModel.make.ilike(f"%{search}%"), LeadVehicleOfInterestModel.model.ilike(f"%{search}%"), LeadVehicleOfInterestModel.year.ilike(f"%{search}%")))

        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page_size == None or page == None:
            if page_size:
                query = query.limit(page_size)
            else:
                query = query.limit(25)
        elif page == 1:
            query = query.limit(page_size)
        else:
            query = query.offset((page-1)*page_size).limit(page_size)
            
        voi = []
        for row in query:
            _voi = " ".join(list(filter(lambda x: x, [row.make or "N/A", row.model or "N/A", row.year or "N/A"])))
            voi.append(_voi)

        return voi

    def resolve_get_all_source_original(self, info):
        #user = info.context.user
        #query = Leads.get_query(info).filter(user.company_id == LeadsModel.company_id)
        #query = query.distinct(LeadsModel.lead_source_original)
        query = LeadSource.get_query(info).all()
        original_source = []
        for row in query:
            original_source.append(row.name)
        return original_source

    def resolve_campaigns(parent, info):
        user = info.context.user
        camapigns = Campaign.get_query(info) \
                    .join(CampaignTypes) \
                    .filter(CampaignModel.company_id == user.company_id, 
                            CampaignTypes.type != CampaignManageType.DEFAULT,
                            CampaignModel.is_disabled == False)
        return camapigns.order_by(getattr(getattr(CampaignModel, "id"), "asc")())
    
    def resolve_get_campaigns(parent, info, company_id, page=None, page_size=None, search='%', order_by='date_created', order_direction='desc', active_ind=None):
        orFilter = []
        if active_ind != None:
            orFilter.append(CampaignModel.active_ind == active_ind)
            
        orFilter.append(and_(CampaignModel.company_id == company_id, CampaignModel.is_disabled == False ,or_(CampaignModel.name.ilike(f"%{search}%"))))

        campaigns = Campaign.get_query(info).join(CampaignTypes) \
                            .filter(CampaignTypes.type != CampaignManageType.DEFAULT)

        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = campaigns.filter(*orFilter).order_by(getattr(getattr(CampaignModel, order_by), order_direction)())
        elif page == 1:
            data = campaigns.filter(*orFilter).order_by(getattr(getattr(CampaignModel, order_by), order_direction)()).limit(page_size)
        else:
            data = campaigns.filter(*orFilter).order_by(getattr(getattr(CampaignModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)
        count = campaigns.filter(*orFilter).order_by(getattr(getattr(CampaignModel, order_by), order_direction)()).count()
        lead_message_count = []
        for campaign in data:
            lead_message_count.append(CampaignRepository.get_campaign_lead_summary(campaign.id, info.context.user))
        
        return PaginatedCampaign(
            data=data,
            lead_message_count=lead_message_count,
            count=count
        )

    def resolve_campaign(parent, info, id):
        return Campaign.get_query(info).filter(CampaignModel.id == id).first()
    
    def resolve_lead_sources(parent, info):
        return LeadSource.get_query(info).all()
    
    def resolve_campaign_schedules(parent, info, campaign_id):
        return CampaignSchedules.get_query(info).filter(CampaignSchedulesModel.campaign_id == campaign_id).all()
    
    def resolve_get_campaign_templates(parent, info, campaign_id, source_id=None, schedule_id=None, page=None, page_size=None, search='%', order_by='id', order_direction='asc'):
        campaign_templates = CampaignTemplates.get_query(info).filter(CampaignTemplatesModel.campaign_id == campaign_id)
        
        if source_id != None:
            campaign_templates = campaign_templates.filter(CampaignTemplatesModel.source_id == source_id)
        
        if schedule_id != None:
            campaign_templates = campaign_templates.filter(CampaignTemplatesModel.schedule_id == schedule_id)
        
        # if search:
        #     campaign_templates = campaign_templates.filter(CampaignTemplatesModel.template_text.ilike(f"%{search}%"))
        
        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = campaign_templates.order_by(getattr(getattr(CampaignTemplatesModel, order_by), order_direction)())
        elif page == 1:
            data = campaign_templates.order_by(getattr(getattr(CampaignTemplatesModel, order_by), order_direction)()).limit(page_size)
        else:
            data = campaign_templates.order_by(getattr(getattr(CampaignTemplatesModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)
        count = campaign_templates.order_by(getattr(getattr(CampaignTemplatesModel, order_by), order_direction)()).count()
        return PaginatedCampaignTemplates(
            data=data,
            count=count
        )
    
    
    def resolve_campaign_schedules(parent, info, campaign_id):
        return CampaignSchedules.get_query(info).filter(CampaignSchedulesModel.campaign_id == campaign_id).all()

    def resolve_messages(parent, info, lead_id, last_id = None, page=None, page_size=None):
        order_by = 'id'
        order_direction = 'desc'
        messages = Message.get_query(info).filter(MessageModel.lead_id == lead_id)

        lead = db.session.query(LeadsModel).filter(LeadsModel.id == lead_id).first()
        if lead.unread_count > 0:
            util.update_lead_status(lead, lead_activity = 'READ_MESSAGE')
            lead.unread_count = 0
            db.session.add(lead)
            db.session.commit()
            unread_messages = messages.filter(MessageModel.is_read == False)
            for unread_message in unread_messages:
                unread_message.is_read = True
                db.session.add(unread_message)
                db.session.commit()

        is_refresh = False
        if last_id and messages.filter(MessageModel.id > last_id).first():
            page = 1
            is_refresh = True
        
        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = messages.order_by(getattr(getattr(MessageModel, order_by), order_direction)())
        elif page == 1:
            data = messages.order_by(getattr(getattr(MessageModel, order_by), order_direction)()).limit(page_size)
            last_id = data[0].id if data.first() else 0
        else:
            data = messages.order_by(getattr(getattr(MessageModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)
        
        count = messages.order_by(getattr(getattr(MessageModel, order_by), order_direction)()).count()

        return PaginatedMessage(
            data = data,
            count = count,
            last_id = last_id,
            is_refresh = is_refresh
        ) 

    def resolve_message(parent, info, id):
        return Message.get_query(info).filter(MessageModel.id == id).one()

    def resolve_channel(parent, info, id):
        return Channel.get_query(info).filter(ChannelModel.id == id).one()

    def resolve_channels(parent, info):
        return Channel.get_query(info).all()

    def resolve_message_log(parent, info, id):
        return MessageLog.get_query(info).filter(MessageLogModel.id == id).one()
    
    def resolve_get_campaign_lead_summary(parent, info, campaign_id=None, lead_id=None,status=None, attempt=None,search='', page=None, page_size=None, order_by='full_name', order_direction='asc'):
        campaign_lead_summary = CampaignLeadSummary.get_query(info)
        if campaign_id != None:
            campaign_lead_summary = campaign_lead_summary.filter(CampaignLeadSummaryModel.campaign_id == campaign_id)
        if lead_id != None:
            campaign_lead_summary = campaign_lead_summary.filter(CampaignLeadSummaryModel.lead_id == lead_id)
        orFilter = []
        if status and len(status) >= 1 and status[0] != "":
            for x in status:
                orFilter.append(cast(CampaignLeadSummaryModel.status, SqlString) == x)
            campaign_lead_summary = campaign_lead_summary.filter(or_(*orFilter))

        orFilter = []
        if attempt and len(attempt) >= 1 and attempt[0] != "":
            for x in attempt:
                if ">" in x :
                    attempts = x.split(">")
                    orFilter.append(CampaignLeadSummaryModel.num_attempts_before_response > int(attempts[1]))
                elif "<" in x :
                    attempts = x.split("<")
                    orFilter.append(CampaignLeadSummaryModel.num_attempts_before_response < int(attempts[1]))
                else:
                    orFilter.append(cast(CampaignLeadSummaryModel.num_attempts_before_response, SqlString) == x)
            campaign_lead_summary = campaign_lead_summary.filter(or_(*orFilter))

        if search:
            campaign_lead_summary = campaign_lead_summary.join(LeadsModel).filter(LeadsModel.full_name.ilike(f"%{search}%"))
        
        if order_by == "full_name":
            campaign_lead_summary = campaign_lead_summary.join(LeadsModel).order_by(getattr(getattr(LeadsModel, order_by), order_direction)())
        else:
            campaign_lead_summary = campaign_lead_summary.order_by(getattr(getattr(CampaignLeadSummaryModel, order_by), order_direction)())

        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = campaign_lead_summary
        elif page == 1:
            data = campaign_lead_summary.limit(page_size)
        else:
            data = campaign_lead_summary.offset((page-1)*page_size).limit(page_size)

        count = campaign_lead_summary.count()
        return PaginatedCampaignLeadSummary(
            data=data,
            count=count,
            lead_message_count=CampaignRepository.get_campaign_lead_summary(campaign_id, info.context.user)
        )
    
    def resolve_get_engagement_analytics(parent, info, range=30, **args):
        return EngagementDashboardRepository.get_campaign_lead_summary(range, info.context.user)
    
    def resolve_get_engagement_lead_analytics(parent, info, range=30, **args):
        return EngagementDashboardRepository.get_engagement_lead_summary(range, info.context.user)
    
    def resolve_get_lead_analytics(parent, info, range=30, **args):
        return EngagementDashboardRepository.get_lead_analytics(range, info.context.user)
    
    def resolve_get_appointment_source(parent, info, range=30, **args):
        return EngagementDashboardRepository.get_appointment_by_source(range, info.context.user)

    def resolve_get_appointment_salesperson(parent, info, range=30, **args):
        return EngagementDashboardRepository.get_appointment_by_salesperson(range, info.context.user)

    def resolve_get_appointment_analysis(self, info, range=30, **args):
        return EngagementDashboardRepository.get_appointment_analysis(range, info.context.user)

    def resolve_get_crm_users(parent, info):
        user = info.context.user
        crm_users = pull_crm_users(user.company_id)
        results = []
        for user in crm_users:
           results.append(schema.CrmUsers(user["UserId"], user["FirstName"] + " "+ user["LastName"]))
        return results

    def resolve_get_vin_crm_user(parent, info, crm_integration_id, user_id):
        crmUser =  VinSolutionsUser.get_query(info).filter(VinSolutionsUserModel.crm_integration_id == crm_integration_id,VinSolutionsUserModel.user_id == user_id).first()
        return crmUser
    
    def resolve_engagement_message_templates(parent, info, template_type, company_id=None, user_id=None, is_active=None):
        engagement_message_templates = EngagementMessageTemplate.get_query(info) \
                                            .filter(
                                                EngagementMessageTemplateModel.is_deleted == False)

        if is_active is not None:
            engagement_message_templates = engagement_message_templates.filter(
                                                EngagementMessageTemplateModel.is_active == is_active)
        
        if template_type == 'ALL':
            engagement_message_templates = engagement_message_templates.filter(
                                                or_(EngagementMessageTemplateModel.company_id == company_id, 
                                                    EngagementMessageTemplateModel.company_id.is_(None)))
        
        elif template_type == 'OWN':
            engagement_message_templates = engagement_message_templates.filter(
                                                    EngagementMessageTemplateModel.company_id == company_id, 
                                                    EngagementMessageTemplateModel.user_id == user_id)
        
        elif template_type == 'COMPANY':
            engagement_message_templates = engagement_message_templates.filter(
                                                    EngagementMessageTemplateModel.company_id == company_id, 
                                                    EngagementMessageTemplateModel.is_company_shared == True)

        elif template_type == 'GLOBAL':
            engagement_message_templates = engagement_message_templates.filter(
                                                    EngagementMessageTemplateModel.company_id.is_(None))

        # if company_id is not None:
        #     engagement_message_templates = engagement_message_templates.filter(
        #                                         EngagementMessageTemplateModel.company_id == company_id)

        # if company_id is None:
        #     engagement_message_templates = engagement_message_templates.filter(EngagementMessageTemplateModel.company_id.is_(None))
        # elif company_id == 0:
        #     engagement_message_templates = engagement_message_templates.all()
        # else:    
        #     engagement_message_templates = engagement_message_templates.filter(or_(EngagementMessageTemplateModel.company_id == company_id, EngagementMessageTemplateModel.company_id.is_(None)))

        return engagement_message_templates

    def resolve_get_lead_appointment(parent, info, lead_id, page=None, page_size=None, order_by='id', order_direction='asc', search=None, start_date=None, end_date=None, appointment_status=None):
        appointment = Appointment.get_query(info).filter(AppointmentModel.lead_id == lead_id)

        orFilter = []
        if appointment_status and len(appointment_status) >= 1 and appointment_status[0] != "":
            for x in appointment_status:
                orFilter.append(cast(AppointmentModel.appointment_status, SqlString) == x)
            appointment = appointment.filter(or_(*orFilter))

        if start_date and end_date:
            appointment = appointment.filter(func.date(AppointmentModel.start_datetime) >= start_date, func.date(AppointmentModel.end_datetime) <= end_date)

        if search:
            appointment = appointment.filter(or_(AppointmentModel.summary.ilike(f"%{search}%"), AppointmentModel.description.ilike(f"%{search}%")))

        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = appointment.order_by(getattr(getattr(AppointmentModel, order_by), order_direction)())
        elif page == 1:
            data = appointment.order_by(getattr(getattr(AppointmentModel, order_by), order_direction)()).limit(page_size)
        else:
            data = appointment.order_by(getattr(getattr(AppointmentModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)
        count = appointment.order_by(getattr(getattr(AppointmentModel, order_by), order_direction)()).count()
        return PaginatedAppointment(
            data=data,
            count=count
        )

    def resolve_get_user_appointment(parent, info, user_id=None, company_id=None, lead_id=None, page=None, page_size=None, order_by='id', order_direction='asc', search=None, start_date=None, end_date=None, appointment_status=None):
        if user_id:
            appointments = Appointment.get_query(info).filter(AppointmentModel.user_id == user_id)
        elif company_id:
            appointments = Appointment.get_query(info).filter(AppointmentModel.company_id == company_id)
        else:
            return PaginatedAppointment(
                data=[],
                count=0
            )

        if lead_id:
            appointments = appointments.filter(AppointmentModel.lead_id == lead_id)

        orFilter = []
        if appointment_status and len(appointment_status) >= 1 and appointment_status[0] != "":
            for x in appointment_status:
                orFilter.append(cast(AppointmentModel.appointment_status, SqlString) == x)
            appointments = appointments.filter(or_(*orFilter))

        if start_date and end_date:
            appointments = appointments.filter(func.date(AppointmentModel.start_datetime) >= start_date, func.date(AppointmentModel.end_datetime) <= end_date)

        if search:
            appointments = appointments.filter(or_(AppointmentModel.summary.ilike(f"%{search}%"), AppointmentModel.description.ilike(f"%{search}%")))

        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = appointments.order_by(getattr(getattr(AppointmentModel, order_by), order_direction)())
        elif page == 1:
            data = appointments.order_by(getattr(getattr(AppointmentModel, order_by), order_direction)()).limit(page_size)
        else:
            data = appointments.order_by(getattr(getattr(AppointmentModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)
        count = appointments.order_by(getattr(getattr(AppointmentModel, order_by), order_direction)()).count()
        return PaginatedAppointment(
            data=data,
            count=count
        )


    def resolve_get_company_working_hours(parent, info, company_id):
        #user = info.context.user
        return CompanyWorkingHours.get_query(info).filter(
                                            CompanyWorkingHoursModel.company_id == company_id,
                                            CompanyWorkingHoursModel.is_active == True, CompanyWorkingHoursModel.is_deleted == False).order_by(CompanyWorkingHoursModel.week_day)

    def resolve_leads_by_status(parent, info):
        user = info.context.user

        campaign_lead_summries = db.session.query(LeadsModel.id,
                                                func.min(case(value=CampaignLeadSummaryModel.status, whens=campaign_lead_summry_status).label("status"))) \
                                        .join(CampaignLeadSummaryModel, isouter=True) \
                                        .group_by(LeadsModel.id).filter(
                                            LeadsModel.is_deleted == False,
                                            LeadsModel.company_id == user.company_id)
                                        
        uncontacted_count = 0
        waiting_replay_count = 0
        responded_count = 0
        
        for campaign_lead_summry in campaign_lead_summries:
            status = campaign_lead_summry[1] 
            if status in [0, 1, 2]:
                responded_count += 1
            elif status in [3, 4, 5]:
                waiting_replay_count += 1
            else:
                uncontacted_count += 1

        leads_by_status = []
        leads_by_status.append(
            LeadsByStatus(responded_count, 'RESPONDED')
        )
        leads_by_status.append(
            LeadsByStatus(waiting_replay_count, 'WAITING_FOR_REPLY')
        )
        leads_by_status.append(
            LeadsByStatus(uncontacted_count, 'UNCONTACTED')
        )

        return leads_by_status

    def resolve_get_twilio_phone_services(parent, info, company_id, types=[], search=None, page=None, page_size=None, order_by='id', order_direction='asc'):
        try:
            user = info.context.user
            twilio_phone_services = TwilioPhoneService.get_query(info). \
                                            join(UserModel, UserModel.id == TwilioPhoneServiceModel.user_id). \
                                            filter(TwilioPhoneServiceModel.company_id == company_id, 
                                                    TwilioPhoneServiceModel.is_deleted == False)

            orFilter = []
            if types and len(types) >= 1 and types[0] != "":
                for type in types:
                    orFilter.append(cast(TwilioPhoneServiceModel.type, SqlString) == type)
                twilio_phone_services = twilio_phone_services.filter(or_(*orFilter))

            if search:
                twilio_phone_services = twilio_phone_services.filter(or_(
                                                        UserModel.email.ilike(f"%{search}%"), 
                                                        UserModel.phone.ilike(f"%{search}%"),
                                                        TwilioPhoneServiceModel.service_name.ilike(f"%{search}%"),
                                                        TwilioPhoneServiceModel.description.ilike(f"%{search}%")
                                                    ))    
            if page != None and page_size != None and (page <= 0 or page_size <= 0):        
                return PaginatedTwilioPhoneService(
                    data=[],
                    count=0,
                    status_code = HTTPStatus.BAD_REQUEST.value,
                    message="Values of page and page_size must be >0!"
                )
            elif page == None or page_size == None:        
                data = twilio_phone_services.order_by(getattr(getattr(TwilioPhoneServiceModel, order_by), order_direction)())
            elif page == 1:        
                data = twilio_phone_services.order_by(getattr(getattr(TwilioPhoneServiceModel, order_by), order_direction)()).limit(page_size)
            else:        
                data = twilio_phone_services.order_by(getattr(getattr(TwilioPhoneServiceModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)    
            count = twilio_phone_services.order_by(getattr(getattr(TwilioPhoneServiceModel, order_by), order_direction)()).count()
            
            return PaginatedTwilioPhoneService(
                data=data,
                count=count,
                status_code = HTTPStatus.OK.value,
                message="Retrive data successfully"
            )
        except Exception as e:
            traceback.print_exc()
            return PaginatedTwilioPhoneService(
                data=[],
                count=0,
                status_code = HTTPStatus.BAD_REQUEST.value,
                message="Something went wrong"
            )
    
    def resolve_lead_status_types(parent, info):
        return LeadStatusType.get_query(info).all()

    def resolve_vehicle_of_interest(parent, info):
        return VehicleOfInterest.get_query(info).all()

    def resolve_get_vehicle_makes(parent, info, search=None, page=1, page_size=50):
        # Reuqest the third party API to get all makes.
        res = requests.get('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json')
        data = json.loads(res.content)

        results = data['Results']

        # Using search function to filter the data from response.
        if search is not None:
            search = search.lower()
            results = list(filter(lambda make: search in make['Make_Name'].lower(), results))

        count = data['Count']
        if page != None and page_size != None and (page <= 0 or page_size <= 0):        
            return VehicleMakes(
                data=[],
                count=0,
                status_code = HTTPStatus.BAD_REQUEST.value,
                message="Values of page and page_size must be >0!"
            )
        else:
            start = (page-1) * page_size
            length = page_size + start
            results = results[start:length]

        return VehicleMakes(
            data = results,
            count = count,
            status_code = HTTPStatus.OK.value,
            message="Retrive data successfully"
        )

    def resolve_get_vehicle_models(parent, info, make_name, year, search=None):
        # Reuqest the third party API to get all models using make_id & year.
        vehicle_types = ['car', 'truck']
        results = []
        count = 0
        for vehicle_type in vehicle_types:
            res = requests.get(f'https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/{make_name}/modelyear/{year}/vehicleType/{vehicle_type}?format=json')
            data = json.loads(res.content)

            results += data['Results']
            count += data['Count']

        # Using search function to filter the data from response.
        if search is not None:
            search = search.lower()
            results = filter(lambda model: search in model['Model_Name'].lower(), results)

        return VehicleModels(
            data = results,
            count = count,
            status_code = HTTPStatus.OK.value,
            message="Retrive data successfully"
        )
    
    def resolve_get_campaign_by_lead(parent, info, lead_id, page=1, page_size=50):
        order_by='date_created' 
        order_direction='desc'
        orFilter = []
        campaign_lead_summary = db.session.query(CampaignLeadSummaryModel.campaign_id).distinct(CampaignLeadSummaryModel.campaign_id).filter(CampaignLeadSummaryModel.lead_id == lead_id)

        campaigns = Campaign.get_query(info).filter(and_(CampaignModel.active_ind == "Active", CampaignModel.is_disabled == False,CampaignModel.id.in_(campaign_lead_summary))).join(CampaignTypes).filter(CampaignTypes.type != CampaignManageType.DEFAULT)
       
        if campaigns.count() <= 0:
            campaigns = Campaign.get_query(info).filter(and_(CampaignModel.is_disabled == False,CampaignModel.id.in_(campaign_lead_summary))).join(CampaignTypes).filter(CampaignTypes.type != CampaignManageType.DEFAULT)

        if page != None and page_size != None and (page <= 0 or page_size <= 0):
            raise Exception("Values of page and page_size must be >0!")
        elif page == None or page_size == None:
            data = campaigns.filter(*orFilter).order_by(getattr(getattr(CampaignModel, order_by), order_direction)())
        elif page == 1:
            data = campaigns.filter(*orFilter).order_by(getattr(getattr(CampaignModel, order_by), order_direction)()).limit(page_size)
        else:
            data = campaigns.filter(*orFilter).order_by(getattr(getattr(CampaignModel, order_by), order_direction)()).offset((page-1)*page_size).limit(page_size)
        count = campaigns.filter(*orFilter).order_by(getattr(getattr(CampaignModel, order_by), order_direction)()).count()
        lead_message_count = []
        for campaign in data:
            lead_message_count.append(CampaignRepository.get_campaign_lead_summary(campaign.id, info.context.user))
        
        return PaginatedCampaign(
            data=data,
            lead_message_count=lead_message_count,
            count=count
        )

    def resolve_get_company_nudge_event(parent, info, company_id):
        nudge_events = db.session.query(NudgeEventModel, CompanyNudgeEventModel) \
                            .join(CompanyNudgeEventModel, 
                                    and_(
                                        CompanyNudgeEventModel.nudge_event_id == NudgeEventModel.id,
                                        CompanyNudgeEventModel.company_id == company_id), isouter = True) \
                            .filter(NudgeEventModel.is_active == True)
        
        return [
                CompanyNudgeEvents(
                    nudge_event = nudge_event[0], 
                    company_nudge_event = nudge_event[1]) 
                for nudge_event in nudge_events
            ] 

class LeadQuery(ObjectType):
    get_lead_appointment_details = Field(LeadAppointmentDetails, appointment_id=String(required=True))

    def resolve_get_lead_appointment_details(parent, info, appointment_id):
        try:
            decrypted_token = encrypt_decrypt.Crypt().decrypt_message(appointment_id)
            
            if not decrypted_token:
                return LeadAppointmentDetails(
                    status_code = HTTPStatus.BAD_REQUEST.value,
                    message="Invalid Token"
                )
            
            decrypted_token_split = decrypted_token.split("|")
            decrypted_appointment_id = decrypted_token_split[0]
            valid_date = datetime.strptime(decrypted_token_split[1], '%d-%m-%Y %H:%M')
            if valid_date < datetime.utcnow():
                return LeadAppointmentDetails(
                    status_code = HTTPStatus.BAD_REQUEST.value,
                    message="Token is expired"
                )

            if decrypted_appointment_id and decrypted_appointment_id.isnumeric():
                appointment = Appointment.get_query(info).filter(AppointmentModel.id == int(decrypted_appointment_id)).first()
                if not appointment:
                    return LeadAppointmentDetails(
                        status_code = HTTPStatus.NOT_FOUND.value,
                        message="Appointment doesn't exist"
                    )
                    
                active_appointments = Appointment.get_query(info).filter(
                                                AppointmentModel.start_datetime.between(datetime.utcnow() - timedelta(days=30), datetime.utcnow() + timedelta(days=30)),
                                                AppointmentModel.appointment_status.in_(['SCHEDULED', 'RESCHEDULED']),
                                                AppointmentModel.user_id == appointment.user_id)

                return LeadAppointmentDetails(
                    appointment = appointment,
                    company = appointment.company,
                    working_hours = appointment.company.working_hours,
                    active_appointments = active_appointments,
                    status_code = HTTPStatus.OK.value,
                    message="Retrive data successfully"
                )
            return LeadAppointmentDetails(
                status_code = HTTPStatus.BAD_REQUEST.value,
                message="Invalid Token"
            )
        except:
            traceback.print_exc()
            return LeadAppointmentDetails(
                    status_code = HTTPStatus.BAD_REQUEST.value,
                    message="Something went wrong"
                )


class ReviewQuery(ObjectType):
    # review
    get_review = Field(Review, email=String(), head=String(), body=String(), company=Int(), _type=String())
    company = Field(Company, id=Int(required=True))

    # def resolve_get_review(parent, info, **args):
    #     print("in resolve_get_reviews")
    #     result = elasticsearch.execute_search(info.context.user, args)
    #     return PaginatedReview(
    #         data=result["review_list"],
    #         count=result["total_hits"]
    #     )

    def resolve_company(parent, info, id):
        return Company.get_node(info, id)