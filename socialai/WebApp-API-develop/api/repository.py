import boto3
import os
from api import models
from api.models import *
from api import db, schema, elasticsearch
from collections import defaultdict
from api.auth import get_token_from_header
import random
import string
from api.email import send_invitation, send_existing_invitation
from sqlalchemy import func, Enum, or_, and_, cast, String as SqlString
from datetime import datetime, timedelta
from api.utils.constants import PROSPECTS
from api.labelling_api import create_company_source
import json
import re


cognito_client = boto3.client('cognito-idp')

def parse_possible_multivalue_query(filters, query_field, value):
    values = value.split('|')
    filter_type = 'and_or_filters' if len(values) > 1 else 'and_filters'
    value = values if len(values) > 1 else values[0]

    return {
        'filter':         {
            'query_field': query_field,
            'value': value
        },
        'filter_type': filter_type,
    }


def map_template_filter(filter):
    if filter.filter_type.type == FilterGroupType.TEMPLATE:
        try:
            parsed_value = json.loads(filter.value)
            condition = parsed_value['condition'] if 'condition' in parsed_value else 'and'

            variables = re.findall('\{(.*?)\}',filter.filter_type.filter_field)
            variables = list(dict.fromkeys(variables))

            query_field = filter.filter_type.filter_field

            for variable in variables:
                query_field = query_field.replace(f"{{{variable}}}", parsed_value[variable])

            return { 'mapped_filter': { 'query_field': query_field, 'value': [parsed_value["value"]] if "_" in condition else parsed_value["value"]}, 'condition': condition}
        except:
            print("Can't parse template filter")
    return { 'mapped_filter': { 'query_field': filter.filter_type.filter_field, 'value': filter.value }, 'condition': 'and'}

class UserRepository:
    @staticmethod
    def create_user(email, first_name, last_name):
        cognito_userpool_id = os.getenv('COGNITO_USERPOOL_ID')
        user_cognito_id = ''
        try:
            temp_password = generate_random_temp_password()
            response = cognito_client.admin_create_user(
                UserPoolId=cognito_userpool_id,
                Username=email,
                UserAttributes=[
                    {
                        'Name': 'email',
                        'Value': email
                    },
                    {
                        'Name': 'custom:first_name',
                        'Value': first_name
                    },
                    {
                        'Name': 'custom:last_name',
                        'Value': last_name
                    },
                ],
                TemporaryPassword=temp_password,
                MessageAction='SUPPRESS',
            )
            user_cognito_id = response['User']['Username']
            send_invitation(email, temp_password, first_name)
        except Exception as e:
            print(e)
            user_res = cognito_client.admin_get_user(
                UserPoolId=cognito_userpool_id,
                Username=email
            )
            user_cognito_id = user_res['Username']
            send_existing_invitation(email, first_name)
        return user_cognito_id

    @staticmethod
    def get_user_filters_for_es(user: User):
        filters = []
        filter_groups = defaultdict(list)
        for u_filter in user.filters:
            filter_groups[u_filter.filter_type.filter_field].append(u_filter)

        for filter_group in filter_groups.values():
            filter_type = filter_group[0].filter_type
            field = filter_type.filter_field
            if '+' in field:
                result = {'type': 'or', 'query': 'term', 'queries': []}
                field_list = filter_type.filter_field.split('+')
                co_filters = db.session.query(CompanyFilter).join(SelectionOption).join(FilterType).filter(
                    FilterType.name == field_list[0],
                    CompanyFilter.company_id == filter_group[0].company_filter.company_id).all()
                if len(co_filters) > 0:
                    co_filter_ids = []
                    queries = []
                    for co_fil in co_filters:
                        co_filter_ids.append(co_fil.id)
                        queries.append(co_fil.selection_option.query)
                    user_filters = db.session.query(UserFilter).filter(UserFilter.user_id == user.id).filter(
                        (UserFilter.company_filter_id.in_(co_filter_ids))).all()
                    if len(user_filters) > 0:
                        queries.clear()
                        for fil in user_filters:
                            queries.append(fil.company_filter.selection_option.query)
                    values = ''
                    for use_filter in filter_group:
                        if filter_type == FilterGroupType.TEXT or filter_type == FilterGroupType.TEMPLATE:
                            values += f'{use_filter.query} '
                        else:
                            values += f'{use_filter.company_filter.selection_option.query} '
                    for query in queries:
                        base_field = co_filters[0].selection_option.filter_type.filter_field.split('.class')[0]
                        es_filter = {'field': base_field + '=' + query + field_list[1], 'value': values[:-1]}
                        result['queries'].append(es_filter)
                    filters.append(result)
            else:
                result = {'type': 'and', 'query': 'term', 'queries': []}
                es_filter = {'field': field}
                values = ''
                for use_filter in filter_group:

                    if filter_type.type == FilterGroupType.TEXT or filter_type.type == FilterGroupType.TEMPLATE:
                        values += f'{use_filter.value} '
                        result['query'] = 'match'
                    else:
                        values += f'{use_filter.company_filter.selection_option.query} '
                es_filter['value'] = values[:-1]
                result['queries'].append(es_filter)
                filters.append(result)
        return filters


    @staticmethod
    def get_filters_for_es(user: User, set_type=None, configFilters=None, skip_user_defaults=False):
        filters = {
            'and_filters': [],
            'and_or_filters': [],
            'or_filters': [],
            'or_or_filters': [],
            'exclude_filters': [],
            'range_filters': []
        }
        contraint_or_filters = []
        co_filter_groups = defaultdict(list)

        filtered_filters = []
        for c_filter in user.company.filters:
                co_filter_groups[c_filter.selection_option.filter_type.name].append(c_filter)

        if configFilters:
            for f in configFilters:
                filtered_filters.append(f)
        # Prospects can be none to maintain backwards compatibility
        elif set_type == None or set_type == PROSPECTS:
            for f in user.filters:
                filtered_filters = [f for f in user.filters if f.set_type == None or f.set_type == PROSPECTS]
        # For other set_types they need to be explicitly passed as an argument
        else:
            filtered_filters = [f for f in user.filters if f.set_type == set_type]

        user_filter_groups = defaultdict(list)
        for u_filter in filtered_filters:
            user_filter_groups[u_filter.filter_type.name].append(u_filter)

        for co_filter_type, co_filters in co_filter_groups.items():
            if not co_filters[0].user_can_change and not skip_user_defaults:
                if co_filters[0].selection_option.filter_type.type == FilterGroupType.SELECT:
                    for co_filter in co_filters:
                        filters['and_filters'].append(
                            {
                                'query_field': co_filter.selection_option.filter_type.filter_field,
                                'value': co_filter.selection_option.query
                            }
                        )
                elif co_filters[0].selection_option.filter_type.type == FilterGroupType.MULTISELECT:
                    if len(co_filters) > 1:
                        values = []
                        for co_filter in co_filters:
                            values.extend(co_filter.selection_option.query.split('|'))
                        filters['and_or_filters'].append(
                            {
                                'query_field': co_filters[0].selection_option.filter_type.filter_field,
                                'value': values
                            }
                        )
                    else:
                        possible_multivalue_query = parse_possible_multivalue_query(filters, co_filters[0].selection_option.filter_type.filter_field, co_filters[0].selection_option.query)
                        filters[possible_multivalue_query['filter_type']].append(
                            {
                                'query_field': possible_multivalue_query['filter']['query_field'],
                                'value': possible_multivalue_query['filter']['value']
                            }
                        )

            elif co_filter_type in user_filter_groups:
                if co_filters[0].selection_option.filter_type.type == FilterGroupType.SELECT:
                    field = co_filters[0].selection_option.filter_type.filter_field
                    query_field, query_fields = UserRepository.build_dependent_query_fields(field, user_filter_groups, co_filter_groups)
                    if len(query_fields) > 0:
                        for query_field in query_fields:
                            for user_filter in user_filter_groups[co_filter_type]:
                                filters['or_filters'].append(
                                    {
                                        'query_field': query_field,
                                        'value': user_filter.company_filter.selection_option.query
                                    }
                                )
                    else:
                        for user_filter in user_filter_groups[co_filter_type]:
                            filters['or_filters'].append(
                                {
                                    'query_field': query_field,
                                    'value': user_filter.company_filter.selection_option.query
                                }
                            )
                    # TODO: make this check a dynamic solution. Not hardcoded
                    if co_filter_type == 'New/Used':
                        exclude_filter = [f for f in co_filter_groups[co_filter_type] if f.selection_option.query != user_filter_groups[co_filter_type][0].company_filter.selection_option.query]
                        filters['exclude_filters'].append({'query_field': query_field, 'value': exclude_filter[0].selection_option.query})
                    user_filter_groups.pop(co_filter_type)
                if co_filters[0].selection_option.filter_type.type == FilterGroupType.RANGE:
                    field = co_filters[0].selection_option.filter_type.filter_field
                    query_field, query_fields = UserRepository.build_dependent_query_fields(field, user_filter_groups, co_filter_groups)
                    if len(query_fields) > 0:
                        for query_field in query_fields:
                            for user_filter in user_filter_groups[co_filter_type]:
                                filters['range_filters'].append(
                                    {
                                        'query_field': query_field,
                                        'value': user_filter.company_filter.selection_option.query
                                    }
                                )
                    else:
                        for user_filter in user_filter_groups[co_filter_type]:
                            filters['range_filters'].append(
                                {
                                    'query_field': query_field,
                                    'value': user_filter.company_filter.selection_option.query
                                }
                            )
                    user_filter_groups.pop(co_filter_type)
                elif co_filters[0].selection_option.filter_type.type == FilterGroupType.MULTISELECT:
                    field = co_filters[0].selection_option.filter_type.filter_field
                    query_field, query_fields = UserRepository.build_dependent_query_fields(field, user_filter_groups,
                                                                                            co_filter_groups)
                    if len(user_filter_groups[co_filter_type]) > 1 and len(query_fields) == 0:
                        values = []
                        for user_filter in user_filter_groups[co_filter_type]:
                            values.extend(user_filter.company_filter.selection_option.query.split('|'))
                        filters['and_or_filters'].append(
                            {
                                'query_field': query_field,
                                'value': values
                            }
                        )
                    elif len(user_filter_groups[co_filter_type]) > 1 and len(query_fields) > 0:
                        for query_field in query_fields:
                            values = []
                            for user_filter in user_filter_groups[co_filter_type]:
                                values.append(user_filter.company_filter.selection_option.query)
                            filters['or_or_filters'].append(
                                {
                                    'query_field': query_field,
                                    'value': values
                                }
                            )
                    elif len(query_fields) > 0:
                        for query_field in query_fields:
                            filters['and_filters'].append(
                                {
                                    'query_field': query_field,
                                    'value': user_filter_groups[co_filter_type][0].company_filter.selection_option.query
                                }
                            )
                    else:
                        possible_multivalue_query = parse_possible_multivalue_query(filters, query_field, user_filter_groups[co_filter_type][0].company_filter.selection_option.query)
                        filters[possible_multivalue_query['filter_type']].append(
                            {
                                'query_field': possible_multivalue_query['filter']['query_field'],
                                'value': possible_multivalue_query['filter']['value']
                            }
                        )
                    user_filter_groups.pop(co_filter_type)
            elif not skip_user_defaults:
                if co_filters[0].selection_option.filter_type.type == FilterGroupType.SELECT:
                    # TODO: Not hardcode this check for new/used to buy/sell dependency
                    if co_filters[0].selection_option.filter_type.name != 'New/Used' and 'Buy/Sell' not in user_filter_groups:
                        field = co_filters[0].selection_option.filter_type.filter_field
                        query_field, query_fields = UserRepository.build_dependent_query_fields(field, user_filter_groups,
                                                                                                co_filter_groups)
                        if len(query_fields) > 0:
                            for query_field in query_fields:
                                for co_filter in co_filters:
                                    contraint_or_filters.append(
                                        {
                                            'query_field': query_field,
                                            'value': co_filter.selection_option.query
                                        }
                                    )
                        else:
                            for co_filter in co_filters:
                                contraint_or_filters.append(
                                    {
                                        'query_field': query_field,
                                        'value': co_filter.selection_option.query
                                    }
                                )
                # elif co_filters[0].selection_option.filter_type.type == FilterGroupType.MULTISELECT:
                #     field = co_filters[0].selection_option.filter_type.filter_field
                #     query_field, query_fields = UserRepository.build_dependent_query_fields(field, user_filter_groups,
                #                                                                             co_filter_groups)
                #     if len(query_fields) > 0:
                #         for query_field in  query_fields:
                #             values = []
                #             for co_filter in co_filters:
                #                 values.append(co_filter.selection_option.query)
                #             filters['or_or_filters'].append(
                #                 {
                #                     'query_field': query_field,
                #                     'value': values
                #                 }
                #             )
                #     else:
                #         values = []
                #         for co_filter in co_filters:
                #             values.append(co_filter.selection_option.query)
                #         filters['and_or_filters'].append(
                #             {
                #                 'query_field': query_field,
                #                 'value': values
                #             }
                #         )
        for user_filter_type, user_filters in user_filter_groups.items():
            if user_filters[0].filter_type.type == FilterGroupType.TEXT:
                values = []
                for user_filter in user_filters:
                     values.append(user_filter.value)
                if '(All)' in user_filters[0].filter_type.name:
                    filter_key = 'and_filters'
                else:
                    filter_key = 'or_filters'
                filters[filter_key].append(
                    {
                        'query_field': user_filters[0].filter_type.filter_field,
                        'value': values
                    }
                )
            elif user_filters[0].filter_type.type == FilterGroupType.TEMPLATE:
                for user_filter in user_filters:
                    template_filter = map_template_filter(user_filter)
                    filters[f"{template_filter['condition']}_filters"].append(
                        template_filter['mapped_filter']
                    )
        if len(filters['or_filters']) == 0:
            filters['or_filters'] = contraint_or_filters
        return filters


    @staticmethod
    def get_company_filter_for_es(user: User):

        constraint_filters = []
        option_filters = []

        co_filter_groups = defaultdict(list)

        for c_filter in user.company.filters:
            co_filter_groups[c_filter.selection_option.filter_type.name].append(c_filter)

        for co_filter_type, co_filters in co_filter_groups.items():

            if co_filters[0].selection_option.filter_type.type != FilterGroupType.TEXT and co_filters[0].selection_option.filter_type.type != FilterGroupType.TEMPLATE:
                filter_vals = []
                for filter in co_filters:
                    filter_vals.append(filter.selection_option.query)

                ready_filter = {
                        'query_field': co_filters[0].selection_option.filter_type.filter_field,
                        'value': filter_vals
                    }
                if co_filters[0].selection_option.filter_type.type == FilterGroupType.MULTISELECT and co_filter_type != 'Make':
                    constraint_filters.append(ready_filter)
                elif co_filters[0].selection_option.filter_type.type == FilterGroupType.SELECT:
                    option_filters.append(ready_filter)

        return {'and_filters': [], 'and_or_filters': constraint_filters, 'or_filters': [], 'or_or_filters': option_filters,'exclude_filters': []}



    @staticmethod
    def build_dependent_query_fields(field, user_filter_groups, co_filter_groups):
        query_field = ''
        query_fields = []
        if '+' in field:
            field_list = field.split('+')
            if field_list[0] in user_filter_groups:
                if len(user_filter_groups[field_list[0]]) > 1:
                    for filter in user_filter_groups[field_list[0]]:
                        query_fields.append(filter.filter_type.filter_field.split('.class')[
                                                0] + '=' + filter.company_filter.selection_option.query +
                                            field_list[1])
                else:
                    filter = user_filter_groups[field_list[0]][0]
                    query_field = filter.filter_type.filter_field.split('.class')[
                                      0] + '=' + filter.company_filter.selection_option.query + field_list[
                                      1]
            else:
                if len(co_filter_groups[field_list[0]]) > 1:
                    for filter in co_filter_groups[field_list[0]]:
                        query_fields.append(
                            filter.selection_option.filter_type.filter_field.split('.class')[
                                0] + '=' + filter.selection_option.query +
                            field_list[1])
                else:
                    filter = co_filter_groups[field_list[0]][0]
                    query_field = filter.selection_option.filter_type.filter_field.split('.class')[
                                      0] + '=' + filter.selection_option.query + \
                                  field_list[1]
        else:
            query_field = field
        return query_field, query_fields


    @staticmethod
    def update_user_pass(headers, email, old_pass, new_pass):
        cognito_userpool_id = os.getenv('COGNITO_USERPOOL_ID')
        try:
            access_token = get_token_from_header(headers)
            response = cognito_client.change_password(
                PreviousPassword=old_pass,
                ProposedPassword=new_pass,
                AccessToken=access_token
            )
        except Exception as e:
            print(e)

    @staticmethod
    def update_user_email(headers, email, user):
        try:
            access_token = get_token_from_header(headers)
            response = cognito_client.update_user_attributes(
                UserAttributes=[
                    {
                        'Name': 'email',
                        'Value': email
                    },
                ],
                AccessToken=access_token
            )


            to_update = db.session.query(Object).filter(Object.type == 'user', Object.key == f'{user.id}')
            for user_update in to_update:
                user_update.display = f'User<{user.id},{email}>'
            
            user.email = email
            db.session.commit()
            # send_invitation(email, temp_password, first_name)
        except Exception as e:
            print(e)

    @staticmethod
    def update_user_status(user: User):
        user.status = UserStatus.ACTIVATED
        db.session.commit()

    @staticmethod
    def reset_and_resend_temp_password(user: User):
        try:
            cognito_userpool_id = os.getenv('COGNITO_USERPOOL_ID')
            temp_password = generate_random_temp_password()
            response = cognito_client.admin_set_user_password(
                UserPoolId=cognito_userpool_id,
                Username=user.cognito_id,
                Password=temp_password,
                Permanent=False
            )
            if response:
                send_invitation(user.email, temp_password, user.first_name)
                return True
            else:
                return False
        except Exception as e:
            print(e)

class DealRepository:
    @staticmethod
    def create_deal(user: User, aingine_data_received: AingineDataReceived, post, post_type=None):
        if post:
            deal = Deal(
                user_id=user.id,
                company_id=user.company_id,
                aingine_data_id=aingine_data_received.aingine_data_id,
                aingine_user_id=post.author_id,
                screen_name=post.author,
                location=post.location,
                url=post.url,
                profile_url=post.author_profile_url,
                source=post.source,
                source_id=post.source_id,
                # TODO: change this to match post strength when we are able to rate them from aingine
                strength=DealStrength.WARM,
                tags=post.tags,
                post_type=post_type # NONE or LIFE_EVENT
            )
            db.session.add(deal)
            db.session.commit()
            db.session.refresh(deal)
            if deal.id:
                entry = ConversationEntry(
                    deal_id=deal.id,
                    type=EntryType.ORIGINAL,
                    message=post.body,
                    post_time=post.timestamp,
                    aingine_user_id=post.author_id,
                    aingine_data_id=post.id
                )
                db.session.add(entry)

                if post.source_type != 'CRAIGSLIST':
                    screen_name = db.session.query(ScreenName).filter(ScreenName.source_id == post.source_id,
                                                                      ScreenName.user_id == user.id).first()
                    response_config = ResponseConfig(
                        deal_id=deal.id,
                        source_id=post.source_id,
                        thread_id=post.thread_id,
                        aingine_user_id=post.author_id,
                        screen_name=screen_name.screen_name if screen_name else None,
                        active=True
                    )
                    db.session.add(response_config)
                db.session.commit()
            else:
                print('Failed to save deal')
        else:
            print('Failed to find post info')

    @staticmethod
    def update_response_config_screen_name(source_id, user_id, screen_name):
        deals = db.session.query(ResponseConfig).join(Deal).filter(Deal.user_id == user_id, Deal.source_id == source_id,
                                                                   ResponseConfig.screen_name == None,
                                                                   ResponseConfig.active == True).all()
        for deal in deals:
            deal.screen_name = screen_name
        db.session.commit()

    @staticmethod
    def search_deals(user_id, search_term):
        return db.session.query(Deal).filter(Deal.user_id == user_id).filter(or_(Deal.source.ilike(f'%{search_term}%'), Deal.location.ilike(f'%{search_term}%'), Deal.screen_name.ilike(f'%{search_term}%'))).all()

    @staticmethod
    def is_subscribed(deal: Deal):
        res_config = db.session.query(ResponseConfig).filter(ResponseConfig.deal_id == deal.id).first()
        return res_config.active if res_config else None

    @staticmethod
    def update_config_subscription(deal_id, subscribed):
        try:
            res_config = db.session.query(ResponseConfig).filter(ResponseConfig.deal_id == deal_id).first()
            if res_config:
                res_config.active = subscribed
                db.session.commit()
                return True
            else:
                return False
        except Exception as e:
            print(e)
            return False


class AnalyticsRepository:

    @staticmethod
    def get_analytics_kpis(user, range, all_members):
        data = []
        since = func.date(datetime.now() - timedelta(days=range-1))
        rows = db.session.query(User.id, User.first_name, User.last_name).all()
        all_users = {}
        for row in rows:
            all_users[row.id] = row.first_name + ' ' + row.last_name

        userIsLeader = True if len(user.teams_leader) > 0 else False
        if userIsLeader or all_members:
            teams_list = []
            
            if all_members:
                #TODO: teams member has the id of the relashionship not the id of the team
                teams_list = db.session.query(TeamMember.team_id).filter(TeamMember.member_id == user.id).all()
            else:
                for team in user.teams_leader:
                    teams_list.append(team.id)

            team_member_list = db.session.query(TeamMember).filter(TeamMember.team_id.in_(teams_list)).all()
            users_list = [user.id]
            for member in team_member_list:
                users_list.append(member.member_id)

        if userIsLeader or all_members:
            prospects = db.session.query(func.count(AingineDataReceived.id), AingineDataReceived.status, func.date(AingineDataReceived.date_created), AingineDataReceived.user_id) \
                .group_by(AingineDataReceived.status, AingineDataReceived.user_id, func.date(AingineDataReceived.date_created)) \
                    .filter(func.date(AingineDataReceived.date_created) >= since, AingineDataReceived.user_id.in_(users_list)).all()
            for item in prospects:
                data.append(create_item(all_users, item, user, "Prospect"))
        else:
            prospects = db.session.query(func.count(AingineDataReceived.id), AingineDataReceived.status, func.date(AingineDataReceived.date_created), AingineDataReceived.user_id) \
                .group_by(AingineDataReceived.status, AingineDataReceived.user_id, func.date(AingineDataReceived.date_created)) \
                    .filter(func.date(AingineDataReceived.date_created) >= since, AingineDataReceived.user_id == user.id).all()
            for item in prospects:
                data.append(create_item(all_users, item, user, "Prospect"))
        
        orFilter = or_(Deal.status == DealStatus.DEAL_WON, Deal.status == DealStatus.PUSHED_CRM)
        if userIsLeader or all_members:
            deals = db.session.query(func.count(Deal.id), Deal.status, func.date(Deal.date_created), Deal.user_id) \
                .group_by(Deal.status, Deal.user_id, func.date(Deal.date_created)) \
                    .filter(and_(func.date(Deal.date_created) >= since, Deal.user_id.in_(users_list), orFilter)).all()
            for item in deals:
                data.append(create_item(all_users, item, user, "Deal"))
        else:
            deals = db.session.query(func.count(Deal.id), Deal.status, func.date(Deal.date_created), Deal.user_id) \
                .group_by(Deal.status, Deal.user_id, func.date(Deal.date_created)) \
                    .filter(and_(func.date(Deal.date_created) >= since, Deal.user_id == user.id, orFilter)).all()
            for item in deals:
                data.append(create_item(all_users, item, user, "Deal"))

        available = get_company_available_post_count(user, range)
        for post_count in available:
            data.append(
                schema.KPIResponse(
                    count=post_count.count,
                    status='Available',
                    date=post_count.timestamp,
                    user_id=user.id,
                    user_name='ALL_TEAM',
                    source='Aingine'
                )
            )

        return data

    @staticmethod
    def get_analytics_app_usage(user, range, all_members):
        data = []
        since = func.date(datetime.now() - timedelta(days=range-1))
        rows = db.session.query(User.id, User.first_name, User.last_name).all()
        all_users = {}
        for row in rows:
            all_users[row.id] = row.first_name + ' ' + row.last_name

        users_list = [str(user.id)]
        userIsLeader = True if len(user.teams_leader) > 0 else False
        if userIsLeader or all_members:
            teams_list = []
            
            if all_members:
                #TODO: teams member has the id of the relashionship not the id of the team
                teams_list = db.session.query(TeamMember.team_id).filter(TeamMember.member_id == user.id).all()
            else:
                for team in user.teams_leader:
                    teams_list.append(team.id)

            team_member_list = db.session.query(TeamMember).filter(TeamMember.team_id.in_(teams_list)).all()
            
            for member in team_member_list:
                users_list.append(str(member.member_id))
        
        subjects_list = []
        all_subjects = {}
        subjects_filter = db.session.query(Object).filter(Object.key.in_(users_list)).all()
        for subject in subjects_filter:
            subjects_list.append(subject.id)
            all_subjects[subject.id] = int(subject.key)

        events = db.session.query(func.sum(Event.duration), func.date(Event.timestamp), Event.subject_id) \
            .group_by(Event.subject_id, func.date(Event.timestamp)) \
                .filter(func.date(Event.timestamp) >= since, Event.subject_id.in_(subjects_list)).all()

        prospects = db.session.query(func.count(AingineDataReceived.id), AingineDataReceived.status, func.date(AingineDataReceived.date_created), AingineDataReceived.user_id) \
            .group_by(AingineDataReceived.status, AingineDataReceived.user_id, func.date(AingineDataReceived.date_created)) \
                .filter(func.date(AingineDataReceived.date_created) >= since, AingineDataReceived.user_id.in_(users_list)).all()
        orFilter = or_(Deal.status == DealStatus.DEAL_WON, Deal.status == DealStatus.PUSHED_CRM)
        deals = db.session.query(func.count(Deal.id), Deal.status, func.date(Deal.date_created), Deal.user_id) \
            .group_by(Deal.status, Deal.user_id, func.date(Deal.date_created)) \
                .filter(and_(func.date(Deal.date_created) >= since, Deal.user_id.in_(users_list), orFilter)).all()
        
        for item in events:
            userId = all_subjects[item[2]]
            userName = all_users[userId]
            provided = 0
            engaged = 0
            converted = 0
            crm = 0
            for p in prospects:
                if p[2] == item[1] and p[3] == userId:
                    provided = provided + p[0]
                if p[2] == item[1] and p[3] == userId and p[1].value == 'Accepted': # only one
                    engaged = engaged + p[0]

            for d in deals:
                if d[2] == item[1] and d[3] == userId and d[1].value == 'Deal Won':
                    converted = converted + d[0]
                if d[2] == item[1] and d[3] == userId and d[1].value == 'Pushed to CRM': # only one
                    crm = crm + d[0]

            data.append(create_item_usage(item, userId, userName, provided, engaged, converted, crm))
        return data


class CompanyRepository:
    @staticmethod
    def add_aingine_source_id_if_not_exist(company_id: int):
        company = db.session.query(Company).filter(Company.id == company_id).first()
        if company and company.aingine_source_id is None:
            aingine_source_id =  create_company_source(company.name, company.id)
            if aingine_source_id:
                company.aingine_source_id = int(aingine_source_id)
                db.session.commit()
                return True
            else:
                return False
        elif company and company.aingine_source_id is not None:
            return True
        else:
            return False


def create_item(all_users, item, user, source):
    userName = all_users[item[3]]

    return schema.KPIResponse(
        count=item[0],
        status=item[1].value,
        date=datetime.fromisoformat(str(item[2])),
        user_id=item[3],
        user_name=userName,
        source=source
    )


def create_item_usage(item, userId, userName, provided, engaged, converted, crm):

    return schema.UsageResponse(
        time=item[0], #duration
        date=item[1], #date
        user_id=userId,
        user_name=userName,
        provided = provided,
        engaged = engaged,
        converted = converted,
        crm = crm
    )

def generate_random_temp_password():
      characters = string.ascii_letters + string.digits + string.punctuation
      temp_pass = random.choice(string.ascii_lowercase)
      temp_pass += random.choice(string.ascii_uppercase)
      temp_pass += random.choice(string.digits)
      temp_pass += random.choice(string.punctuation)

      for i in range(8):
          temp_pass += random.choice(characters)

      pass_list = list(temp_pass)
      random.SystemRandom().shuffle(pass_list)
      return ''.join(pass_list)


def get_company_available_post_count(user, range):
    filters = UserRepository.get_company_filter_for_es(user)
    return elasticsearch.execute_company_available_count(filters, range)

class CampaignRepository:
    def get_campaign_lead_summary(campaign_id, user):
        sent_count = db.session.query(func.count(Message.id)) \
                    .filter(Message.campaign_id==campaign_id, Message.date_sent != None).one()[0]

        campaign_query = db.session.query(func.count(CampaignLeadSummary.id)) \
                            .join(Leads, Leads.id == CampaignLeadSummary.lead_id) \
                            .filter(
                                CampaignLeadSummary.campaign_id==campaign_id,
                                Leads.company_id == user.company_id)

        uncontacted_count = campaign_query.filter(CampaignLeadSummary.status == "UNCONTACTED").one()[0]
        reached_count = campaign_query.filter(CampaignLeadSummary.last_message_received_date != None).one()[0]
        delivered_count = campaign_query.filter(CampaignLeadSummary.status == "DELIVERED").one()[0]
        received_count = campaign_query.filter(CampaignLeadSummary.status == "RESPONDED").one()[0]
        optout_count = campaign_query.filter(CampaignLeadSummary.status == "OPT_OUT").one()[0]
        engaged_count = campaign_query.filter(CampaignLeadSummary.status == "ENGAGED").one()[0]

        appointment_count = db.session.query(func.count(AppointmentHistory.id)) \
            .filter(AppointmentHistory.appointment_status == 'SCHEDULED').one()[0]

        avg_attempts_before_response = get_campaign_lead_attempt_avg(campaign_id, user)
        avg_response_rate = 0
        opt_out_rate = 0
        if sent_count and reached_count and sent_count > 0 :
                avg_response_rate = round(reached_count * 100 / sent_count, 2)
        if sent_count and optout_count and sent_count > 0 :
                opt_out_rate= round(optout_count * 100 / sent_count, 2)
        
        return schema.CampaignLeadMessageCount(
                campaign_id=campaign_id,
                total_sent=sent_count,
                total_delivered=delivered_count,
                total_responded=received_count,
                total_uncontacted=uncontacted_count,
                response_rate= avg_response_rate,
                opt_out_rate= opt_out_rate,
                total_engaged=engaged_count,
                avg_attempts_before_response=avg_attempts_before_response,
                appointment_count=appointment_count
            )

def get_campaign_lead_attempt_avg(campaign_id, user):
        attemptSum = db.session.query(func.sum(CampaignLeadSummary.num_attempts_before_response)) \
                            .join(Leads, Leads.id == CampaignLeadSummary.lead_id) \
                            .filter(
                                CampaignLeadSummary.campaign_id==campaign_id, 
                                Leads.company_id == user.company_id,
                                CampaignLeadSummary.last_message_received_date != None, 
                                CampaignLeadSummary.num_attempts_before_response > 0).one()[0]

        attemptCount = db.session.query(func.count(CampaignLeadSummary.num_attempts_before_response)) \
                            .join(Leads, Leads.id == CampaignLeadSummary.lead_id) \
                            .filter(
                                CampaignLeadSummary.campaign_id==campaign_id, 
                                Leads.company_id == user.company_id,
                                CampaignLeadSummary.last_message_received_date != None, 
                                CampaignLeadSummary.num_attempts_before_response > 0).one()[0]
        
        attemptAvg = 0
        if attemptSum and attemptCount:
            attemptAvg = round(attemptSum / attemptCount, 2)
        return attemptAvg

class EngagementDashboardRepository:
    def get_campaign_lead_summary(range, user):
        
        data=[]
        since = func.date(datetime.now() - timedelta(days=range-1))

        leads = db.session.query(func.count(CampaignLeadSummary.id), func.date(CampaignLeadSummary.date_created)) \
                    .join(Leads, Leads.id == CampaignLeadSummary.lead_id) \
                    .group_by(func.date(CampaignLeadSummary.date_created)) \
                    .filter(
                        CampaignLeadSummary.status == "UNCONTACTED",
                        Leads.company_id == user.company_id,
                        func.date(CampaignLeadSummary.date_created) >= since)
        for item in leads:
            data.append(schema.EngagementAnalysis(item[0], "UNCONTACTED", item[1], attempts=0))
        
        leads = db.session.query(func.count(Message.id), func.date(Message.date_sent)) \
                    .join(Leads, Leads.id == Message.lead_id) \
                    .group_by(func.date(Message.date_sent)) \
                    .filter(Message.date_sent != None, Leads.company_id == user.company_id, func.date(Message.date_sent) >= since)

        for item in leads:
            data.append(schema.EngagementAnalysis(item[0], "SENT", item[1], attempts=0))
        
        leads = db.session.query(func.count(CampaignLeadSummary.id), func.date(CampaignLeadSummary.date_created)) \
                    .join(Leads, Leads.id == CampaignLeadSummary.lead_id) \
                    .group_by(func.date(CampaignLeadSummary.date_created)) \
                    .filter(
                        CampaignLeadSummary.last_message_received_date != None, 
                        Leads.company_id == user.company_id,
                        func.date(CampaignLeadSummary.date_created) >= since)
        for item in leads:
            data.append(schema.EngagementAnalysis(item[0], "DELIVERED", item[1], attempts=0))
        
        leads = db.session.query(func.count(CampaignLeadSummary.id), func.date(CampaignLeadSummary.date_created)) \
                    .join(Leads, Leads.id == CampaignLeadSummary.lead_id) \
                    .group_by(func.date(CampaignLeadSummary.date_created)) \
                    .filter(
                        CampaignLeadSummary.status == "RESPONDED", 
                        Leads.company_id == user.company_id,
                        func.date(CampaignLeadSummary.date_created) >= since)
        for item in leads:
            data.append(schema.EngagementAnalysis(item[0], "RESPONDED", item[1], attempts=0))
        
        leads = db.session.query(func.count(CampaignLeadSummary.id), func.date(CampaignLeadSummary.date_created)) \
                    .join(Leads, Leads.id == CampaignLeadSummary.lead_id) \
                    .group_by(func.date(CampaignLeadSummary.date_created)) \
                    .filter(
                        CampaignLeadSummary.status == "ENGAGED", 
                        Leads.company_id == user.company_id,
                        func.date(CampaignLeadSummary.date_created) >= since)
        for item in leads:
            data.append(schema.EngagementAnalysis(item[0], "ENGAGED", item[1], attempts=0))
        
        leads = db.session.query(func.count(CampaignLeadSummary.id),CampaignLeadSummary.num_attempts_before_response, func.date(CampaignLeadSummary.date_created)) \
                    .join(Leads, Leads.id == CampaignLeadSummary.lead_id) \
                    .group_by(CampaignLeadSummary.num_attempts_before_response, func.date(CampaignLeadSummary.date_created)) \
                    .filter(
                        CampaignLeadSummary.last_message_received_date != None, 
                        CampaignLeadSummary.num_attempts_before_response > 0,
                        Leads.company_id == user.company_id,
                        func.date(CampaignLeadSummary.date_created) >= since)

        for item in leads:
            data.append(schema.EngagementAnalysis(item[0], None, item[2], attempts=item[1]))
        
        
        appointments = db.session.query(func.count(AppointmentHistory.id), func.date(AppointmentHistory.date_created))\
                    .join(Leads, Leads.id == AppointmentHistory.lead_id) \
                    .group_by(func.date(AppointmentHistory.date_created)) \
                    .filter(
                        AppointmentHistory.appointment_status == 'SCHEDULED',
                        Leads.company_id == user.company_id,
                        func.date(AppointmentHistory.date_created) >= since)
        for item in appointments:
            data.append(schema.EngagementAnalysis(item[0], "APPOINTMENT", item[1], attempts=0))

        
        return data

    def get_engagement_lead_summary(range, user):
        data=[]
        since = func.date(datetime.now() - timedelta(days=range-1))
        leads = db.session.query(func.count(CampaignLeadSummary.id), LeadSource.name, CampaignLeadSummary.status, func.date(CampaignLeadSummary.date_created)) \
                    .join(Leads, CampaignLeadSummary.lead_id == Leads.id) \
                    .join(LeadSource, Leads.lead_source_original_id == LeadSource.id) \
                    .group_by(LeadSource.name, CampaignLeadSummary.status, func.date(CampaignLeadSummary.date_created)) \
                    .filter(func.date(CampaignLeadSummary.date_created) >= since,
                            Leads.company_id == user.company_id)

        for item in leads:
            data.append(schema.EngagementLeadAnalysis(item[0],item[1],item[2].value,item[3]))
        return data
    
    def get_lead_analytics(range, user):
        data=[]
        since = func.date(datetime.now() - timedelta(days=range-1))
        leads = db.session.query(func.count(Leads.id),LeadSource.name) \
                    .join(LeadSource, Leads.lead_source_original_id == LeadSource.id) \
                    .group_by(LeadSource.name) \
                    .filter(
                        func.date(Leads.lead_created_date) >= since, 
                        Leads.company_id == user.company_id,
                        Leads.is_deleted == False)
        for item in leads:
            data.append(schema.LeadAnalytics(item[0],item[1]))

        # leads = db.session.query(func.count(Leads.id)) \
        #             .filter(func.date(Leads.lead_created_date) >= since, Leads.lead_source_original_id == None, Leads.is_deleted == False)
        # for item in leads:
        #     data.append(schema.LeadAnalytics(item[0],"Unknown"))
        return data

    def get_appointment_by_source(range, user):
        data = []
        since = func.date(datetime.now() - timedelta(days=range-1))
        appointment = db.session.query(func.count(AppointmentHistory.id), LeadSource.name) \
                            .join(Leads, Leads.id == AppointmentHistory.lead_id) \
                            .join(LeadSource, Leads.lead_source_original_id == LeadSource.id) \
                            .group_by(LeadSource.name) \
                            .filter(func.date(AppointmentHistory.date_created) >= since, 
                                    Leads.company_id == user.company_id,
                                    cast(AppointmentHistory.appointment_status, SqlString) == "SCHEDULED")
        for item in appointment:
            data.append(schema.AppointmentSourceAnalytics(item[0], item[1]))

        # appointment = db.session.query(func.count(AppointmentHistory.id)) \
        #                     .join(Leads, Leads.id == AppointmentHistory.lead_id) \
        #                     .filter(func.date(AppointmentHistory.date_created) >= since, Leads.lead_source_original_id == None, cast(AppointmentHistory.appointment_status, SqlString) == "SCHEDULED")
        # for item in appointment:
        #     if item[0] != 0:
        #         data.append(schema.AppointmentSourceAnalytics(item[0], "No Source"))

        return data

    def get_appointment_by_salesperson(range, user):
        data = []
        since = func.date(datetime.now() - timedelta(days=range-1))
        appointment = db.session.query(func.count(AppointmentHistory.id), User.first_name, User.last_name) \
                            .join(User, User.id == AppointmentHistory.user_id) \
                            .group_by(User.first_name, User.last_name) \
                            .filter(func.date(AppointmentHistory.date_created) >= since, 
                                    User.company_id == user.company_id,
                                    cast(AppointmentHistory.appointment_status, SqlString) == "SCHEDULED")

        total = 0
        for item in appointment:
            total += item[0]
            data.append(schema.AppointmentSalesAnalytics(item[0], item[1] + item[2]))

        if total > 0:
            data.append(schema.AppointmentSalesAnalytics(total, "ALL TEAM"))

        return data
        
    def get_growth_rate(current, prev):
        # Find the growth rate using current and previous count
        return "%.2f" % ((current - prev) / (prev if prev else 1) * 100)

    def get_appointment_count_by_status(appointments, prev_appointments, status = None):
        # Filter the appointment by status then return the count of records
        if status:
            appointments = appointments.filter(cast(AppointmentHistory.appointment_status, SqlString) == status)
            prev_appointments = prev_appointments.filter(cast(AppointmentHistory.appointment_status, SqlString) == status)

        return (appointments[0][0], prev_appointments[0][0])

    '''
        Get Appointment Statistics Analysis for the Engagement Dashboard
    '''
    def get_appointment_analysis(range, user):
        data=[]
        since = func.date(datetime.now() - timedelta(days=range-1))
        prev_since = func.date(datetime.now() - timedelta(days=(range*2)-1))

        # Get all appointment between range days
        appointments = db.session.query(func.count(AppointmentHistory.id)) \
                        .join(User, User.id == AppointmentHistory.user_id) \
                        .filter(
                            func.date(AppointmentHistory.date_created) >= since, 
                            User.company_id == user.company_id,
                            cast(AppointmentHistory.appointment_status, SqlString) == "SCHEDULED")

        # Get all appointment between previously range days (since to prev_since) 
        # e.g. If last month of in range than get previous month date 
        prev_appointments = db.session.query(func.count(AppointmentHistory.id)) \
                        .filter(func.date(AppointmentHistory.date_created) >= prev_since, func.date(AppointmentHistory.date_created) < since, cast(AppointmentHistory.appointment_status, SqlString) == "SCHEDULED")
        
        # Get appointment count (All) and growth rate of current and previous range then put into data
        (count, prev_count) = EngagementDashboardRepository.get_appointment_count_by_status(appointments, prev_appointments)
        data.append(schema.AppointmentAnalysis('TOTAL SCHEDULED APPOINTMENTS', count, prev_count, EngagementDashboardRepository.get_growth_rate(count, prev_count)))
        
        # Get appointment count (status = CONFIRMED) and growth rate of current and previous range then put into data
        (confirmed_count, confirmed_prev_count) = EngagementDashboardRepository.get_appointment_count_by_status(appointments, prev_appointments, 'CONFIRMED')
        data.append(schema.AppointmentAnalysis('CONFIRMED APPOINTMENTS', confirmed_count, confirmed_prev_count, EngagementDashboardRepository.get_growth_rate(confirmed_count, confirmed_prev_count)))
        
        # Get appointment count (status = NO-SHOWED) and growth rate of current and previous range then put into data
        (no_showed_count, no_showed_prev_count) = EngagementDashboardRepository.get_appointment_count_by_status(appointments, prev_appointments, 'NO-SHOWED')
        data.append(schema.AppointmentAnalysis('NO-SHOWED APPOINTMENTS', no_showed_count, no_showed_prev_count, EngagementDashboardRepository.get_growth_rate(no_showed_count, no_showed_prev_count)))

        # Get appointment count (status = SHOWED) and growth rate of current and previous range then put into data
        (showed_count, showed_prev_count) = EngagementDashboardRepository.get_appointment_count_by_status(appointments, prev_appointments, 'SHOWED')
        data.append(schema.AppointmentAnalysis('SHOWED APPOINTMENTS', showed_count, showed_prev_count, EngagementDashboardRepository.get_growth_rate(showed_count, showed_prev_count)))

        # Get appointment count (status = SOLD) and growth rate of current and previous range then put into data
        (sold_count, sold_prev_count) = EngagementDashboardRepository.get_appointment_count_by_status(appointments, prev_appointments, 'SOLD')
        data.append(schema.AppointmentAnalysis('APPOINTMENTS SOLD', sold_count, sold_prev_count, EngagementDashboardRepository.get_growth_rate(sold_count, sold_prev_count)))
        
        return data

    
