"""
This utilities are used to instantiate a JSON response to a SQAlchemy model.

We need to do this when using SQLAlchemyObjectType class to expose fields from SQLAlchemy models.
As graphene-sqlalchemy expects the returned object to be a SQLAlchemy model.
"""
import re
from functools import reduce
from datetime import datetime


def deepgetattr(obj, attr):
    return reduce(getattr, attr.split('.'), obj)


def get_constructor(object, key, value):
    # If it has edges get the actual class
    if (isinstance(value, dict) or isinstance(value, list)):
        return deepgetattr(object, f"{key}.prop.entity.class_")

    return object


# Constructor is the class type of the parent node
def instantiate_graph(node, constructor):
    if (isinstance(node, dict)):
        # Recursively get all values from graph
        values = {k: instantiate_graph(v, get_constructor(constructor, k, v))
                  for k, v in node.items()}

        # Instantiate based of [instantiated] values
        return constructor(**values)
    elif (isinstance(node, list)):
        # If it's a list it doesn't need instantiaton, just traversal
        return [instantiate_graph(v, constructor) for v in node]
    else:
        return parse_string(node)


def parse_string(s):
    try:
        # timestamp with milliseconds
        match = re.match(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d", s)
        if match:
            return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S.%f")

        # timestamp missing milliseconds
        match = re.match(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", s)
        if match:
            return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S")
    except:
        pass
    return s
