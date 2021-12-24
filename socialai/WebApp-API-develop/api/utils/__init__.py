from api.utils.forward_gql_request import *
from api.utils.instantiate_graph import *
from api.utils.descriptor import *
from api.utils.aingine import *
from api.utils.constants import *


# Misc
def are_dicts_arrays_empty(dict):
    for _, v in dict.items():
        if len(v):
            return False
    return True