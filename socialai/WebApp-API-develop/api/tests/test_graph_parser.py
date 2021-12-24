from api.utils import instantiate_graph, to_snake, create_forwarder, normalize_keys
from funnel_models.models import Person
import json
from os.path import join, dirname


def get_json(filename):
    relative_path = join('support', filename)
    absolute_path = join(dirname(__file__), relative_path)
    return json.loads(open(absolute_path).read())


def test_snake():
    assert to_snake("fullName") == "full_name"


def mock_response(*args):
    class MockResponse:
        def __init__(self, json, json_data=None):
            self.json = lambda: json
            self.json_data = json_data

    return MockResponse(get_json('graph.json'))


class ContextMock():
    def __init__(self, json):
        self.json = json


class MockInfo:
    def __init__(self, json, field_name):
        self.context = ContextMock(json=get_json(json))
        self.field_name = field_name


def test_response(mocker):
    mocker.patch('api.utils.forward_gql_request.requests.post', mock_response)
    forwarder = create_forwarder('#')  # should be called with an url
    info = MockInfo('query.json', "allPersons")
    response = forwarder(info)
    assert response == normalize_keys(
        get_json('graph.json')["data"]["allPersons"])


def test_graph_instatiation():
    res = normalize_keys(
        get_json('graph.json')["data"]["allPersons"])

    graph = instantiate_graph(res, Person)
    assert graph
