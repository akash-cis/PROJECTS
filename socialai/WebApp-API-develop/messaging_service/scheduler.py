# Hack for sibling import for importing api for local testing
# import sys, os
# sys.path.insert(0, os.path.abspath('..'))
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, date, tzinfo
from json import dumps
from typing import Tuple, Any, List

import boto3
from botocore.config import Config as BotoCoreConfig
from sqlalchemy import create_engine, or_, case
from sqlalchemy.orm import sessionmaker

import config, time
from dateutil import tz
import traceback
from api.models import CompanyWorkingHours, Leads, LeadPhones, Campaign, CampaignSelections, CampaignTemplates, \
    LeadSource, Message, ScheduledMessages, Company
from api.sms import look_up_phone_type

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

Session = sessionmaker(bind=engine)

boto_config = BotoCoreConfig(read_timeout=70)
client = boto3.client('stepfunctions', config=boto_config)

TEMPORAL_VALUES = {
    'SECONDS': 1,
    'MINUTES': 60,
    'HOURS': 60 * 60,
    'DAYS': 60 * 60 * 24,
    'WEEKS': 60 * 60 * 24 * 7,
    'MONTHS': 60 * 60 * 24 * 30
}

WEEK_DAYS = {
    "MONDAY": 0,
    "TUESDAY": 1,
    "WEDNESDAY": 2,
    "THURSDAY": 3,
    "FRIDAY": 4,
    "SATURDAY": 5,
    "SUNDAY": 6
}


def convert_to_seconds(numeric_value: int, temporal_value: str) -> int:
    """Converts the temporal numeric value to seconds.

    Args:
        numeric_value: An integer value representing the time interval.
        temporal_value: A string value representing the time interval.

    Returns:
        An integer representing the time interval in seconds.
    """
    return numeric_value * TEMPORAL_VALUES[temporal_value]


def get_leads(session, campaign, company_id) -> Any:
    """Retrieves the leads for a campaign.

    Retrieves the leads for a campaign.

    Args:
        session:
        campaign:
        company_id:

    Returns:
        A list of leads for this campaign.
    """
    # TODO: Change the condition to use the type of campaign rather than the name
    leads = []
    if campaign.campaign_type.type.value == 'DEFAULT':
        # leads = session.query(Leads).filter(Leads.company_id == company_id, Leads.is_deleted == False).all()
        # print("Leads in Default Campaign:", leads)
        # TODO: For automatic campaign for new leads, replace with a campaign of type 'New Leads'
        return []
    else:
        q = CampaignSelections.query.filter(CampaignSelections.campaign_id == campaign.id).all()
        if q and len(q) and q[0].type.value == 'LEAD':
            list_id = []
            for row in q:
                list_id.append(row.value)
            leads = session.query(Leads).filter(Leads.id.in_(list_id), Leads.is_deleted == False).all()
            print("Leads in Leads Campaign:", leads)
        elif q and len(q) and q[0].type.value == 'SOURCE':
            or_filters = []
            for row in q:
                source_id = row.value
                or_filters.append(Leads.lead_source_original_id == source_id)
            leads = session.query(Leads).filter(or_(*or_filters), Leads.is_deleted == False).all()
            print("Leads in Source Campaign:", leads)
        elif q and len(q) and q[0].type.value == 'FILE':
            file_id = q[0].value
            leads = session.query(Leads).filter(Leads.lead_file_id == file_id, Leads.is_deleted == False).all()
            print("Leads in File Campaign:", leads)
        elif q and len(q) and q[0].type.value == 'STATUS':
            lead_status_type_id = q[0].value
            leads = session.query(Leads).filter(Leads.lead_status_type_id == lead_status_type_id, Leads.is_deleted == False).all()
            print("Leads in Status Campaign:", leads)
        return leads


def get_sorted_schedules(schedules: Any) -> List[Tuple]:
    """Retrieves a sorted schedule list.

    Returns a list of the schedules sorted by the sort_order field.

    Args:
        schedules: A list of campaign schedules.

    Returns:
        A list of the campaign schedule items sorted by the sort_order field.
    """
    schedule_list = []
    for schedule in schedules:
        # schedule_option = schedule.campaign_schedules_option
        # print("Schedule Option", schedule_option)
        seconds = convert_to_seconds(schedule.numeric_value, schedule.temporal_value.value)
        # schedule_option.temporal_value.value is enum using value to get string value
        schedule_list.append((seconds, schedule.type.value, schedule.id, schedule.sort_order))

    # Sort by the schedule sort_order field
    schedule_list.sort(key=lambda x: x[3])
    print("Schedule_list => ", schedule_list)
    return schedule_list


def is_valid_schedule(schedule_list=None) -> bool:
    """Check if the schedule is valid.

    Checks if the schedule is valid and returns a boolean.

    Args:
        schedule_list: A list of the Tuples with the values of the campaign schedule fields. The values in each tuple
          are: Interval (in seconds) to wait before sending the message, type of occurrence (ONCE/REPEAT),
          ID of the schedule, sort order of item.

    Returns:
        True, if the schedule is valid, otherwise False.
    """
    # There must be at least one item in the schedule list
    if not len(schedule_list):
        return False

    # If there is only one item in the schedule list, it is good
    if len(schedule_list) == 1:
        return True

    # If there are more than items in the schedule, all of them should have a frequency of 'ONCE', except the last one,
    # which can be either 'ONCE' or 'REPEAT'.
    if len(schedule_list) >= 2:
        for (_, frequency, __, ___) in schedule_list[:-1]:
            if frequency != 'ONCE':
                return False

    return True


def decode_template(session, template, lead, is_after_hour_text=False):
    """Retrieves the template text with the variables replaced with corresponding values.

    Replaces the variables in the template message with their corresponding values and returns the decoded message.

    Args:
        session:
        template:
        lead:
        is_after_hour_text:

    Returns:
        A str representing the decoded message template where the variables are replaced with their corresponding
        values.
    """
    if template:
        template_text = template.after_hour_template_text if is_after_hour_text else template.template_text
        # TODO: Need to handle this better
        if template_text is None:
            # No after hour message present
            template_text = template.template_text
        first_name = lead.first_name or ""
        last_name = lead.last_name or ""
        vehicle_of_interest = ""
        source_name = ""
        voi = lead.vehicle_of_interest
        if voi:
            vehicle_of_interest = " ".join(list(filter(lambda x: x, [voi[0].make, voi[0].model, voi[0].year])))
        lead_source = session.query(LeadSource).filter(LeadSource.id == template.source_id).first()
        if lead_source:
            source_name = lead_source.name
        d = defaultdict(lambda: "")
        var_dict = {"firstName": first_name, "lastName": last_name, "vehicleOfInterest": vehicle_of_interest,
                    "sourceName": source_name}
        d.update(var_dict)
        return template_text.format_map(d)


def start_step_execution(_input):
    try:
        _uuid = str(uuid.uuid4())
        response = client.start_execution(stateMachineArn=config.MSG_SCHEDULER_STATE_MACHINE_ARN, name=_uuid,
                                          input=dumps(_input))
        # time.sleep(2)
        return response
    except client.exceptions.ExecutionAlreadyExists as e:
        print("Exception:", e)
        _uuid = str(uuid.uuid4())
        response = client.start_execution(stateMachineArn=config.MSG_SCHEDULER_STATE_MACHINE_ARN, name=_uuid,
                                          input=dumps(_input))
        # time.sleep(2)
        return response


def get_local_to_utc_time(timezone: tzinfo, dt: date, tm: time, num_days: float) -> datetime:
    """Get the UTC datetime for a datetime in a given timezone after applying an offset.

    Retrieves the UTC date-time for a given date and time in a particular timezone, after applying an optional offset
    (in days). The date and time are first combined, after applying the offset, and then converted to the UTC timezone.

    Args:
        timezone: The timezone of the date and time.
        dt: The date in the timezone.
        tm: The time in the timezone.
        num_days: The number of days

    Returns:
        A datetime object in UTC timezone.
    """
    new_date = dt + timedelta(days=num_days)
    new_timezone_datetime = datetime.combine(new_date, tm).replace(tzinfo=timezone)
    new_utc_datetime = new_timezone_datetime.astimezone(tz.UTC)
    return new_utc_datetime


def get_next_time(working_hours: Any, index: int, timezone_date: date, timezone: tzinfo, is_open_time=True):
    """Retrieves the next open or close working time based on the index of datetime.

    This function to find the next open or close working time based on the index of datetime.
    For e.g., given the following working hours of a business
    Open  : 09:00 AM
    Close : 06:00 PM
    Here are the next working open/close times
    if Current: 1st Sep at 11:30 AM     -> next open_time   : 2nd Sep at 09:00 AM
                                        -> next close_time  : 1st Sep at 06:00 PM

    if Current: 1st Sep at 05:30 AM     -> next open_time   : 1st Sep at 09:00 AM
                                        -> next close_time  : 1st Sep at 06:00 PM

    if Current: 1st Sep at 11:30 PM     -> next open_time   : 2nd Sep at 09:00 AM
                                        -> next close_time  : 2nd Sep at 06:00 PM

    Args:
        working_hours: working_hours: A list of the CompanyWorkingHours objects.
          TODO: This is currently set to `Any` type as this is a result of an SQLAlchemy query, which does not support
          type hinting cleanly.
        index: An integer representing the index of the element in the working_hours list.
        timezone_date: The date used as the basis for calculating the next open/close date
        timezone: The timezone in which the business operates.
        is_open_time: A boolean indicator to determine if the calculation is for the open time or the close time.

    Returns:
        A datetime object in UTC, representing the open or close time of the next working day.
    """
    '''
                
    '''
    for i, working_hour in enumerate(working_hours[index + 1:] + working_hours[:index - 1]):
        if working_hour.is_working_day:
            if is_open_time:
                return get_local_to_utc_time(timezone, timezone_date, working_hour.start_time, index + i + 1)
            return get_local_to_utc_time(timezone, timezone_date, working_hour.end_time, index + i + 1)
    return None


def get_next_open_close_time(working_hours: Any, current_datetime: datetime, current_date: date,
                             timezone: tzinfo) -> Tuple:
    """Get the next open and close times of a business, and if they are within working-hours.

    Retrieves the next open and close date-times of a business, given the current date and time. Also return an
    indication of whether the current time is within the working-hours or after-hours.

    Args:
        working_hours: A list of the CompanyWorkingHours objects.
          TODO: This is currently set to `Any` type as this is a result of an SQLAlchemy query, which does not support
          type hinting cleanly.
        current_datetime: A datetime object representing the current date and time.
        current_date: A date object representing the date in the timezone.
        timezone: The timezone in which the business operates.

    Returns:
        A tuple with the following values: next opening time, next closing time and if the current time is within the
        working hours.
    """
    next_opening_time = None  # Get next opening working hour based on current time
    next_closing_time = None  # Get next closing working hour based on current time
    is_in_working_hours = False  # TRUE if current time between open & close time of current date otherwise FALSE

    for index, working_hour in enumerate(working_hours):
        if working_hour.is_working_day:
            open_datetime = get_local_to_utc_time(timezone, current_date, working_hour.start_time, index)
            close_datetime = get_local_to_utc_time(timezone, current_date, working_hour.end_time, index)

            # Check start_time, current_time & end_time difference with priority.
            if open_datetime < current_datetime < close_datetime:
                '''
                Get Next Opening time from next day start_time
                Get Next Closing time from current day end_time
                Current Time between ON working hour
                '''
                next_opening_time = get_next_time(working_hours, index, current_date, timezone, True)
                next_closing_time = close_datetime
                is_in_working_hours = True
            elif open_datetime > current_datetime:
                '''
                Get Next Opening time from current day start_time
                Get Next Closing time from current day end_time
                Current Time between OFF working hour
                '''
                next_opening_time = open_datetime
                next_closing_time = close_datetime
            elif close_datetime < current_datetime:
                '''
                Get Next Opening time from next day start_time
                Get Next Closing time from next day end_time
                Current Time between OFF working hour
                '''
                next_opening_time = get_next_time(working_hours, index, current_date, timezone, True)
                next_closing_time = get_next_time(working_hours, index, current_date, timezone, False)

        if next_opening_time and next_closing_time:
            # Next opening and closing times found, break the loop
            break

    return next_opening_time, next_closing_time, is_in_working_hours


def scheduler():
    while True:
        print("*" * 45)
        print("Starting from the top")
        print("*" * 45)
        session = Session()
        campaigns = session.query(Campaign).all()
        for campaign in campaigns:
            company_id = campaign.company_id
            campaign_id = campaign.id
            campaign_name = campaign.name

            company = session.query(Company).filter(Company.id == company_id).first()
            if company and company.automatic_engagement is not True:
                continue

            print("COMPANY ID", company_id, "CAMPAIGN_ID", campaign_id, "CAMPAIGN_NAME", campaign.name)

            # Ignore inactive and disabled campaigns
            if campaign.active_ind.value == "Inactive" or campaign.is_disabled is True:
                continue

            current_utc_datetime_notz = datetime.utcnow()  # This is a UTC datetime, but not timezone-aware
            current_utc_datetime_tz = current_utc_datetime_notz.astimezone(tz.UTC)  # This is timezone-aware

            # Ignore campaigns that are not yet ready to start
            if campaign.start_date and campaign.start_date > current_utc_datetime_notz:
                continue

            # Ignore campaigns that have completed
            if campaign.end_date and campaign.end_date < current_utc_datetime_notz:
                continue

            today_week_day = current_utc_datetime_notz.weekday()  # Get weekday number of today

            '''
            Setup the weekdays list of start from current weekday to next same weekdays
            e.g. Today is "THURSDAY" then weekdays list like 
            {"THURSDAY": 0, "FRIDAY": 1, "SATURDAY": 2, "SUNDAY": 3, "MONDAY": 4, "TUESDAY": 5, "WEDNESDAY": 6}
            '''
            next_weekdays = {
                weekday_key: weekday_val - today_week_day + (0 if weekday_val >= today_week_day else 7)
                for weekday_key, weekday_val in WEEK_DAYS.items()
            }

            working_hours = session.query(CompanyWorkingHours) \
                .filter(
                    CompanyWorkingHours.company_id == company_id,
                    CompanyWorkingHours.is_active == True,
                    CompanyWorkingHours.is_deleted == False) \
                .order_by(
                    case(value=CompanyWorkingHours.week_day, whens=next_weekdays).label("week_day"),
                    CompanyWorkingHours.id.desc()) \
                .all()

            # TODO: Do not default the timezone to UTC. This could be problematic.
            timezone = tz.gettz(company.timezone) if company.timezone else tz.tzutc()
            current_utc_date = current_utc_datetime_notz.date()
            current_utc_time = current_utc_datetime_notz.time()
            # This is equivalent to `current_utc_datetime.astimezone(tz.UTC)`. The `get_local_to_utc_time()` function
            # call was just used to make it consistent with other portions of the application.
            timezone_datetime = get_local_to_utc_time(tz.UTC, current_utc_date, current_utc_time, 0)

            next_opening_time, next_closing_time, is_in_working_hour = \
                get_next_open_close_time(working_hours, timezone_datetime, timezone_datetime.date(), timezone)

            templates = campaign.campaign_templates
            print("Templates: ", templates)
            schedules = campaign.campaign_schedules
            print("Schedules: ", schedules)
            schedule_list = []
            schedule_list = get_sorted_schedules(schedules)

            if not is_valid_schedule(schedule_list):
                print("Not a valid schedule")
                continue

            leads = get_leads(session, campaign, company_id)

            for (schedule_seconds, frequency, schedule_id, sort_order) in schedule_list:
                print("=" * 35)
                print("schedule_seconds", schedule_seconds, "frequency", frequency, "schedule_id", schedule_id,
                      "sort_order", sort_order)
                print("=" * 35)

                for lead in leads:
                    print("-" * 25)
                    print("Lead id", lead.id)
                    print("-" * 25)
                    if lead.constrains():
                        lead_scheduled_template = session.query(CampaignTemplates).filter(
                            CampaignTemplates.schedule_id == schedule_id,
                            or_(
                                CampaignTemplates.source_id == lead.lead_source_original_id,
                                CampaignTemplates.source_id == None
                            ),
                            CampaignTemplates.active_ind != False
                        ).first()
                        if not lead_scheduled_template:
                            print("Continuing")
                            continue

                        lead_phones = session.query(LeadPhones).filter(LeadPhones.lead_id == lead.id,
                                                                       LeadPhones.lookup_type == None).all()
                        for phone in lead_phones:
                            if not phone.lookup_type:
                                phone.lookup_type = look_up_phone_type(phone.phone)
                                session.add(phone)
                                session.commit()

                        whens = {'Cellular': 0, 'Cell': 1, 'Mobile': 2, 'Home': 3, 'Work': 4, 'Unknown': 5, 'None': 6,
                                 None: 7}
                        lead_phone = session.query(LeadPhones).filter(LeadPhones.lead_id == lead.id,
                                                                      LeadPhones.lookup_type.in_(["mobile", "voip"])) \
                            .order_by(case(value=LeadPhones.phone_type, whens=whens).label("phone_type"),
                                      LeadPhones.id.desc()).first()
                        if not lead_phone:
                            continue

                        reply = session.query(Message).filter(Message.lead_id == lead.id,
                                                              Message.date_received != None).first()
                        if reply:
                            lead_schedules = session.query(ScheduledMessages).filter(
                                ScheduledMessages.lead_id == lead.id,
                                ScheduledMessages.campaign_id == campaign_id).all()
                            for schedule in lead_schedules:
                                try:
                                    client.stop_execution(executionArn=schedule.execution_arn,
                                                          cause="User Replied Back")
                                except client.exceptions.ExecutionDoesNotExist as e:
                                    traceback.print_exc()
                            session.query(ScheduledMessages).filter(ScheduledMessages.lead_id == lead.id,
                                                                    ScheduledMessages.campaign_id == campaign_id).delete()
                            session.commit()
                            print("Lead Replied")
                            continue

                        to_phone = lead_phone.phone

                        print("template_text", lead_scheduled_template.template_text)
                        first_message = session.query(Message).filter(Message.lead_id == lead.id,
                                                                      Message.date_sent != None,
                                                                      Message.campaign_id == campaign_id,
                                                                      Message.user_id == None).order_by(
                                                    Message.id.asc()).first()

                        first_schedule_message = session.query(ScheduledMessages).filter(
                                                                        ScheduledMessages.lead_id == lead.id, 
                                                                        ScheduledMessages.campaign_id == campaign_id
                                                                    ).first()
                        if lead_scheduled_template.is_after_hour and not is_in_working_hour and not first_schedule_message and not first_message:
                            print("after_hour_template_text", lead_scheduled_template.after_hour_template_text)
                            send_datetime = f'{str(datetime.utcnow()).replace(" ", "T")}Z'
                            content = decode_template(session, lead_scheduled_template, lead, True)
                            _input = {"sendDateTime": send_datetime, "id": lead.id, "content": content,
                                      "to_phone": to_phone, "company_id": company_id, "campaign_id": campaign_id,
                                      "campaign_name": campaign_name}
                            print("*" * 50)
                            print("Start Execution for FIRST After Hour message", lead.id, None)
                            print("*" * 50)
                            response = start_step_execution(_input)
                            sm = ScheduledMessages(lead_id=lead.id, campaign_id=campaign_id, frequency='AFTER_HOUR',
                                                   scheduled_seconds=schedule_seconds,
                                                   repeat_scheduled_seconds=sort_order,
                                                   execution_arn=response.get('executionArn'))
                            session.add(sm)
                            session.commit()
                            continue

                        if first_message:
                            # The `date_sent` field is a timezone-unaware/naive datetime, so convert it  to a UTC
                            # timestamp to be able to compare with other datetime objects.
                            start_datetime = first_message.date_sent.astimezone(tz.UTC)
                            # Look for first ONCE schedule if not available look for REPEAT schedule
                            first_option_seconds = 0
                            for (seconds, _frequency, _, __) in schedule_list:
                                if _frequency == "ONCE":
                                    first_option_seconds = seconds
                                    break
                            if not first_option_seconds:
                                for (seconds, _frequency, _, __) in schedule_list:
                                    if _frequency == "REPEAT":
                                        first_option_seconds = seconds
                                        break

                            if not first_option_seconds:
                                start_datetime = start_datetime - timedelta(seconds=first_option_seconds)
                        else:
                            start_datetime = datetime.utcnow().astimezone(tz.UTC)

                        if frequency == 'ONCE':
                            print("ONCE")
                            send_acc = 0
                            for (_schedule_seconds, _frequency, _schedule_id, _sort_order) in schedule_list:
                                if _frequency == "ONCE":
                                    send_acc += _schedule_seconds
                                    if _sort_order == sort_order:
                                        break
                            td = timedelta(seconds=send_acc)
                            send_datetime = start_datetime + td
                            lead_schedule = session.query(ScheduledMessages).filter(
                                ScheduledMessages.lead_id == lead.id, ScheduledMessages.campaign_id == campaign_id,
                                ScheduledMessages.frequency == "ONCE").first()
                            if lead_schedule:
                                previous_acc = 0
                                for (_schedule_seconds, _frequency, _schedule_id, _sort_order) in schedule_list:
                                    if _frequency == "ONCE":
                                        previous_acc += _schedule_seconds
                                        if lead_schedule.repeat_scheduled_seconds == _sort_order:
                                            break
                                previous_datetime = start_datetime + timedelta(seconds=previous_acc)

                            if lead_scheduled_template.is_after_hour and \
                                    (next_closing_time < send_datetime < next_opening_time or
                                     send_datetime < next_opening_time < next_closing_time):
                                send_datetime = next_opening_time

                            if lead_schedule and \
                                    previous_datetime < datetime.utcnow().astimezone(tz.UTC) < send_datetime and \
                                    lead_schedule.repeat_scheduled_seconds < sort_order:
                                send_datetime = f'{str(send_datetime.replace(tzinfo=None).isoformat()).replace(" ", "T")}Z'
                                content = decode_template(session, lead_scheduled_template, lead)
                                _input = {"sendDateTime": send_datetime, "id": lead.id, "content": content,
                                          "to_phone": to_phone, "company_id": company_id, "campaign_id": campaign_id,
                                          "campaign_name": campaign_name}
                                print("*" * 50)
                                print("IF Start Execution for SECOND and above messages", lead.id, td)
                                print("*" * 50)
                                response = start_step_execution(_input)
                                lead_schedule.scheduled_seconds = schedule_seconds
                                lead_schedule.repeat_scheduled_seconds = sort_order
                                lead_schedule.execution_arn = response.get('executionArn')
                                session.add(lead_schedule)
                                session.commit()
                            elif not lead_schedule:
                                send_datetime = f'{str(send_datetime.replace(tzinfo=None).isoformat()).replace(" ", "T")}Z'
                                content = decode_template(session, lead_scheduled_template, lead)
                                _input = {"sendDateTime": send_datetime, "id": lead.id, "content": content,
                                          "to_phone": to_phone, "company_id": company_id, "campaign_id": campaign_id,
                                          "campaign_name": campaign_name}
                                print("*" * 50)
                                # print("ELIF Start Execution for SECOND and above messages", lead.id, td)
                                print("ELIF Start Execution for FIRST message", lead.id, td)
                                print("*" * 50)
                                response = start_step_execution(_input)
                                sm = ScheduledMessages(lead_id=lead.id, campaign_id=campaign_id, frequency=frequency,
                                                       scheduled_seconds=schedule_seconds,
                                                       repeat_scheduled_seconds=sort_order,
                                                       execution_arn=response.get('executionArn'))
                                session.add(sm)
                                session.commit()

                        if frequency == 'REPEAT':
                            print("REPEAT")
                            # scheduled_frequency = (first_last_message_time_diff//schedule_seconds) + 1
                            previous_acc = 0
                            if len(schedule_list) >= 2:
                                (_, __, ___, _sort_order) = schedule_list[-2]
                                once_lead_schedule = session.query(ScheduledMessages).filter(
                                    ScheduledMessages.lead_id == lead.id, ScheduledMessages.campaign_id == campaign_id,
                                    ScheduledMessages.frequency == "ONCE",
                                    ScheduledMessages.repeat_scheduled_seconds == _sort_order).first()
                                if not once_lead_schedule:
                                    continue
                                for (_schedule_seconds, _frequency, _schedule_id, _sort_order) in schedule_list:
                                    if _frequency == "ONCE":
                                        previous_acc += _schedule_seconds
                                        if once_lead_schedule.repeat_scheduled_seconds == _sort_order:
                                            break

                            lead_schedule = session.query(ScheduledMessages).filter(
                                ScheduledMessages.lead_id == lead.id, ScheduledMessages.campaign_id == campaign_id,
                                ScheduledMessages.frequency == "REPEAT",
                                ScheduledMessages.scheduled_seconds == schedule_seconds).first()

                            if lead_schedule:
                                prev_td = timedelta(seconds=lead_schedule.repeat_scheduled_seconds)
                                td = prev_td + timedelta(seconds=schedule_seconds)
                            else:
                                td = timedelta(seconds=schedule_seconds)
                            send_datetime = start_datetime + td + timedelta(seconds=previous_acc)
                            if lead_schedule:
                                previous_datetime = start_datetime + timedelta(
                                    seconds=lead_schedule.repeat_scheduled_seconds) + timedelta(seconds=previous_acc)
                            else:
                                previous_datetime = start_datetime + timedelta(seconds=previous_acc)

                            if lead_scheduled_template.is_after_hour and \
                                    (next_closing_time < send_datetime < next_opening_time or
                                     send_datetime < next_opening_time < next_closing_time):
                                send_datetime = next_opening_time

                            if lead_schedule and \
                                    previous_datetime < datetime.utcnow().astimezone(tz.UTC) < send_datetime and \
                                    timedelta(seconds=lead_schedule.repeat_scheduled_seconds) < td:
                                send_datetime = f'{str(send_datetime.replace(tzinfo=None).isoformat()).replace(" ", "T")}Z'
                                content = decode_template(session, lead_scheduled_template, lead)
                                _input = {"sendDateTime": send_datetime, "id": lead.id, "content": content,
                                          "to_phone": to_phone, "company_id": company_id, "campaign_id": campaign_id,
                                          "campaign_name": campaign_name}
                                print("*" * 50)
                                print("IF Start Execution for REPEATED SECOND and above messages", lead.id, td)
                                print("*" * 50)
                                response = start_step_execution(_input)
                                lead_schedule.repeat_scheduled_seconds = int(td.total_seconds())
                                lead_schedule.execution_arn = response.get('executionArn')
                                session.add(lead_schedule)
                                session.commit()
                            elif not lead_schedule \
                                    and previous_datetime < datetime.utcnow().astimezone(tz.UTC) < send_datetime:
                                send_datetime = f'{str(send_datetime.replace(tzinfo=None).isoformat()).replace(" ", "T")}Z'
                                content = decode_template(session, lead_scheduled_template, lead)
                                _input = {"sendDateTime": send_datetime, "id": lead.id, "content": content,
                                          "to_phone": to_phone, "company_id": company_id, "campaign_id": campaign_id,
                                          "campaign_name": campaign_name}
                                print("*" * 50)
                                print("ELIF Start Execution for First REPEATED", lead.id, td)
                                print("*" * 50)
                                response = start_step_execution(_input)
                                sm = ScheduledMessages(lead_id=lead.id, campaign_id=campaign_id, frequency=frequency,
                                                       scheduled_seconds=int(td.total_seconds()),
                                                       execution_arn=response.get('executionArn'),
                                                       repeat_scheduled_seconds=int(td.total_seconds()))
                                session.add(sm)
                                session.commit()
            # if leads:
            #     time.sleep(10)
        session.close()


if __name__ == "__main__":
    scheduler()
