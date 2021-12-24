import requests
import json
import re
from requests.exceptions import ConnectionError

"""
Utility function to forward a request to another url
Relies on graphene's info to get the current request body

create_forwarder takes an url and returns a function (as currying).
The returned function takes graphene's info and forwards the request.
"""
def create_forwarder(url):
    def forward_gql_request(info, inner_field_name=None):
        # Get data from context
        query = sanitize(info.context.json)

        # Get field name to return just the raw response
        field_name = info.field_name

        try:
            response = requests.post(url, query)
        except ConnectionError as e:
            raise ConnectionError(f"Failed to establish a new connection", e)
        except Exception as e:
            raise ConnectionError(
                f"Request error: {url} call failed", e, response.content)

        json = response.json()
        try:
            field_name_response = json["data"][field_name]
        except Exception as e:
            if "errors" in json:
                error = json["errors"]
                raise ConnectionError(f"Forwarded GraphQL error: {error}", e)
            raise

        # Inner field name is commonly used in mutations
        # where the field_name is the name of the mutation
        # and then you want to access an inner field name
        # which holds the actual data returned
        if inner_field_name:
            field_name_response = field_name_response[lower_fist(
                inner_field_name)]

        return normalize_keys(field_name_response)

    return forward_gql_request


# Recursively convert from camelCase to snake_case
def normalize_keys(l):
    if isinstance(l, list):
        return [normalize_keys(v) for v in l]
    elif isinstance(l, dict):
        return {to_snake(k): normalize_keys(v) for k, v in l.items() if k != '__typename'}
    else:
        return l


def to_snake(s):
    pattern = re.compile(r'(?<!^)(?=[A-Z])')
    return pattern.sub('_', s).lower()


def sanitize(d):
    s = {k: dump(v) for k, v in d.items()}
    return s


def dump(v):
    if (isinstance(v, dict)):
        return json.dumps(v)
    return v


def lower_fist(s):
    return s[0].lower() + s[1:]
