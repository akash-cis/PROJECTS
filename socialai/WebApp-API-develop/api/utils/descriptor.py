from sqlalchemy import inspect
from sqlalchemy.orm.properties import ColumnProperty
from sqlalchemy.orm.relationships import RelationshipProperty
import re


"""
This class is used to get the fields from a given SQLAlchemy model
Is used on formGen on the frontend along with getColumnsFromDescriptor function there.
"""
class SQLAlchemyDescriptor:
    def __init__(self, model=None):
        self.fields = []
        self.model = model
        inspected_model = inspect(model)

        for key, value in inspected_model.relationships.items():
            self.fields.append(
                {'model_name': key, 'fields': get_values_from_model(value)})


def get_values_from_model(model):
    values = []
    colums = model.entity.columns

    for k, v in colums.items():
        if "id" not in k and "active" not in k:
            values.append(get_properties_from_field(v))

    return values


def get_properties_from_field(field):
    name = field.name
    type = field.type.__class__.__name__
    nullable = field.nullable
    field_type = field.type

    if hasattr(field_type, 'enums'):
        enums = field_type.enums
        return {'name': name, 'nullable': nullable, 'type': type, 'options': enums}

    return {'name': name, 'nullable': nullable, 'type': type}
