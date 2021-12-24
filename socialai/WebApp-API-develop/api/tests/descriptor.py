from api.utils.descriptor import SQLAlchemyDescriptor
from funnel_models import models


def test_descriptor():
    person_descriptor = SQLAlchemyDescriptor(model=models.Person)
