import pytest
from elasticsearch_dsl import Search
from api.elasticsearch import build_query
from datetime import datetime
from api.models import UserFilter, FilterGroupType, FilterField, FilterType

@pytest.fixture(scope='module')
def search():
    yield Search()

@pytest.fixture(scope='module')
def filters():
    filters = [
        [
            UserFilter(filter_type=FilterType(type=FilterGroupType.TEXT, filter_field=FilterField.BODY), value='leather'),
            UserFilter(filter_type=FilterType(type=FilterGroupType.TEXT, filter_field=FilterField.BODY), value='rims')
        ],
        [
            UserFilter(filter_type=FilterType(type=FilterGroupType.TEXT, filter_field=FilterField.LOCATION), value='Texas')
        ],
        # [
        #     UserFilter(filter_type=FilterType(type=FilterGroupType.MULTISELECT, filter_field=FilterField.TAGS), value='Audi'),
        #     UserFilter(filter_type=FilterType(type=FilterGroupType.MULTISELECT, filter_field=FilterField.TAGS), value='BMW'),
        #     UserFilter(filter_type=FilterType(type=FilterGroupType.MULTISELECT, filter_field=FilterField.TAGS), value='Ford'),
        #     UserFilter(filter_type=FilterType(type=FilterGroupType.MULTISELECT, filter_field=FilterField.TAGS), value='Jeep')
        # ]
    ]
    yield filters


def test_basic_query(search):
        query = build_query(search=search, filters=[], options={})
        assert query.to_dict() == {
            'query': {
                'bool': {
                    'filter': [
                        {
                            'range': {
                                'timestamp': {
                                    'gt': 'now-15d/d'
                                }
                            }
                        }
                    ]
                }
            },
            'sort': [
                {
                    'timestamp': {
                        'order': 'desc'
                    }
                }
            ]
        }


def test_get_older_query(search):
    older = datetime.utcnow()
    query = build_query(search=search, filters=[], options={'older': older})
    assert query.to_dict() == {
        'query': {
            'bool': {
                'filter': [
                    {
                        'range': {
                            'timestamp': {
                                'lt': older,
                                'gt': 'now-15d/d'
                            }
                        }
                    }
                ]
            }
        },
        'sort': [
            {
                'timestamp': {
                    'order': 'desc'
                }
            }
        ]
    }


def test_get_newer_query(search):
    newer = datetime.utcnow()
    query = build_query(search=search, filters=[], options={'newer': newer})
    assert query.to_dict() == {
        'query': {
            'bool': {
                'filter': [
                    {
                        'range': {
                            'timestamp': {
                                'gt': newer
                            }
                        }
                    }
                ]
            }
        },
        'sort': [
            {
                'timestamp': {
                    'order': 'desc'
                }
            }
        ]
    }


def test_range_query(search):
    query = build_query(search=search, filters=[], options={'range': 3})
    assert query.to_dict() == {
        'query': {
            'bool': {
                'filter': [
                    {
                        'range': {
                            'timestamp': {
                                'gt': 'now-4d/d'
                            }
                        }
                    }
                ]
            }
        },
        'sort': [
            {
                'timestamp': {
                    'order': 'desc'
                }
            }
        ]
    }


def test_get_range_older_query(search):
    older = datetime.utcnow()
    query = build_query(search=search, filters=[], options={'older': older, 'range': 1})
    assert query.to_dict() == {
        'query': {
            'bool': {
                'filter': [
                    {
                        'range': {
                            'timestamp': {
                                'lt': older,
                                'gt': 'now-2d/d'
                            }
                        }
                    }
                ]
            }
        },
        'sort': [
            {
                'timestamp': {
                    'order': 'desc'
                }
            }
        ]
    }


def test_filter_query(search, filters):
    query = build_query(search=search, filters=filters, options={})
    assert query.to_dict() == {
        'query': {
            'bool': {
                'filter': [
                    {
                        'match': {
                            'body': 'leather rims'
                        }
                    },
                    {
                        'match': {
                            'author.location': 'Texas'
                        }
                    },
                    # {
                    #     'term': {
                    #         'tags': 'Audi BMW Ford Jeep'
                    #     }
                    # },
                    {
                        'range': {
                            'timestamp': {
                                'gt': 'now-15d/d'
                            }
                        }
                    }
                ]
            }
        },
        'sort': [
            {
                'timestamp': {
                    'order': 'desc'
                }
            }
        ]
    }

