from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q, A
import os
from datetime import datetime
from api.models import FilterGroupType, User, AingineDataReceived, AingineDataStatus, FilterType, CompanyFilter, SelectionOption
from api import db, schema, repository
import json
import requests
import config
import random
from api.utils.constants import LIFE_EVENTS, ANALYTICS, PROSPECTS, GENERAL
from api.utils import are_dicts_arrays_empty

host = os.getenv('CLOUDSEARCH_HOST')


class Predictions:
    makes = []
    make_model_tags = []
    tags = []
    predictions = []
    prediction_obj = {}
    prediction_mappings = {
        'buy_car': 'Buy Car', 
        'sell_car': 'Sell Car', 
        'new': 'New',
        "used": 'Used', 
        'buy_car_parts': "Parts",
        'get_car_serviced': 'Service',
        'company': "Company",
        'competitor:': "Competitor",
        'job': "Job",
        'relocation': "Relocation",
        'birthday': "Birthday",
        'new car': "New Car",
        'new house': "New House",
        'graduation':"Graduation",
        'marriage':"Marriage",
        'newborn':"New Born",
        'anniversary': "Anniversary",
        'upcoming birthday': "Upcoming Birthday",
        'job change': "Job Change",
        'education change': "Education Change"
    }
    prediction_routes = ['industry=auto,auto_intent', 'industry=auto,auto_intent=buy_car,condition', 'car_make', 'life_events']

    def __init__(self, hit):
        self.makes = []
        self.make_model_tags = []
        self.tags = []
        self.predictions = []
        self.prediction_obj = {}
        if hasattr(hit, 'predictions'):
            self.prediction_obj = hit.predictions
            self.map_predictions()
            self.map_model_tags()
            self.map_prediction_tags()

    def map_predictions(self):
        for route in self.prediction_routes:
            if hasattr(self.prediction_obj, route):
                for intent in self.prediction_obj[route].classes:
                    if 'car_make' in route:
                        make = intent.replace('_', ' ')
                        self.makes.append(make)
                    else:
                        self.predictions.append(intent)

    def map_prediction_tags(self):
        for prediction in self.predictions:
            if self.prediction_mappings.get(prediction):
                self.tags.append(self.prediction_mappings[prediction])
            else:
                print(f'No display mapping for prediction: {prediction}')
        self.tags.extend(self.make_model_tags)

    def map_model_tags(self):
        for make in self.makes:
            model_intent = f'car_make={make},{make}_models'
            self.make_model_tags.append(make)
            if hasattr(self.prediction_obj, model_intent):
                for intent in self.prediction_obj[model_intent].classes:
                    model = intent.replace('_', ' ')
                    self.make_model_tags.append(model)


def get_es_client():
    return Elasticsearch(
        hosts=[{'host': host, 'port': 443}],
        use_ssl=True
    )


def build_query(search: Search, filters, options, agg_query=None, make=None, must_queries=None, exclude_queries=None, should_queries=None):
    if not should_queries:
        should_queries = []

    if not exclude_queries:
        exclude_queries = []

    # Using default arguments which are lists gets updated on every call to the function
    # So we define it here
    if not must_queries:
        must_queries = []

    get_life_events = True
    if 'leads' in options:
        get_life_events = not options['leads']

    # print(filters)

    for and_filter in filters['and_filters']:
        if and_filter['query_field'] != 'author.location' and and_filter['query_field'] != 'body' and and_filter['query_field'] != 'predictions.life_events.classes':

            if and_filter['query_field'] == "predictions.car_make.classes":
                or_options = [
                    Q({'match': {and_filter['query_field']: and_filter['value']}}),
                    Q('bool', must_not=[Q({'exists': {'field': 'predictions.car_make.classes'}})])
                ]
                or_q = Q('bool', should=or_options, minimum_should_match=1)
                must_queries.append(or_q)
            else:
                q = Q({'match': {and_filter['query_field']: and_filter['value']}})
                must_queries.append(q)

        elif and_filter['query_field'] == 'body':
            body_queries = []
            for val in and_filter['value']:
                print(and_filter)
                body_queries.append(Q({'match_phrase': {f"{and_filter['query_field']}": val}}))
            q = Q('bool', must=body_queries)
            must_queries.append(q)
        elif and_filter['query_field'] == 'predictions.life_events.classes' and get_life_events:
            q = Q({'match_phrase': {and_filter['query_field']: and_filter['value']}})
            must_queries.append(q)
        elif and_filter['query_field'] == 'author.location':
            q_queries = []
            for val in and_filter['value']:
                if val != 'Unknown Location':
                    q_queries.append(Q({'match_phrase': {'author.location': val}}))
                else:
                    q_queries.append(Q('bool', must_not=[Q({'exists': {'field': 'author.location'}})]))
            q = Q('bool', must=q_queries)
            must_queries.append(q)
        else:
            q = Q({'match_phrase': {and_filter['query_field']: and_filter['value']}})
            must_queries.append(q)
    for or_filter in filters['or_filters']:
        if or_filter['query_field'] == 'body':
            body_queries = []
            for val in or_filter['value']:
                body_queries.append(Q({'match_phrase': {f"{or_filter['query_field']}": val}}))
            or_q = Q('bool', should=body_queries, minimum_should_match=1)
            must_queries.append(or_q)
        elif or_filter['query_field'] == 'author.location':
            q_queries = []
            for val in or_filter['value']:
                if val != 'Unknown Location':
                    q_queries.append(Q({'match_phrase': {'author.location': val}}))
                else:
                    q_queries.append(Q('bool', must_not=[Q({'exists': {'field': 'author.location'}})]))
            or_q = Q('bool', should=q_queries, minimum_should_match=1)
            must_queries.append(or_q)
        else:
            q = Q({'match': {or_filter['query_field']: or_filter['value']}})
            should_queries.append(q)
    for and_or_filter in filters['and_or_filters']:
        if and_or_filter['query_field'] != 'predictions.life_events.classes' or (and_or_filter['query_field'] == 'predictions.life_events.classes' and get_life_events):
            if and_or_filter['query_field'] == "predictions.car_make.classes":
                or_options = [
                    Q('bool', must_not=[Q({'exists': {'field': 'predictions.car_make.classes'}})])
                ]
            else:
                or_options = []
            for val in and_or_filter['value']:
                q = Q({'match_phrase': {and_or_filter['query_field']: val}})
                or_options.append(q)
            or_q = Q('bool', should=or_options, minimum_should_match=1)
            must_queries.append(or_q)
    for or_or_filter in filters['or_or_filters']:
        or_options = []
        for val in or_or_filter['value']:
            q = Q({'match': {or_or_filter['query_field']: val}})
            or_options.append(q)
        or_q = Q('bool', should=or_options, minimum_should_match=1)
        should_queries.append(or_q)
    for excluded_filter in filters['exclude_filters']:
        q = Q({'match': {excluded_filter['query_field']: excluded_filter['value']}})
        exclude_queries.append(q)

    since_days = 1

    if 'range_filters' in filters and len(filters['range_filters']) > 0:
        # TODO: Just one range filter is supported for the moment. See if it's possible to handle more range filters at the same time.
        since_days = int(filters['range_filters'][0]["value"]) + 1

    timestamp = {
        "time_zone": "-08:00",
        "lt": "now",
        "gt": None if since_days == 1 else f'now-{since_days}d/d'
    }

    if 'newer' in options and options['newer']:
        timestamp['gt'] = options['newer']
    elif 'older' in options:
        timestamp['lt'] = options['older']
    elif 'start_date' in options and 'end_date' in options:
        timestamp['gt'] = options['start_date']
        timestamp['lt'] = options['end_date']

    must_queries.append(Q('range', timestamp=timestamp))

    if 'source_id' in options:
        must_queries.append(Q({'match': {'author.persons.sources_detail.source.id': options['source_id']}}))

    only_thread_starters = Q({'exists': {'field': 'post_parent_id'}})
    not_edmunds = Q({'match': {'thread.source.name': 'Edmunds'}})
    exclude_queries.append(Q('bool', must=[only_thread_starters], must_not=[not_edmunds]))

    # TODO: Add this as a private party toggle on the FE
    kw_dealership = Q({'match': {'body': 'dealership'}})
    kw_down_payment = Q({'match': {'body': 'down payment'}})
    kw_credit = Q({'match': {'body': 'credit'}})

    cl_source = Q({'match': {'thread.source.source_type': 'CRAIGSLIST'}})
    sn_parts = Q({'match': {'thread.source.name': 'parts'}})
    sn_wheels = Q({'match': {'thread.source.name': 'wheels'}})
    sn_tires = Q({'match': {'thread.source.name': 'tires'}})
    non_car_sources = Q('bool', should=[sn_parts, sn_wheels, sn_tires, kw_down_payment, kw_credit], minimum_should_match=1)
    cl_non_cars = Q('bool', must=[cl_source, non_car_sources])
    exclude_queries.append(cl_non_cars)

    fbm_source = Q({'match': {'thread.source.source_type': 'FB_MARKETPLACE'}})
    dealer_keywords = Q('bool', should=[kw_dealership, kw_down_payment, kw_credit], minimum_should_match=1)
    fbm_dealer_keywords = Q('bool', must=[fbm_source, dealer_keywords])
    exclude_queries.append(fbm_dealer_keywords)
    # TODO: Add this as a private party toggle on the FE - end

    # Exclude these sources as they do not show quality leads for auto
    # TODO: drive this logic with configuration and without hard-coding the source IDs
    exclude_source_ids = [1750, 1751, 1752, 1753, 1754, 1755, 1756, 1757, 1758, 1759, 1760, 1761, 1762, 1763, 1765, 1766, 1767, 1768, 1771, 1772, 1773, 1774]
    for esi in exclude_source_ids:
        q = Q({'match': {'thread.source.id': esi}})
        exclude_queries.append(q)

    if len(should_queries) > 0:
        search = search.query('bool', must=must_queries, should=should_queries, must_not=exclude_queries, minimum_should_match=1)
    else:
        search = search.query('bool', must=must_queries, must_not=exclude_queries)

    if agg_query == 'posts_over_time':
        search.aggs.bucket('posts_over_time', 'date_histogram', field='timestamp', interval='day', format='yyyy-MM-dd')
    elif agg_query == 'posts_by_make':
        included_classes = list(filter(lambda x: x['query_field'] == 'predictions.car_make.classes', filters['and_or_filters']))
        if len(included_classes) == 0:
            included_classes = list(filter(lambda x: x['query_field'] == 'predictions.car_make.classes', filters['and_filters']))

        if len(included_classes) > 0:
            include = included_classes[0]['value']
            search.aggs.bucket('posts_by_make', 'terms', field='predictions.car_make.classes.keyword', size=1000, include=include)
        else:
            search.aggs.bucket('posts_by_make', 'terms', field='predictions.car_make.classes.keyword', size=1000)
    
    # elif agg_query == 'group_by_model':
    #     search.aggs.bucket('group_by_model', 'terms', field=f'predictions.car_make={make},{make}_models.classes.keyword', size=1000)

    return search.sort('-timestamp')

# Only allowed car makes should appear in the results, so if there are not car make filters selected this method adds all the possible/allowed values.
# TODO: Find a generic solution to this for all company_filters with a limited list of values, not only for car makes.
def include_all_car_makes(user, filters):
    # print("in include_all_car_makes")
    filter_type = db.session.query(FilterType).filter(FilterType.name == 'Make').first()

    if(filter_type.filter_field not in str(filters)):

        filters['and_or_filters'].append(
            {
                'query_field': filter_type.filter_field,
                'value': list(map(lambda x: x.selection_option.query ,filter(lambda x: x.selection_option.filter_type.name == "Make" ,user.company.filters)))
            }
        )

def execute_analytics_search(user: User, args, chart_type):
    filters = repository.UserRepository.get_filters_for_es(user, set_type=GENERAL)
    include_all_car_makes(user, filters)
    es_client = get_es_client()
    agg_query = 'posts_over_time'
    if chart_type == 'treemap':
        agg_query = 'posts_by_make'
    search = build_query(Search(using=es_client, index='posts'), filters, args, agg_query)  
    results = search.execute()
    if chart_type == 'barchart':
        post_list = []
        for bucket in results.aggregations.posts_over_time.buckets:
            post_list.append(map_bucket_to_post(bucket))
        return post_list
    elif chart_type == 'treemap':
        post_list = []
        search2 = build_query(Search(using=es_client, index='posts'), filters, args)
        for make_bucket in results.aggregations.posts_by_make.buckets:
            search2.aggs.bucket(f'group_by_{make_bucket.key}', 'terms', field=f'predictions.car_make={make_bucket.key},{make_bucket.key}_models.classes.keyword', size=1000)
        results2 = search2.execute()
        for make_bucket in results.aggregations.posts_by_make.buckets:
            total_count = 0
            models = []
            for model_bucket in results2.aggregations[f'group_by_{make_bucket.key}'].buckets:
                if model_bucket.doc_count != 0:
                    total_count = total_count + model_bucket.doc_count
                    models.append(map_bucket_to_model(model_bucket))
            if total_count < make_bucket.doc_count:
                models.append(schema.ModelResponse(
                    count= make_bucket.doc_count - total_count,
                    name="Unspecified Model"
                ))

            if len(models) != 0:
                post_list.append(map_bucket_to_make(make_bucket.key, models, make_bucket.doc_count))

        return post_list

def map_bucket_to_model(bucket):
    return schema.ModelResponse(
        count=bucket.doc_count, 
        name=bucket.key.replace('_', ' ')
    )

def map_bucket_to_make(make, models, count):
    return schema.MakeModelResponse(
        total=count, 
        name=make, 
        children=models
    )

def map_bucket_to_post(bucket):
    return schema.Post(
        timestamp=datetime.fromisoformat(bucket.key_as_string),
        count=bucket.doc_count
    )

# For exports there are some conditions
# If the source is different from facebook, twitter or reddit
# - the author should have the location set
# - the author should be related to a person
# - the person should have full name set (first & last name)
# If the source is facebook, twitter or reddit
# None of the above are taked into account
def create_export_search_filter():
    should_queries = []
    not_sources = []
    not_sources.append(Q({'match': {'thread.source.source_type': 'TWITTER'}}))
    not_sources.append(Q({'match': {'thread.source.source_type': 'FACEBOOK'}}))
    not_sources.append(Q({'match': {'thread.source.source_type': 'REDDIT'}}))
    exists = []
    exists.append(Q({'exists': {'field': 'author.location'}}))
    exists.append(Q({'exists': {'field': 'author.persons.full_name'}}))
    not_match = Q('bool', must=exists, must_not=not_sources)
    should_queries.append(Q({'match': {'thread.source.source_type': 'TWITTER'}}))
    should_queries.append(Q({'match': {'thread.source.source_type': 'FACEBOOK'}}))
    should_queries.append(Q({'match': {'thread.source.source_type': 'REDDIT'}}))
    should_queries.append(not_match)
    export_queries = [Q('bool', should=should_queries)]
    return export_queries

def execute_export_search_count_deprecated(user, args, configFilters):
    filters = repository.UserRepository.get_filters_for_es(user, configFilters=configFilters)
    es_client = get_es_client()
    export_queries = create_export_search_filter()
    search = build_query(Search(using=es_client, index='posts'), filters, options=args, must_queries=export_queries)
    # print(search.to_dict())
    total_hits = search.count()
    return total_hits

def execute_export_search_deprecated(user: User, args, configFilters=None):
    filters = repository.UserRepository.get_filters_for_es(user, configFilters=configFilters)
    es_client = get_es_client()
    export_queries = create_export_search_filter()
    search = build_query(Search(using=es_client, index='posts'), filters, options=args, must_queries=export_queries)
    # print(search.to_dict())

    post_list = []

    for hit in search.scan():
        status = filter_unanswered_posts(hit, user)
        if status:
            post_list.append(map_hit_to_post(hit, status))

    return post_list

def execute_export_search(user: User, args, configFilters=None):
    filters = repository.UserRepository.get_filters_for_es(user, configFilters=configFilters)
    es_client = get_es_client()
    export_queries = create_export_search_filter()
    export_agg = {
        "aggs": {
            "my_buckets": {
            "composite": {
                "size": 100,
                "sources": [
                {
                    "users": {
                        "terms": {
                            "script": "doc['author.username.keyword'] + '|' + doc['author.location.keyword'] + '|'  + doc['thread.source.name.keyword']"                    }
                        }
                    }
                ]
                },
                "aggs": {
                    "forums": {
                        "terms": {
                            "field": "thread.subforums.name.keyword"
                        }
                    }
                }
            }
        }
    }
    search = build_query(Search(using=es_client, index='posts'), filters, options=args, must_queries=export_queries)
    search = search.update_from_dict(export_agg)
    # print(search.to_dict())
    results = search.execute()
    
    users_list = []

    while True:
        buckets = results.aggregations.my_buckets.buckets
        for bucket in buckets:
            splitted = bucket.key.users.split('|')
            user = {
                "username": splitted[0].replace('[', '').replace(']', ''),
                "location": splitted[1].replace('[', '').replace(']', ''),
                "source": splitted[2].replace('[', '').replace(']', ''),
                "subforums": (', ').join([ x.key for x in bucket.forums.buckets]) if hasattr(bucket, 'forums') else ''
            }
            users_list.append(user)

        if (hasattr(results.aggregations.my_buckets, 'after_key') == False):
            break

        export_agg = {
            "aggs": {
                "my_buckets": {
                    "composite": {
                        "size": 100,
                        "sources": [
                        {
                            "users": {
                                "terms": {
                                    "script": "doc['author.username.keyword'] + '|' + doc['author.location.keyword'] + '|'  + doc['thread.source.name.keyword']"
                                    }
                                }
                            }
                        ],
                        "after": { "users":  results.aggregations.my_buckets.after_key.users }
                    },
                    "aggs": {
                        "forums": {
                            "terms": {
                                "field": "thread.subforums.name.keyword"
                            }
                        }
                    }
                }
            }
        }
        export_queries = create_export_search_filter()
        search2 = build_query(Search(using=es_client, index='posts'), filters, options=args, must_queries=export_queries)
        search = search2.update_from_dict(export_agg)
        # print(search.to_dict())
        results = search.execute()

    return users_list


def execute_search(user: User, args, filters=None):
    # print("in execute_search")
    include_viewed = not('hide_viewed' in args and args['hide_viewed'] == True)
    if not filters:
        filters = repository.UserRepository.get_filters_for_es(user, set_type=GENERAL)

    include_all_car_makes(user, filters)
    
    es_client = get_es_client()

    exclude_queries = []

    if "LABELER" not in user.roles:
        q = Q({'match': {"predictions.review": False}})
        exclude_queries.append(q)

    search = build_query(Search(using=es_client, index='posts'), filters, args, exclude_queries=exclude_queries)
    # print(json.dumps(search.to_dict(), indent=3, sort_keys=True))
    print(search.to_dict())
    post_list = []
    posts_required = 12
    idx = 0
    results = search.execute()
    total_hits = results.hits.total.value

    # Execute and paginate request until minimum required number of posts that are un-acted upon are received
    while len(post_list) < posts_required and idx < total_hits and 'newer' not in args:
        if idx > 0:
            search = search[idx:idx + posts_required]
            results = search.execute()

        for hit in results:
            status = filter_unanswered_posts(hit, user, include_viewed=include_viewed)
            if len(post_list) < posts_required and status:
                post_list.append(map_hit_to_post(hit, status))
        idx += len(results)
        post_list = filter_needs_review_posts(post_list)

    if 'newer' in args:
        results = search.execute()
        for hit in results:
            status = filter_unanswered_posts(hit, user, include_viewed=include_viewed)
            if status:
                post_list.append(map_hit_to_post(hit, status))
        post_list = filter_needs_review_posts(post_list)
    return {'post_list': post_list, 'total_hits': total_hits}


def execute_notifications_count(user, args, filterSetFilters, set_type):
    es_client = get_es_client()
    filters = repository.UserRepository.get_filters_for_es(user, configFilters=filterSetFilters, set_type=set_type, skip_user_defaults=True)
    if set_type == "LIFE_EVENTS":
        must_queries = []
        if user.company.aingine_source_id:
            args['source_id'] = user.company.aingine_source_id

        must_queries = [Q({'exists': {'field': 'predictions.life_events'}})]
        search = build_query(Search(using=es_client, index='posts'), filters, options=args, must_queries=must_queries)
    else:
        search = build_query(Search(using=es_client, index='posts'), filters, options=args)
    
    # print(json.dumps(search.to_dict()))
    # print(search.to_dict())
    
    total_hits = search.count()
    return total_hits

def map_hit_to_post(hit, status):
    prediction = Predictions(hit)
    return schema.Post(
        id=hit.id,
        body=hit.body,
        url=hit.thread.url,
        author=hit.author.username if hit.author else 'Craigslist User' if hit.thread.source.source_type == 'CRAIGSLIST' else 'Unknown',
        author_id=hit.author.id if hit.author else 999999,
        author_profile_url=hit.author.profile_url if hit.author else None,
        location=hit.author.location if hit.author else hit.thread.subforums[0].name if hit.thread.source.source_type == 'CRAIGSLIST' else None,
        timestamp=datetime.fromisoformat(hit.timestamp),
        source=hit.thread.source.name,
        source_type=hit.thread.source.source_type,
        source_id=hit.thread.source.id,
        source_url=hit.thread.source.url,
        thread_id=hit.thread.id,
        thread_title=hit.thread.title if hit.thread.title else None,
        # subforums=(',').join([ x.name for x in hit.thread.subforums]) if hasattr(hit.thread, 'subforums') else None,
        status=status.value,
        tags=prediction.tags,
        makes=prediction.makes,
        models=prediction.make_model_tags,
        review=prediction.prediction_obj.review if hasattr(prediction.prediction_obj, 'review') else None,
        person_full_name=hit.author.persons[0].full_name if hasattr(hit.author, 'persons') and len(hit.author.persons) > 0 else None
    )


def filter_unanswered_posts(post, user: User, include_viewed=True):
    if not post.body:
        return False
    aingine_data = db.session().query(AingineDataReceived).filter(AingineDataReceived.company_id == user.company_id, AingineDataReceived.aingine_data_id == post.id).first()
    if not aingine_data:
        aingine_data = AingineDataReceived(
            user_id=user.id,
            company_id=user.company_id,
            aingine_data_id=post.id,
            status=AingineDataStatus.VIEWED
        )
        db.session.add(aingine_data)
        db.session.commit()
        db.session.refresh(aingine_data)
        return aingine_data.status
    elif aingine_data.status == AingineDataStatus.VIEWED and include_viewed:
        return aingine_data.status
    else:
        return False


def filter_needs_review_posts(posts):
    if len(posts) == 0:
        return posts
    
    post_ids = list(map(lambda post: post.id, posts))
    gql_query = f"""query {{
        filterNeedsReviewPosts 
        (
            filters: {{
                and: [
                    {{ needsReview: true }},
                    {{ idIn: {post_ids} }}
                ]
            }}
        ) {{
            edges {{
                node {{
                    id
                }}
            }}
        }}
    }}"""
    # print(gql_query)
    request = requests.post(config.AINGINE_GRAPHQL_API_URL, params={'query': gql_query})
    if request.status_code != 200:
        raise Exception(f"Query 'filter_needs_review_posts' failed to run by returning code of {request.status_code}. {gql_query}")
    result = request.json()
    # print(result)
    result_edges = result['data']['filterNeedsReviewPosts']['edges']
    # these are the ones that need to be reviewed
    needs_review_post_ids = list(map(lambda edge: edge['node']['id'], result_edges))
    # these are the ones that do not need to be reviewed
    filtered_posts = list(filter(lambda post: post.id not in needs_review_post_ids, posts))
    # print(filtered_posts)
    return filtered_posts


def get_post(aingine_id, set_type="PROSPECTS"):
    es_client = get_es_client()
    search = Search(using=es_client, index='posts').filter('term', id=aingine_id)
    is_life_event = [Q({'exists': {'field': 'predictions.life_events'}})]
    if set_type == "LIFE_EVENTS":
        search = search.query('bool', must=is_life_event)
    else:
        search = search.query('bool', must_not=is_life_event)
    results = search.execute()
    return map_hit_to_post(results[0], AingineDataStatus.SAVED) if len(results) > 0 else None


def get_unique_sources():
    es_client = get_es_client()
    search = Search(using=es_client, index='posts')
    search = search[0:0]
    sources_agg = A('terms', field='thread.source.name.keyword', size=1000)

    search.aggs.bucket('unique_sources', sources_agg)\
        .bucket('source_id', 'terms', field='thread.source.id')\
        .bucket('source_url', 'terms', field='thread.source.url.keyword')

    results = search.execute()

    sources = []
    for unique_source in results.aggs.unique_sources:
        if 'CL:' not in unique_source.key:
            aingine_source = {
                'source': unique_source.key,
                'source_id': unique_source.source_id[0].key,
                'source_url': unique_source.source_id[0].source_url[0].key
            }
            sources.append(aingine_source)
    return sources


def execute_company_available_count(filters, range):
    es_client = get_es_client()
    search = build_query(Search(using=es_client, index='posts'), filters, {'range': range, 'leads': True}, 'posts_over_time')
    # print(json.dumps(search.to_dict()))
    # print(json.dumps(search.to_dict(), indent=3, sort_keys=True))
    results = search.execute()
    available_list = []
    for bucket in results.aggregations.posts_over_time.buckets:
        available_list.append(map_bucket_to_post(bucket))
    return available_list

def search_life_events(user: User, args, include_person=False, global_events=True):
    es_client = get_es_client()
    filters = repository.UserRepository.get_filters_for_es(user, set_type=LIFE_EVENTS, skip_user_defaults=True)
    must_queries = []
    exclude_queries = []

    if not global_events and user.company.aingine_source_id:
        args['source_id'] = user.company.aingine_source_id
    elif global_events and user.company.aingine_source_id:
        # q = Q({'match': {"author.persons.sources_detail.source.id": user.company.aingine_source_id}})
        q = Q({'exists': {"field": "author.persons"}})
        exclude_queries.append(q)

    # if (are_dicts_arrays_empty(filters)):
    must_queries = [Q({'exists': {'field': 'predictions.life_events'}})]
    search = build_query(Search(using=es_client, index='posts'), filters, options=args, must_queries=must_queries, exclude_queries=exclude_queries)

    post_list = []
    posts_required = 10
    idx = 0
    results = search.execute()
    total_hits = results.hits.total.value

    # Execute and paginate request until minimum required number of posts that are un-acted upon are received
    while len(post_list) < posts_required and idx < total_hits:
        if idx > 0:
            search = search[idx:idx + posts_required]
            results = search.execute()

        for hit in results:
            status = filter_unanswered_posts(hit, user)
            if len(post_list) < posts_required and status:
                post_list.append(map_hit_to_post(hit, status))
        idx += len(results)
        post_list = filter_needs_review_posts(post_list)

    # TODO: replace with get_extra_info method
    user_accounts_list = list(map(lambda x: x.author_id, post_list))

    if len(user_accounts_list) > 0 and include_person:

        gql_query = f"""query {{
            allUserAccounts
            (
                ids: {user_accounts_list}
            ) {{
                id
                username
                persons {{
                    id
                    fullName
                }}
            }}
        }}"""

        request = requests.post(config.AINGINE_GRAPHQL_API_URL, params={'query': gql_query})

        if request.status_code != 200:
            raise Exception(f"Query 'all_user_accounts' failed to run by returning code of {request.status_code}. {gql_query}")

        result = request.json()
        def map_post (post):
            user_account_data = next((x for x in result['data']['allUserAccounts'] if int(x["id"]) == post.author_id), None)
            if(user_account_data):
                try:
                    post.person_id = user_account_data["persons"][0]["id"]
                    post.person_full_name = user_account_data["persons"][0]["fullName"]
                except:
                    print("Error mapping post", user_account_data)
            return post

        post_list = list(map(map_post, post_list))

    return {'post_list': post_list, 'total_hits': total_hits}
