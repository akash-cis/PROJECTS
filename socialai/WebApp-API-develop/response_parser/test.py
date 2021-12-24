import datetime
from funnel_messages import parse_message, MessageType
from data_service import *
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q, A
import os


host = os.getenv('CLOUDSEARCH_HOST')


def test():
    print("in test()...")
    original_message = {
        'body': "This is a great question. I'de like to know as well.", 
        'id': 59607231, 
        'author': {
            'location': None,
            'profile_url': 'https://www.reddit.com/user/yusrname/',
            'id': 7808537,
            'username': 'yusrname'
        }, 
        'post_parent_id': 59530577, 
        'timestamp': datetime.datetime(2021, 3, 9, 18, 31, 16, tzinfo=datetime.timezone(datetime.timedelta(0), '+0000')), 
        'thread': {
            'forum_thread_id': 't3_m0losk', 
            'source': {
                'url': 'https://www.reddit.com/',
                'last_received_date': None, 
                'name': 'Reddit', 
                'id': 287, 
                'source_type': 'REDDIT'
            }, 
            'url': 'https://www.reddit.com/r/whatcarshouldIbuy/comments/m0losk/will_there_be_a_legit_phev_competitor_to_the/', 
            'last_received_date': datetime.datetime(2021, 3, 9, 18, 31, 16, tzinfo=datetime.timezone(datetime.timedelta(0), '+0000')), 
            'subforums': [
                {
                    'url': 'https://www.reddit.com/r/whatcarshouldIbuy', 
                    'name': 'whatcarshouldIbuy'
                }
            ], 
            'title': 'Will there be a legit PHEV competitor to the Toyota RAV4 Prime?', 
            'id': 9102446
        }
    }
    # Reply
    message = {
        'body': "Haha thanks. I know I’m not the only one", 
        'id': 59613548, 
        'author': {
            'location': "Austin, Texas, United States",
            'profile_url': 'https://www.reddit.com/user/ianzurzolo/',
            'id': 7797282,
            'username': 'ianzurzolo'
        }, 
        'post_parent_id': 59607231, 
        'timestamp': datetime.datetime(2021, 3, 9, 20, 3, 33, tzinfo=datetime.timezone(datetime.timedelta(0), '+0000')), 
        'thread': {
            'forum_thread_id': 't3_m0losk', 
            'source': {
                'url': 'https://www.reddit.com/',
                'last_received_date': None, 
                'name': 'Reddit', 
                'id': 287, 
                'source_type': 'REDDIT'
            }, 
            'url': 'https://www.reddit.com/r/whatcarshouldIbuy/comments/m0losk/will_there_be_a_legit_phev_competitor_to_the/', 
            'last_received_date': datetime.datetime(2021, 3, 9, 20, 3, 33, tzinfo=datetime.timezone(datetime.timedelta(0), '+0000')), 
            'subforums': [
                {
                    'url': 'https://www.reddit.com/r/whatcarshouldIbuy', 
                    'name': 'whatcarshouldIbuy'
                }
            ], 
            'title': 'Will there be a legit PHEV competitor to the Toyota RAV4 Prime?', 
            'id': 9102446
        }
    }
    is_parsed = parse_for_response(message)


def parse_for_response(message):
    print("in parse_for_response()...")
    has_config, resp_config, response_type = check_for_config(message)
    print("has_config, resp_config, response_type: ")
    print(has_config)
    print(resp_config)
    print(response_type)
    if has_config:
        print(resp_config)
        print(response_type)
        print(message)
        print("saving the message...")
        # return save_response(resp_config, response_type, message)
        return True
    else:
        return True


def test2():
    print("in test2()")
    resp_configs = get_response_configs()
    es_client = get_es_client()
    search = Search(using=es_client, index='posts')
    for rc in resp_configs:
        must_queries = []
        q = Q({'match': {'thread.id': rc.thread_id}})
        must_queries.append(q)
        search = search.query('bool', must=must_queries)
        search.sort('-timestamp')
        results = search.execute()
        for hit in results:
            print(rc.thread_id, hit.id, hit.thread.title)
            message = build_message(hit)
            print(message)
            parse_for_response(message)


def build_message(hit):
    message = {
        'body': hit.body, 
        'id': hit.id, 
        'author': {
            'location': hit.author.location,
            'profile_url': hit.author.profile_url,
            'id': hit.author.id,
            'username': hit.author.username
        }, 
        'post_parent_id': hit.post_parent_id, 
        'timestamp': hit.timestamp, 
        'thread': {
            'forum_thread_id': hit.thread.forum_thread_id, 
            'source': {
                'url': hit.thread.source.url,
                'last_received_date': hit.thread.source.last_received_date, 
                'name': hit.thread.source.name, 
                'id': hit.thread.source.id, 
                'source_type': hit.thread.source.source_type,
            }, 
            'url': hit.thread.url, 
            'last_received_date': hit.thread.last_received_date, 
            'subforums': [], 
            'title': hit.thread.title, 
            'id': hit.thread.id
        }
    }
    if len(hit.thread.subforums) > 0:
        message['thread']['subforums'] = hit.thread.subforums
    return message


def get_es_client():
    return Elasticsearch(
        hosts=[{'host': host, 'port': 443}],
        use_ssl=True
    )


if __name__ == '__main__':
    print("Starting Response Parser test")
    test2()