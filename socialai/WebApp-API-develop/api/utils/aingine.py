"""
This functions are the same defined on AingineAPI repo under utils folder
For comments on what this functions do, look at AingineAPI utils folder
TODO: Share utils between repos

Obs: SQLMutationAingine works only for aingine, see comments there
"""

from graphene import Field, InputObjectType, ObjectType, Boolean, Int
from graphene.types.inputobjecttype import InputObjectTypeOptions
import sqlalchemy
from sqlalchemy.orm import (ColumnProperty, CompositeProperty,
                            RelationshipProperty)
from collections import OrderedDict
from graphene_sqlalchemy.converter import convert_sqlalchemy_column
from graphene.types.utils import yank_fields_from_attrs
import re
from graphene.types.mutation import MutationOptions, Mutation
from api.utils import create_forwarder, instantiate_graph
from config import AINGINE_GRAPHQL_API_URL
from funnel_models import models


class SQLAlchemyInputObjectTypeOptions(InputObjectTypeOptions):
    model = None


def construct_fields(model, include_id=False, include_active=False):
    inspected_model = sqlalchemy.inspect(model)

    model_attrs = inspected_model.column_attrs

    fields = OrderedDict()
    for attr_name, attr in model_attrs.items():
        if attr_name == 'id' and not include_id:
            continue
        if attr_name == 'active' and not include_active:
            continue
        if isinstance(attr, ColumnProperty):
            field = convert_sqlalchemy_column(attr, None, None)
        fields[attr_name] = field

    return fields


class SQLAlchemyInputObjectType(InputObjectType):
    @classmethod
    def __init_subclass_with_meta__(cls, _model=None, model=None, id=None, _meta=None, include_id=None, **options):
        if not _meta:
            _meta = SQLAlchemyInputObjectTypeOptions(cls)

        _meta.model = model
        _meta.include_id = include_id

        if not model:
            _meta.model = _model

        sqla_fields = yank_fields_from_attrs(
            construct_fields(_meta.model, include_id=_meta.include_id), _as=Field, sort=False)

        _meta.fields = sqla_fields

        super(SQLAlchemyInputObjectType,
              cls).__init_subclass_with_meta__(_meta=_meta, **options)


def to_snake(s):
    pattern = re.compile(r'(?<!^)(?=[A-Z])')
    return pattern.sub('_', s).lower()


class SQLAlchemyMutationAingine(ObjectType):
    @classmethod
    def __init_subclass_with_meta__(cls, model=None, object_type=None, _meta=None, action="Create", **options):
        model_name = f"{model.__name__}"
        _model = model

        class Input(SQLAlchemyInputObjectType):
            class Meta:
                model = _model
                name = f"{action}{model_name}Input"
                include_id = action == "Update"

        if not _meta:
            _meta = MutationOptions(cls)

        snake_name = to_snake(model_name)
        _meta.fields = OrderedDict(
            {snake_name: Field(object_type), 'ok': Field(Boolean)})
        _meta.arguments = OrderedDict({f"{snake_name}_data": Input()})

        # This makes this class specific to aingine
        call_aingine = create_forwarder(AINGINE_GRAPHQL_API_URL)

        def mutate(self, info, **kwargs):
            ok = None
            entity = None
            # Forward request to aingine
            try:
                response = call_aingine(info)

                if snake_name in response:
                    entity = instantiate_graph(
                        response[snake_name], constructor=_model)

                if 'ok' in response:
                    ok = response['ok']

            except:
                ok = False
                raise

            # Response comes as json, instantiate it to sqlalchemy objects

            return cls(**{snake_name: entity, 'ok': ok})

        _meta.resolver = mutate
        _meta.output = cls

        super(SQLAlchemyMutationAingine, cls).__init_subclass_with_meta__(
            _meta=_meta, **options)

    @classmethod
    def Field(cls, name=None, description=None, required=False):
        return Field(cls._meta.output, args=cls._meta.arguments, resolver=cls._meta.resolver, name=name, required=required,)

class SQLAlchemyRemoveMutationAingine(ObjectType):
    @classmethod
    def __init_subclass_with_meta__(cls, model=None, _meta=None, **options):
        model_name = f"{model.__name__}"
        _model = model

        if not _meta:
            _meta = MutationOptions(cls)

        _meta.fields = OrderedDict(
            {'ok': Field(Boolean)})
        _meta.arguments = OrderedDict({"id": Int(required=True)})

        # This makes this class specific to aingine
        call_aingine = create_forwarder(AINGINE_GRAPHQL_API_URL)

        def mutate(self, info, id):
            ok = None

            # Forward request to aingine
            try:
                response = call_aingine(info)

                if 'ok' in response:
                    ok = response['ok']

            except:
                ok = False
                raise

            # Response comes as json, instantiate it to sqlalchemy objects

            return cls(**{'ok': ok})

        _meta.resolver = mutate
        _meta.output = cls

        super(SQLAlchemyRemoveMutationAingine, cls).__init_subclass_with_meta__(
            _meta=_meta, **options)

    @classmethod
    def Field(cls, name=None, description=None, required=False):
        return Field(cls._meta.output, args=cls._meta.arguments, resolver=cls._meta.resolver, name=name, required=required,)