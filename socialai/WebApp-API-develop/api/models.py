from elasticsearch_dsl.query import Bool
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Enum, DateTime, UniqueConstraint, Float, Text, ARRAY, Time, or_, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import null
from sqlalchemy.sql.functions import register_function
from api import db
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.exc import IntegrityError
import enum
from datetime import datetime, timedelta

class FilterGroupType(enum.Enum):
    MULTISELECT = 'Multiselect'
    SELECT = 'Select'
    TEXT = 'Text'
    TEMPLATE = 'Template'
    RANGE = 'Range'


class FilterField(enum.Enum):
    PREDICTIONS = 'Predictions'
    TAGS = 'Tags'
    BODY = 'Body'
    LOCATION = 'Location'


class AingineDataStatus(enum.Enum):
    ACCEPTED = 'Accepted'
    REJECTED = 'Rejected'
    SAVED = 'Saved'
    VIEWED = 'Viewed'


class DealStrength(enum.Enum):
    HOT = 'Hot'
    WARM = 'Warm'
    COLD = 'Cold'


class DealStatus(enum.Enum):
    ACTIVE = 'Active'
    DEAL_WON = 'Deal Won'
    DEAL_LOST = 'Deal Lost'
    PUSHED_CRM = 'Pushed to CRM'
    EXPIRED = 'Expired'
    ARCHIVED = 'Archive'


class EntryType(enum.Enum):
    ORIGINAL = 'Original Message'
    SENT = 'Sent'
    RECEIVED = 'Received'
    NOTE = 'Comment'


class TeamStatus(enum.Enum):
    ACTIVE = 'Active'
    INACTIVE = 'Inactive'

class CrmIntegrationType(enum.Enum):
    ADF = 'ADF'
    DS = 'DealerSocket'
    VIN = 'Vin Solutions'
    SF = 'Salesforce'


class UserStatus(enum.Enum):
    PENDING = 'Pending'
    ACTIVATED = 'Activated'

class UserAccountStatus(enum.Enum):
    PENDING = 'PENDING'
    ACTIVATED = 'ACTIVATED'
    DISABLED = 'DISABLED'
# class FilterSetType(enum.Enum):
#     PROSPECTS = 'Prospects'
#     ANALYTICS = 'Analytics'

class LeadSourceType(enum.Enum):
    CRM = 'CRM'
    FILE = 'FILE'
    SMAI = 'SMAI'
    MANUAL = 'MANUAL'

class TextConsentStatus(enum.Enum):
    ACCEPTED = 'ACCEPTED'
    PENDING = 'PENDING'
    DECLINED = 'DECLINED'

class CampaignType(enum.Enum):
    DEFAULT = 'DEFAULT'
    SOURCE = 'SOURCE'
    LEAD = 'LEAD'
    FILE = 'FILE'
    STATUS = 'STATUS'

class ScheduleType(enum.Enum):
    ONCE = 'ONCE'
    REPEAT = 'REPEAT'

class TemporalType(enum.Enum):
    MINUTES = 'MINUTES'
    HOURS = 'HOURS'
    DAYS = 'DAYS'
    WEEKS = 'WEEKS'
    MONTHS = 'MONTHS'

class FrequencyType(enum.Enum):
    MINUTES = 'MINUTES'
    HOURS = 'HOURS'
    DAYS = 'DAYS'

class StartDelayType(enum.Enum):
    MINUTES = 'MINUTES'
    HOURS = 'HOURS'
    DAYS = 'DAYS'

class CampaignIndicatorType(enum.Enum):
    Active = 'Active'
    InPogress = 'InPogress'
    Inactive = 'Inactive'

class CampaignMethodType(enum.Enum):
    Text = 'Text'
    Email = 'Email'

class MessageDirection(enum.Enum):
    TO_LEAD = 'TO_LEAD'
    TO_USER = 'TO_USER'
    FROM_LEAD = 'FROM_LEAD'
    FROM_USER = 'FROM_USER'

class CampaignLeadStatusType(enum.Enum):
    UNCONTACTED = 'UNCONTACTED'
    QUEUED = 'QUEUED'
    SENT = 'SENT'
    FAILED = 'FAILED'
    DELIVERED = 'DELIVERED'
    RESPONDED = 'RESPONDED'
    ENGAGED = 'ENGAGED'
    OPT_OUT = 'OPT_OUT'

class MessageType(enum.Enum):
    APPOINTMENT = "APPOINTMENT"
    REMINDER = "REMINDER"
    NORMAL = "NORMAL"

class AppointmentStatus(enum.Enum):
    SCHEDULED = "SCHEDULED"
    RESCHEDULED = "RESCHEDULED"
    SHOWED = "SHOWED"
    CANCELLED = "CANCELLED"
    NO_SHOWED = "NO_SHOWED"

class WeekDay(enum.Enum):
    SUNDAY = "SUNDAY"
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"

class PhoneUseType(enum.Enum):
    GENERAL = "GENERAL"
    ACTIVITY_CENTER = "ACTIVITY_CENTER"
    CAMPAIGN = "CAMPAIGN"
    APPOINTMENT = "APPOINTMENT"
    
class LeadType(enum.Enum):
    ACTIVE = 'ACTIVE'
    LOST = 'LOST'
    SOLD = 'SOLD'

class CampaignManageType(enum.Enum):
    DEFAULT = 'DEFAULT'
    CUSTOM = 'CUSTOM'
    NEW_LEAD = 'NEW_LEAD'

class CustomerInterestType(enum.Enum):
    BUY = 'BUY'
    SELL = 'SELL'
    TRADE = 'TRADE'
    NONE = 'NONE'

class DEVICE_TYPES(enum.Enum):
    IOS = 'IOS'
    ANDROID = 'ANDROID'
    WEB = 'WEB'


class User(db.Model):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True)
    email = Column(String(128), index=True, unique=True, nullable=False)
    first_name = Column(String(128), nullable=False)
    last_name = Column(String(128), nullable=False)
    company_id = Column(Integer, ForeignKey('company.id'))
    region_id = Column(Integer, ForeignKey('region.id'))
    location_id = Column(Integer, ForeignKey('location.id'))
    phone = Column(String)
    user_accounts= relationship('UserAccounts', back_populates='user')
    cognito_id = Column(String(128), unique=True)
    date_created = Column(DateTime, default=datetime.utcnow)
    is_disabled = Column(Boolean, default=False)
    filters = relationship('UserFilter')
    filter_sets = relationship('FilterSet')
    response_templates = relationship('ResponseTemplate')
    user_roles = relationship('UserRoles')
    teams_leader = relationship('Team', back_populates='leader')
    teams_member = relationship('TeamMember', back_populates='member')
    profile_pic = Column(String(128))
    status = Column(Enum(UserStatus), default=UserStatus.PENDING)
    
    screen_names = relationship('ScreenName')
    notification_config = relationship('NotificationConfig', uselist=False)
    notifications = relationship('Notification', uselist=False)
    vs_users = relationship('VinSolutionsUser')
    sf_users = relationship('SfUser')
    company = relationship('Company', back_populates='users')
    region = relationship('Region')
    location = relationship('Location')

    roles = []

    @classmethod
    def get_user(cls, cognito_id):
        return db.session().query(cls).filter(
            cls.cognito_id == cognito_id).first()

    def is_admin(self):
        return 'ADMIN' in self.roles

    #TODO: check if current user is a company admin (or an equivalent role)
    def is_company_admin(self, company_id):
        return self.company_id == company_id

    def has_permission(self, permission):
        role = self.user_roles[0].role
        return getattr(role, permission)

    def get_vs_user_id(self):
        """Returns the active VinSolutions user ID

        Returns
        -------
        int
            THE ID of the active VinSolutions user
        """
        active_vs_users = list(filter(lambda x: x.active == True, self.vs_users))
        return 0 if active_vs_users == None or len(active_vs_users) == 0 else active_vs_users[0].vs_user_id

class UserAccounts(db.Model):
    __tablename__="user_accounts"
    id = Column(Integer, primary_key=True, autoincrement = True, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'))
    company_id = Column(Integer, ForeignKey('company.id'))
    is_disabled = Column(Boolean, default=False)
    filters = relationship('User')
    
    status= Column(Enum(UserAccountStatus), default=UserAccountStatus.PENDING)
    
    user = relationship('User')
    company= relationship('Company')
        
class Company(db.Model):
    __tablename__ = 'company'

    id = Column(Integer, primary_key=True)
    name = Column(String(), index=True, unique=True, nullable=False)
    address = Column(String())
    city = Column(String())
    state = Column(String())
    postal_code = Column(String())
    phone = Column(String())
    country = Column(String())
    location_link = Column(String())
    date_created = Column(DateTime, default=datetime.utcnow)
    is_disabled = Column(Boolean, default=False)
    # created_by_id = Column(Integer, ForeignKey('user.id'))
    # created_by = relationship('User')
    users = relationship('User', back_populates='company')
    filters = relationship('CompanyFilter')
    address_detail = Column(String())
    industry = Column(String())
    website = Column(String())
    profile_pic = Column(String())
    crmIntegration = relationship('CrmIntegration')
    aingine_source_id = Column(Integer)
    user_accounts = relationship('UserAccounts')
    user_roles = relationship('UserRoles')
    automatic_engagement= Column(Boolean, default=False)
    timezone = Column(String)
    is_optin_consent_method = Column(Boolean, default=False) 

    working_hours = relationship('CompanyWorkingHours', back_populates="company", foreign_keys="CompanyWorkingHours.company_id")

    facebook_link = Column(String())
    google_link = Column(String())

    
# Analytics schema inspired by https://developerzen.com/choosing-an-analytics-schema-scales-using-events-grammar-939578a2a8de
class Object(db.Model):
    __tablename__ = 'object'
    #id, key, type, display
    id = Column(Integer, primary_key=True)
    key = Column(String(), nullable=False)
    type = Column(String(), nullable=False)
    display = Column(String())

    __table_args__ = (UniqueConstraint('key', 'type'), )

    @staticmethod
    def get_or_create(db, **kwargs):
        return get_one_or_create(db, Object, **kwargs)


class Event(db.Model):
    __tablename__ = 'event'
    #id, timestamp, subject
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, server_default=func.now())

    # This is the entity which is carrying out the action. Ex: '*Eran* wrote a letter'
    subject_id = Column(Integer, ForeignKey('object.id'))
    subject = relationship('Object',
                           backref='subject_events',
                           foreign_keys=[subject_id])

    # Describes the action being done. Ex:'UserX *wrote* a letter'
    verb = Column(String())

    # The noun. The entity on which action is being done. Ex: 'Eran wrote *a letter*
    direct_object_id = Column(Integer, ForeignKey('object.id'))
    direct_object = relationship('Object',
                                 backref='direct_object_events',
                                 foreign_keys=[direct_object_id])

    # The entity indirectly affected by the action. Ex: 'Eran wrote a letter *to Lior*'
    indirect_object_id = Column(Integer, ForeignKey('object.id'))
    indirect_object = relationship('Object',
                                   backref='indirect_object_events',
                                   foreign_keys=[indirect_object_id])

    # An object introduced by a preposition (in, for, of etc), but not the direct or indirect object. Ex: 'Eran put a letter *in an envelope*'
    prepositional_object_id = Column(Integer, ForeignKey('object.id'))
    prepositional_object = relationship('Object',
                                        backref='prepositional_object_events',
                                        foreign_keys=[prepositional_object_id])

    # JSON providing extra event-specific data
    context = Column(String(
    ))  #JSON field instead? https://pypi.org/project/SQLAlchemy-JSONField/
    #more on "super-propeprties":
    #https://webcache.googleusercontent.com/search?q=cache:A7uQakn7eGUJ:https://mixpanel-pre-prod.approvemyviews.com/blog/2015/03/16/community-tip-useful-super-properties/
    duration = Column(Float())
    #TODO: track tracker and backend version
    #Version string of the software sending events from client.
    #tracker_version = Column(String())
    # Version string of server-side receiving frontend.
    #collection_version = Column(String())

    def has_access(self, user):
        user_is_owner = self.subject_id == user.id
        owner = get_user(self.subject_id)
        is_company_admin = (owner.company == user.company and user.is_company_admin)
        is_admin = user.is_admin
        return user_is_owner or is_company_admin or is_admin
        


#https://webcache.googleusercontent.com/search?q=cache:VdrM6PuKlV8J:https://skien.cc/blog/2014/01/15/sqlalchemy-and-race-conditions-implementing-get_one_or_create/
def get_one_or_create(db,
                      model,
                      create_method='',
                      create_method_kwargs=None,
                      **kwargs):
    session = db.session
    try:
        return session.query(model).filter_by(**kwargs).one(), False
    except NoResultFound:
        kwargs.update(create_method_kwargs or {})
        created = getattr(model, create_method, model)(**kwargs)
        try:
            session.add(created)
            session.flush()
            return created, True
        except IntegrityError:
            session.rollback()
            return session.query(model).filter_by(**kwargs).one(), False


class FilterType(db.Model):
    __tablename__ = 'filter_type'

    id = Column(Integer, primary_key=True)
    type = Column(Enum(FilterGroupType), nullable=False)
    name = Column(String, nullable=False, unique=True)
    filter_field = Column(String(), nullable=False)
    selection_options = relationship('SelectionOption',
                                     back_populates='filter_type', order_by='SelectionOption.value')

    @classmethod
    def find_by_type_and_name(cls, group_type, name):
        return db.session().query(cls).filter(
            cls.type == FilterGroupType(group_type), cls.name == name).first()


class SelectionOption(db.Model):
    __tablename__ = 'selection_option'

    id = Column(Integer, primary_key=True)
    value = Column(String, nullable=False)
    query = Column(String)
    filter_type_id = Column(Integer,
                            ForeignKey('filter_type.id', ondelete='CASCADE'),
                            nullable=False)
    filter_type = relationship('FilterType',
                               back_populates='selection_options')


class CompanyFilter(db.Model):
    __tablename__ = 'company_filter'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'), nullable=False)
    selection_option_id = Column(Integer,
                                 ForeignKey('selection_option.id', ondelete='CASCADE'),
                                 nullable=False)
    selection_option = relationship('SelectionOption')
    user_can_change = Column(Boolean, nullable=False)

    @classmethod
    def find_by_company_and_value_and_type(cls, company_id, value,
                                           filter_type_id):
        return db.session().query(cls).join(SelectionOption).filter(
            cls.company_id == company_id, SelectionOption.value == value,
            SelectionOption.filter_type_id == filter_type_id).first()

    @classmethod
    def reset_company_filters(cls, company_id):
        db.session.query(cls).filter(cls.company_id == company_id).delete()
        db.session.commit()


class UserFilter(db.Model):
    __tablename__ = 'user_filter'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    filter_type_id = Column(Integer,
                            ForeignKey('filter_type.id', ondelete='CASCADE'),
                            nullable=False)
    filter_type = relationship('FilterType')
    value = Column(String)
    company_filter_id = Column(Integer, ForeignKey('company_filter.id', ondelete='CASCADE'))
    company_filter = relationship('CompanyFilter')
    set_type = Column(String)
    export_config_id = Column(Integer, ForeignKey('export_config.id'), nullable=True)

    @classmethod
    def reset_user_filters(cls, user_id, set_type):
        db.session.query(cls).filter(cls.user_id == user_id).filter(or_(cls.set_type == set_type, cls.set_type.is_(None))).delete()
        db.session.commit()

    @classmethod
    def reset_export_filters(cls, user_id, export_config_id):
        db.session.query(cls).filter(cls.user_id == user_id, cls.export_config_id == export_config_id).delete()
        db.session.commit()


class SavedFilter(db.Model):
    __tablenme__ = 'saved_filters'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    filter_type_id = Column(Integer,
                            ForeignKey('filter_type.id', ondelete='CASCADE'),
                            nullable=False)
    filter_type = relationship('FilterType')
    value = Column(String)
    company_filter_id = Column(Integer, ForeignKey('company_filter.id', ondelete='CASCADE'))
    company_filter = relationship('CompanyFilter')
    filter_set_id = Column(Integer, ForeignKey('filter_set.id'))


class FilterSet(db.Model):
    __tablename__ = 'filter_set'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    filters = relationship('SavedFilter')
    set_type = Column(String)


class AingineDataReceived(db.Model):
    __tablename__ = 'aingine_data_received'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('company.id'), nullable=False)
    aingine_data_id = Column(Integer, nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)
    action_date = Column(DateTime)
    status = Column(Enum(AingineDataStatus), nullable=False)


def get_default_followup_date():
    return datetime.utcnow() + timedelta(days=10)


class Deal(db.Model):
    __tablename__ = 'deal'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    sales_person = relationship('User')
    company_id = Column(Integer, ForeignKey('company.id'), nullable=False)
    aingine_data_id = Column(Integer, nullable=False)
    aingine_user_id = Column(Integer, nullable=False)
    screen_name = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    phone = Column(String)
    location = Column(String)
    url = Column(String, nullable=False)
    profile_url = Column(String)
    source = Column(String)
    source_id = Column(Integer)
    strength = Column(Enum(DealStrength))
    status = Column(Enum(DealStatus), default=DealStatus.ACTIVE)
    date_created = Column(DateTime, default=datetime.utcnow)
    followup_date = Column(DateTime, default=get_default_followup_date)
    allow_notifications = Column(Boolean, default=True)
    conversations = relationship('ConversationEntry')
    tags = Column(ARRAY(String))
    crm_leads = relationship('CrmLead')
    post_type = Column(String, nullable=True)

class ConversationEntry(db.Model):
    __tablename__ = 'conversation_entry'

    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey('deal.id'), nullable=False)
    type = Column(Enum(EntryType), nullable=True)
    message = Column(String, nullable=True)
    post_time = Column(DateTime, nullable=True)
    aingine_user_id = Column(Integer)
    aingine_data_id = Column(Integer)
    date_created = Column(DateTime, default=datetime.utcnow)
    is_temp = Column(Boolean, default=False)

class ResponseTemplate(db.Model):
    __tablename__ = 'response_template'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    message = Column(Text, nullable=False)
    is_initial_response = Column(Boolean, nullable=False)

class Team(db.Model):
    __tablename__ = 'team'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'), nullable=False)
    leader_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    leader = relationship('User', back_populates='teams_leader')
    name = Column(String, nullable=False)
    status = Column(Enum(TeamStatus), default=TeamStatus.ACTIVE)
    date_created = Column(DateTime, default=datetime.utcnow)
    members = relationship('TeamMember')

class TeamMember(db.Model):
    __tablename__ = 'team_member'

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey('team.id'), nullable=False)
    member_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    member = relationship('User', back_populates='teams_member')

class Role(db.Model):
    __tablename__ = 'role'

    id = Column(Integer, primary_key=True)
    name = Column(String(60), nullable=False)
    company_id = Column(Integer, ForeignKey('company.id', ondelete='CASCADE'))
    can_create_users = Column(Boolean, default=False)
    can_create_teams = Column(Boolean, default=False)
    can_view_prospects = Column(Boolean, default=False)
    is_company_admin = Column(Boolean, default=False)
    can_view_auto_analytics = Column(Boolean, default=False)
    can_view_ad_export = Column(Boolean, default=False)
    can_view_clm = Column(Boolean, default=False)
    can_view_gle = Column(Boolean, default=False)
    can_view_engagements = Column(Boolean, default=False)


class UserRoles(db.Model):
    __tablename__ = 'user_roles'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE'))
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE'))
    company_id = Column(Integer, ForeignKey('company.id', ondelete='CASCADE')) 
    role = relationship(Role)
    company = relationship(Company)
    user = relationship(User)

class ScreenName(db.Model):
    __tablename__ = 'screen_name'

    id = Column(Integer, primary_key=True)
    source = Column(String, nullable=False)
    source_id = Column(Integer, nullable=False)
    screen_name = Column(String, nullable=False)
    source_url = Column(String)
    aingine_user_id = Column(Integer)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE'))

class ResponseConfig(db.Model):
    __tablename__ = 'response_config'

    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey('deal.id', ondelete='CASCADE'))
    deal = relationship('Deal')
    source_id = Column(Integer)
    thread_id = Column(Integer)
    aingine_user_id = Column(Integer)
    screen_name = Column(String)
    active = Column(Boolean)

class CrmIntegration(db.Model):
    __tablename__ = 'crm_integration'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id', ondelete='CASCADE'))
    integration_type = Column(Enum(CrmIntegrationType), nullable=False, default=CrmIntegrationType.ADF)
    adf_email = Column(String)
    crm_dealer_id = Column(String)
    active = Column(Boolean, default=False)
    vs_lead_source_id = Column(String)
    sf_api_url = Column(String)
    sf_api_key = Column(String)
    sf_api_user = Column(String)
    sf_certificate_key = Column(String)

    crm_leads = relationship('CrmLead')
    vs_users = relationship('VinSolutionsUser')
    sf_users = relationship('SfUser')

class NotificationConfig(db.Model):
    __tablename__ = 'notification_config'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    user = relationship('User')
    notifications_allowed = Column(Boolean)
    dnd_start = Column(Time)
    dnd_end = Column(Time)
    timezone = Column(String)
    email = Column(Boolean)
    app = Column(Boolean)
    sms = Column(Boolean)
    responses = Column(Boolean, default=True)
    interval = Column(String)
    details = relationship('NotificationConfigDetail')
    last_run = Column(DateTime)
    
class NotificationConfigDetail(db.Model):
    __tablename__ = 'notification_config_detail'

    id = Column(Integer, primary_key=True)
    set_type = Column(String)
    filter_set_id = Column(Integer, ForeignKey('filter_set.id'))
    filter_set = relationship('FilterSet')
    count = Column(Integer)
    notification_config_id = Column(Integer, ForeignKey('notification_config.id'), nullable=False)

class Notification(db.Model):
    __tablename__ = 'notification'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    read = Column(Boolean)
    date = Column(DateTime)
    text = Column(String)
    notification_type = Column(String)

class ExportConfig(db.Model):
    __tablename__ = 'export_config'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('company.id'))
    user = relationship('User')
    name = Column(String)
    email = Column(String)
    email_time = Column(Time)
    minimum_count = Column(Integer)
    frequency = Column(Integer)
    count = Column(Integer)
    last_exported = Column(DateTime)
    last_run = Column(DateTime)
    ad_hoc = Column(Boolean)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    filters = relationship('UserFilter')
    exports = relationship('Export') 
    deleted = Column(Boolean, default=False)
    timezone = Column(String)

class Export(db.Model):
    __tablename__ = 'export'

    id = Column(Integer, primary_key=True)
    export_config_id = Column(Integer, ForeignKey('export_config.id'), nullable=False)
    export_config = relationship('ExportConfig', back_populates='exports')
    created_at = Column(DateTime)
    name = Column(String)
    path = Column(String)
    deleted = Column(Boolean, default=False)
    count = Column(Integer)


class CrmLead(db.Model):
    __tablename__ = 'crm_lead'

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime)
    deal_id = Column(Integer, ForeignKey('deal.id'))
    lead_id = Column(String)
    customer_id = Column(String)
    dealer_id = Column(String)
    contact_id = Column(String)
    account_id = Column(String)
    crm_integration_id = Column(Integer, ForeignKey('crm_integration.id'), nullable=False)
    crm_integration = relationship('CrmIntegration', back_populates='crm_leads')

class EvalTerm(db.Model):
    __tablename__ = 'eval_term'

    id = Column(Integer, primary_key=True)
    text = Column(String)
    include = Column(Boolean, default=False)
    exclude = Column(Boolean, default=False)
    intent = Column(String) # buy/sell/parts/service


class CompanyLeadFiles(db.Model):
    __tablename__ = 'company_lead_files'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'))
    user_id = Column(Integer, ForeignKey('user.id'))
    create_ts = Column(DateTime, default=datetime.utcnow)
    file_name = Column(String)
    file_location = Column(String)
    status = Column(String)


class Leads(db.Model):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True)
    full_name = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    date_of_birth = Column(Date)
    lead_source_type = Column(Enum(LeadSourceType), nullable=False)
    lead_source_original_id = Column(Integer, ForeignKey('lead_source.id'))
    company_id = Column(Integer, ForeignKey('company.id'))
    location_id = Column(Integer, ForeignKey('location.id'))
    lead_file_id = Column(Integer, ForeignKey('company_lead_files.id'))
    crm_integration_id = Column(Integer, ForeignKey('crm_integration.id'))
    lead_status_type_id = Column(Integer, ForeignKey('lead_status_type.id'))
    status = Column(String)
    lead_created_date = Column(DateTime, default=datetime.utcnow)
    email_consent = Column(Boolean)
    email_consent_date = Column(DateTime)
    text_consent_status = Column(Enum(TextConsentStatus), nullable=True)
    text_consent = Column(Boolean)
    text_consent_date = Column(DateTime)
    is_deleted = Column(Boolean, default=False)
    other_source = Column(String(50))
    unread_count = Column(Integer, default=0)
    disable_conversation = Column(Boolean, default=False)

    emails = relationship("LeadEmails", back_populates="lead", foreign_keys="LeadEmails.lead_id")
    phone_numbers = relationship("LeadPhones", back_populates="lead", foreign_keys="LeadPhones.lead_id")
    addresses = relationship("LeadAddresses", back_populates="lead", foreign_keys="LeadAddresses.lead_id")
    vehicle_of_interest = relationship("LeadVehicleOfInterest", back_populates="lead", foreign_keys="LeadVehicleOfInterest.lead_id")
    messages = relationship("Message", back_populates="lead", foreign_keys="Message.lead_id")
    lead_source = relationship('LeadSource')
    appointments = relationship('Appointment', back_populates="lead", foreign_keys="Appointment.lead_id")
    lead_status_type = relationship('LeadStatusType')
    lead_notes = relationship('LeadNotes')
    company = relationship('Company')
    location = relationship('Location')

    def constrains(self):
        if self.text_consent == False:
            return False

        if self.disable_conversation == True:
            return False

        last_received = Message.query.filter(Message.lead_id == self.id, Message.date_received != None).order_by(Message.id.desc()).first()

        if last_received:
            td = datetime.utcnow() - last_received.date_received
            if td.days > 180:
                return False
        else:
            first_sent = Message.query.filter(Message.lead_id == self.id, Message.date_sent != None).order_by(Message.id.asc()).first()
            if first_sent:
                td = datetime.utcnow() - first_sent.date_sent
                if td.days > 180:
                    return False
        return True

class LeadUser(db.Model):
    __tablename__ = 'lead_user'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    user_id = Column(Integer, ForeignKey('user.id'))
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)

    lead = relationship('Leads')
    user = relationship('User')

class LeadConversationHistory(db.Model):
    __tablename__ = 'lead_conversation_history'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    disable_conversation = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey('user.id'))
    is_text = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)

    lead = relationship('Leads')
    user = relationship('User')


class LeadEmails(db.Model):
    __tablename__ = 'lead_emails'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    email = Column(String)
    email_type = Column(String)
    
    lead = relationship('Leads', back_populates='emails')


class LeadPhones(db.Model):
    __tablename__ = 'lead_phones'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    phone = Column(String)
    phone_type = Column(String)
    lookup_type = Column(String)
    lead = relationship('Leads', back_populates='phone_numbers')

class LeadAddresses(db.Model):
    __tablename__ = 'lead_addresses'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    location_text = Column(String)
    address_line_1 = Column(String)
    address_line_2 = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    country = Column(String)
    lead = relationship('Leads', back_populates='addresses')


class LeadVehicleOfInterest(db.Model):
    __tablename__ = 'lead_vehicle_of_interest'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    year = Column(String)
    make = Column(String)
    model = Column(String)
    trim = Column(String)
    description = Column(String)
    budget = Column(String)
    is_current = Column(Boolean, default = True)
    is_primary = Column(Boolean, default = True)
    customer_interest = Column(Enum(CustomerInterestType))
    lead = relationship('Leads', back_populates='vehicle_of_interest')

class Campaign(db.Model):
    __tablename__ = 'campaign'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    date_created = Column(DateTime, default=datetime.utcnow)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    method = Column(Enum(CampaignMethodType), nullable=False)
    text_message = Column(String)
    company_id = Column(Integer, ForeignKey('company.id'))
    user_id = Column(Integer, ForeignKey('user.id'))
    campaign_type_id = Column(Integer, ForeignKey('campaign_types.id'))
    active_ind = Column(Enum(CampaignIndicatorType), nullable=False)
    is_accept_terms = Column(Boolean, default=False)
    accept_terms_timestamp = Column(DateTime, default=datetime.utcnow)
    is_disabled = Column(Boolean, default=False)
    is_prioritize = Column(Boolean, default=False)

    campaign_selections = relationship("CampaignSelections", back_populates="campaign")
    campaign_schedules = relationship("CampaignSchedules", back_populates="campaign")
    campaign_templates = relationship("CampaignTemplates", back_populates="campaign")
    user = relationship('User')
    campaign_type = relationship('CampaignTypes')

class CampaignSelections(db.Model):
    __tablename__ = 'campaign_selections'

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id',ondelete='CASCADE'))
    type = Column(Enum(CampaignType), nullable=False)
    value = Column(Integer)
    campaign = relationship('Campaign', back_populates='campaign_selections')

    @classmethod
    def reset_campaign_selections(cls, campaign_id):
        db.session.query(cls).filter(cls.campaign_id == campaign_id).delete()
        db.session.commit()

class CampaignSchedules(db.Model):
    __tablename__ = 'campaign_schedules'

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id',ondelete='CASCADE'))
    type = Column(Enum(ScheduleType), nullable=False)
    numeric_value = Column(Integer)
    temporal_value = Column(Enum(TemporalType), nullable=False)
    title = Column(String)
    sort_order = Column(Integer)

    campaign_templates = relationship("CampaignTemplates", back_populates="campaign_schedules")
    campaign = relationship('Campaign', back_populates='campaign_schedules')

    @classmethod
    def reset_campaign_schedules(cls, schedule_id):
        db.session.query(cls).filter(cls.schedules_option_id == schedule_id).delete()
        db.session.commit()

class CampaignTemplates(db.Model):
    __tablename__ = 'campaign_templates'

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id',ondelete='CASCADE'))
    schedule_id = Column(Integer, ForeignKey('campaign_schedules.id', ondelete='CASCADE'))
    source_id = Column(Integer, ForeignKey('lead_source.id'))
    template_text = Column(String)
    after_hour_template_text = Column(String)
    is_after_hour = Column(Boolean, default=True)
    active_ind = Column(Boolean, default=True)

    campaign = relationship('Campaign', back_populates='campaign_templates')
    campaign_schedules = relationship('CampaignSchedules', back_populates='campaign_templates')
    lead_source = relationship('LeadSource')

class LeadSource(db.Model):
    __tablename__ = 'lead_source'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    is_source = Column(Boolean, default=True)

class Message(db.Model):
    __tablename__ = 'message'

    id = Column(Integer, primary_key=True)
    system_user_id = Column(Integer, ForeignKey('user.id'), index = True)
    lead_id = Column(Integer, ForeignKey('leads.id'), index = True)
    user_id = Column(Integer, ForeignKey('user.id'), index = True)
    channel_id = Column(Integer, ForeignKey('channel.id'))
    campaign_id = Column(Integer, ForeignKey('campaign.id'), index = True)
    campaign_template_id = Column(Integer, ForeignKey('campaign_templates.id'))
    message_sid = Column(String)
    message_status = Column(String, index = True)
    direction = Column(Enum(MessageDirection))
    date_sent = Column(DateTime)
    date_received = Column(DateTime)
    content = Column(String)
    message_type = Column(Enum(MessageType))
    is_read = Column(Boolean, default=True)

    message_log = relationship("MessageLog", back_populates="message", foreign_keys="MessageLog.message_id")
    lead = relationship('Leads', back_populates='messages')


class Channel(db.Model):
    __tablename__ = 'channel'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    channel_type = Column(String)

class MessageLog(db.Model):
    __tablename__ = 'message_log'

    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('message.id'))
    from_phone = Column(String)
    to_phone = Column(String)
    message = relationship("Message", back_populates="message_log")

class ScheduledMessages(db.Model):
    __tablename__ = 'schedule_messages'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    campaign_id = Column(Integer, ForeignKey('campaign.id'))
    frequency = Column(String)
    scheduled_seconds = Column(Integer)
    repeat_scheduled_seconds = Column(Integer)
    execution_arn = Column(String)
    def __repr__(self):
        if self.frequency == "REPEAT":
            return f'{self.lead_id}/{self.campaign_id}/{self.frequency}/{self.scheduled_seconds}/{self.repeat_scheduled_seconds}'
        elif self.frequency == "ONCE":
            return f'{self.lead_id}/{self.campaign_id}/{self.frequency}/{self.scheduled_seconds}'

class CampaignLeadSummary(db.Model):
    __tablename__ = 'campaign_lead_summary'

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id', ondelete='CASCADE'))
    lead_id = Column(Integer, ForeignKey('leads.id'))
    last_message_sent_date = Column(DateTime)
    last_message_received_date = Column(DateTime)
    num_attempts_before_response = Column(Integer)
    status = Column(Enum(CampaignLeadStatusType), nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)
    lead = relationship('Leads')

class CompanyLeadSource(db.Model):
    __tablename__ = 'company_lead_source'
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'))
    lead_source_original_id = Column(Integer, ForeignKey("lead_source.id"))

class Appointment(db.Model):
    __tablename__ = 'appointment'

    id = Column(Integer, primary_key=True)
    start_datetime = Column(DateTime)
    end_datetime = Column(DateTime)
    uid = Column(String)
    description = Column(String)
    location = Column(String)
    sequence = Column(Integer)
    status = Column(String)
    summary = Column(String)
    lead_email = Column(String)
    lead_phone = Column(String)
    date_created = Column(DateTime, default=datetime.utcnow)
    timezone = Column(String)
    is_confirmed = Column(Boolean, default=False)
    is_show = Column(Boolean, default=False)
    appointment_status = Column(Enum(AppointmentStatus))
    lead_id = Column(Integer, ForeignKey('leads.id'))
    user_id = Column(Integer, ForeignKey('user.id'))
    company_id = Column(Integer, ForeignKey('company.id'))
    location_id = Column(Integer, ForeignKey('location.id'))
    discussed_voi_id = Column(Integer, ForeignKey('lead_vehicle_of_interest.id'))

    lead = relationship('Leads', back_populates='appointments')
    user = relationship('User')
    company = relationship('Company')
    # location = relationship('Location')
    discussed_voi = relationship('LeadVehicleOfInterest')

class AppointmentHistory(db.Model):
    __tablename__ = 'appointment_history'

    id = Column(Integer, primary_key=True)
    start_datetime = Column(DateTime)
    end_datetime = Column(DateTime)
    uid = Column(String)
    description = Column(String)
    location = Column(String)
    sequence = Column(Integer)
    status = Column(String)
    summary = Column(String)
    lead_email = Column(String)
    lead_phone = Column(String)
    date_created = Column(DateTime, default=datetime.utcnow)
    timezone = Column(String)
    appointment_status = Column(Enum(AppointmentStatus))
    lead_id = Column(Integer)
    user_id = Column(Integer)
    company_id = Column(Integer)
    location_id = Column(Integer)
    discussed_voi_id = Column(Integer, ForeignKey('lead_vehicle_of_interest.id'))

class ScheduledAppointmentReminder(db.Model):
    __tablename__ = 'scheduled_appointment_reminder'

    id = Column(Integer, primary_key=True)
    appointment_id = Column(Integer, ForeignKey('appointment.id'))
    sequence = Column(Integer)
    execution_arn = Column(String)

class EngagementMessageTemplate(db.Model):
    __tablename__ = 'engagement_message_template'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'))
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_company_shared = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

class CrmPullProcessing(db.Model):
    __tablename__ = 'crm_pull_processing'

    id = Column(Integer, primary_key=True)
    lock = Column(Boolean)
    last_pull_datetime = Column(DateTime)
    last_successfull_created_utc = Column(DateTime)
    integration_id = Column(Integer, ForeignKey('crm_integration.id'))
    company_id = Column(Integer, ForeignKey('company.id'))

class CompanyWorkingHours(db.Model):
    __tablename__ = 'company_working_hours'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'), nullable=False)
    location_id = Column(Integer, ForeignKey('location.id'))
    week_day = Column(Enum(WeekDay), nullable=False)
    is_working_day = Column(Boolean, default=True)
    start_time = Column(Time)
    end_time = Column(Time)
    created_on = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    company = relationship('Company', back_populates='working_hours')
    location = relationship('Location', back_populates='working_hours')


class TwilioPhoneService(db.Model):
    __tablename__ = 'twilio_phone_service'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    type = Column(Enum(PhoneUseType), nullable=False)
    service_name = Column(String(50), nullable=False)
    description = Column(Text)
    created_on = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    user = relationship('User')
    company= relationship('Company')

class LeadStatusType(db.Model):
    __tablename__ = 'lead_status_type'

    id = Column(Integer, primary_key=True)
    type = Column(Enum(LeadType), nullable=False)
    status = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)

class LeadStatusHistory(db.Model):
    __tablename__ = 'lead_status_history'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
    lead_status_type_id = Column(Integer, ForeignKey('lead_status_type.id'), nullable=False)
    created_by = Column(Integer, ForeignKey('user.id'))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)

    lead = relationship('Leads')
    lead_status_type = relationship('LeadStatusType')
    user = relationship('User')

class CampaignTypes(db.Model):
    __tablename__ = 'campaign_types'

    id = Column(Integer, primary_key=True)
    type = Column(Enum(CampaignManageType), nullable=False)
    is_active = Column(Boolean, default=True)

class LeadNotes(db.Model):
    __tablename__ = 'lead_notes'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
    note = Column(Text)
    created_on = Column(DateTime, default=datetime.utcnow)

class VehicleOfInterest(db.Model):
    __tablename__ = 'vehicle_of_interest'

    id = Column(Integer, primary_key=True)
    year = Column(String)
    make = Column(String)
    model = Column(String)
    trim = Column(String)
    
class FCMDevice(db.Model):
    __tablename__ = "fcm_device"

    id = Column(Integer, primary_key=True)
    registration_id = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    type = Column(Enum(DEVICE_TYPES), nullable=False)

    user = relationship('User')

class NudgeEvent(db.Model):
    __tablename__ = "nudge_event"

    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False)
    title = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class CompanyNudgeEvent(db.Model):
    __tablename__ = "company_nudge_event"

    id = Column(Integer, primary_key=True)
    nudge_event_id = Column(Integer, ForeignKey('nudge_event.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('company.id'), nullable=False)
    start_delay = Column(Integer, nullable=False)
    start_delay_type = Column(Enum(StartDelayType), nullable=False)
    frequency = Column(Integer, nullable=False)
    frequency_type = Column(Enum(FrequencyType), nullable=False)
    first_template_text = Column(String, nullable=False)
    reminder_template_text = Column(String, nullable=False)
    is_sms = Column(Boolean, default=True)
    is_web_push = Column(Boolean, default=True)
    is_active = Column(Boolean, default=False)
    
    nudge_event = relationship('NudgeEvent')
    company = relationship('Company')

class NudgeActivity(db.Model):
    __tablename__ = 'nudge_activity'

    id = Column(Integer, primary_key=True)
    company_nudge_event_id = Column(Integer, ForeignKey('company_nudge_event.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
    appointment_id = Column(Integer, ForeignKey('appointment.id'), nullable=True)
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)

    company_nudge_event = relationship('CompanyNudgeEvent')
    user = relationship('User')
    lead = relationship('Leads')
    appointment = relationship('Appointment')

class NudgeActivityHistory(db.Model):
    __tablename__ = 'nudge_activity_history'

    id = Column(Integer, primary_key=True)
    nudge_activity_id = Column(Integer, ForeignKey('nudge_activity.id'))
    execution_arn = Column(String)
    content = Column(String)
    trigger_on = Column(DateTime)
    created_on = Column(DateTime, default=datetime.utcnow)

    nudge_activity = relationship('NudgeActivity')






###################################
####   Vin Solution Models     ####
###################################

class VinSolutionsUser(db.Model):
    __tablename__ = "vin_solutions_user"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    vs_user_id = Column(Integer, nullable=False)
    crm_integration_id = Column(Integer, ForeignKey('crm_integration.id'), nullable=False)
    active = Column(Boolean, default=False)

    user = relationship('User', back_populates='vs_users')
    crm_integration = relationship('CrmIntegration', back_populates='vs_users')

class VsExtractHistory(db.Model):
    __tablename__  = 'vs_extract_history'

    id = Column(Integer, primary_key=True)
    dealer_id = Column(String(32), nullable=False)
    status = Column(String, nullable=False)
    extract_date = Column(DateTime, server_default=func.now())

class VsExtractedLead(db.Model):
    __tablename__  = 'vs_extracted_lead'

    id = Column(Integer, primary_key=True)
    vs_extract_history_id = Column(Integer, ForeignKey("vs_extract_history.id"), nullable=False)
    dealer_id = Column(String(32), nullable=False)
    vs_lead_id = Column(Integer, nullable=False, unique=True)
    lead_id = Column(Integer, nullable=False)
    vs_contact_id = Column(Integer, nullable=False, unique=True)
    vs_co_buyer_contact_id = Column(Integer, nullable=True)
    vs_lead_source_id = Column(Integer, nullable=True)
    vs_lead_status = Column(String, nullable=True)
    vs_lead_status_type = Column(String, nullable=True)
    vs_lead_status_mapping_id = Column(Integer, ForeignKey('vs_lead_status_mapping.id'))
    vs_lead_type = Column(String, nullable=True)
    vs_lead_category = Column(String, nullable=True)
    vs_create_date = Column(DateTime, nullable=True)
    do_not_email = Column(Boolean, nullable=True)
    do_not_call = Column(Boolean, nullable=True)
    do_not_mail = Column(Boolean, nullable=True)

    vs_lead_status_mapping = relationship('VsLeadStatusMapping')

class VsSmsPreferences(db.Model):
    __tablename__  = 'vs_sms_preferences'
    id = Column(Integer, primary_key=True)
    vs_contact_id = Column(Integer, ForeignKey("vs_extracted_lead.vs_contact_id"))
    phone_number = Column(String, nullable=True)
    phone_type = Column(String, nullable=True)
    subscriber_status = Column(String, nullable=True)

class VsLeadSource(db.Model):
    __tablename__  = 'vs_lead_source'
    id = Column(Integer, primary_key=True)
    dealer_id = Column(String(32), nullable=False)
    lead_source_id = Column(Integer, nullable=True)
    vs_lead_source_id = Column(Integer, nullable=True, unique=True)
    vs_lead_source_name = Column(String, nullable=True)

class VsLeadStatusMapping(db.Model):
    __tablename__  = 'vs_lead_status_mapping'

    id = Column(Integer, primary_key=True)
    vs_lead_status_id = Column(Integer, nullable=True)
    vs_lead_status = Column(String, nullable=True)
    vs_lead_status_type_id = Column(Integer, nullable=True)
    vs_lead_status_type = Column(String, nullable=True)
    lead_status_type_id = Column(Integer, ForeignKey('lead_status_type.id'))
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)

    lead_status_type = relationship('LeadStatusType')

class VinSolutionsVehicles(db.Model):
    __tablename__ = "vin_solutions_vehicles"

    id = Column(Integer, primary_key=True)
    vs_vehicle_id = Column(String, nullable=False)
    lead_vehicle_of_interest_id = Column(Integer, ForeignKey('lead_vehicle_of_interest.id'), nullable=False)
    
    lead_vehicle_of_interest = relationship('LeadVehicleOfInterest')  



###################################
####   Sales Force Models     ####
###################################

class SfUser(db.Model):
    __tablename__ = "sf_user"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    sf_user_id = Column(String, nullable=False)
    crm_integration_id = Column(Integer, ForeignKey('crm_integration.id'), nullable=False)
    active = Column(Boolean, default=False)

    user = relationship('User', back_populates='sf_users')
    crm_integration = relationship('CrmIntegration', back_populates='sf_users')

class SfLocation(db.Model):
    __tablename__ = "sf_location"

    id = Column(Integer, primary_key=True)
    location_id = Column(Integer, ForeignKey('location.id'), nullable=False)
    sf_location_id = Column(String, nullable=False)
    crm_integration_id = Column(Integer, ForeignKey('crm_integration.id'), nullable=False)
    active = Column(Boolean, default=False)

    location = relationship('Location')
    crm_integration = relationship('CrmIntegration')

class SfExtractHistory(db.Model):
    __tablename__  = 'sf_extract_history'

    id = Column(Integer, primary_key=True)
    crm_integration_id = Column(Integer, ForeignKey('crm_integration.id'), nullable=True)
    status = Column(String, nullable=False)
    extract_date = Column(DateTime, server_default=func.now())

    crm_integration = relationship('CrmIntegration')

class SfLeadSource(db.Model):
    __tablename__  = 'sf_lead_source'

    id = Column(Integer, primary_key=True)
    lead_source_id = Column(Integer, nullable=True)
    sf_lead_source_id = Column(String, nullable=False, unique=True)
    sf_lead_source_name = Column(String, nullable=True)

class SfLeadStatusMapping(db.Model):
    __tablename__  = 'sf_lead_status_mapping'

    id = Column(Integer, primary_key=True)
    sf_lead_status_id = Column(String, nullable=True)
    sf_lead_status = Column(String, nullable=True)
    lead_status_type_id = Column(Integer, ForeignKey('lead_status_type.id'))
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)

    lead_status_type = relationship('LeadStatusType')

class SfExtractedLead(db.Model):
    __tablename__  = 'sf_extracted_lead'

    id = Column(Integer, primary_key=True)
    sf_extract_history_id = Column(Integer, ForeignKey("sf_extract_history.id"), nullable=False)
    crm_integration_id = Column(Integer, ForeignKey('crm_integration.id'), nullable=True)
    sf_lead_id = Column(String, nullable=False)
    lead_id = Column(Integer, nullable=False)
    sf_source = Column(String, nullable=True)
    sf_lead_status = Column(String, nullable=True)
    sf_create_date = Column(DateTime, nullable=True)
    sf_modified_date = Column(DateTime, nullable=True)
    sf_converted_date = Column(DateTime, nullable=True)
    sf_lead_source_id = Column(Integer, ForeignKey('sf_lead_source.id'))
    sf_user_id = Column(Integer, ForeignKey('sf_user.id'))
    sf_location_id = Column(Integer, ForeignKey('sf_location.id'))
    sf_lead_status_mapping_id = Column(Integer, ForeignKey('sf_lead_status_mapping.id'))
    is_deleted = Column(Boolean, default=False)
    is_converted = Column(Boolean, default=False)
    
    sf_lead_source = relationship('SfLeadSource')
    sf_user = relationship('SfUser')
    sf_location = relationship('SfLocation')
    sf_lead_status_mapping = relationship('SfLeadStatusMapping')
    crm_integration = relationship('CrmIntegration')

class SfVehicles(db.Model):
    __tablename__ = "sf_vehicles"

    id = Column(Integer, primary_key=True)
    sf_vehicle_id = Column(String, nullable=False)
    lead_vehicle_of_interest_id = Column(Integer, ForeignKey('lead_vehicle_of_interest.id'), nullable=False)
    
    lead_vehicle_of_interest = relationship('LeadVehicleOfInterest') 

class SfAppointment(db.Model):
    __tablename__ = "sf_appointment"

    id = Column(Integer, primary_key=True)
    sf_event_id = Column(String, nullable=False, unique=True)
    appointment_id = Column(Integer, ForeignKey('appointment.id'))
    sf_extracted_lead_id = Column(Integer, ForeignKey('sf_extracted_lead.id'))
    sf_lead_source_id = Column(Integer, ForeignKey('sf_lead_source.id'))
    sf_user_id = Column(Integer, ForeignKey('sf_user.id'))
    type = Column(String)

    appointment = relationship('Appointment')
    sf_extracted_lead = relationship('SfExtractedLead')
    sf_lead_source = relationship('SfLeadSource')
    sf_user = relationship('SfUser')


class Region(db.Model):
    __tablename__ = 'region'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    company_id = Column(Integer, ForeignKey('company.id'))

    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)
    
    company = relationship('Company')

class Location(db.Model):
    __tablename__ = 'location'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'))
    region_id = Column(Integer, ForeignKey('region.id'))
    title = Column(String, nullable=False)
    address_line_1 = Column(String)
    address_line_2 = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    country = Column(String)
    geo_link = Column(String)
    website = Column(String)
    phone = Column(String)
    email = Column(String)
    timezone = Column(String)
    location_type = Column(String)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime, default=datetime.utcnow)

    company = relationship('Company')
    region = relationship('Region')
    working_hours = relationship('CompanyWorkingHours', back_populates="location", foreign_keys="CompanyWorkingHours.location_id")



class Review(db.Model):
    __tablename__ = 'review'

    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False)
    head = Column(String(100), nullable=False)
    body = Column(Text, nullable=False)
    company = Column(Integer, ForeignKey('company.id'))
    _type = Column(String) 

class ReviewMessageTemplate(db.Model):
    __tablename__ = 'review_message_template'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('company.id'))
    user_id = Column(Integer, ForeignKey('user.id'))
    file_name = Column(String)
    file_location = Column(String)
