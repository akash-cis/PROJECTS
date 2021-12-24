import requests
from jose import jwt
from api import app
from api.models import User
from graphql import GraphQLError
from api import db

class JwtHelper:
    def __init__(self):
        self.public_keys = None
        self.cognito_client_id = app.config.get('COGNITO_APP_CLIENT_ID')

    def get_public_keys(self):
        if self.public_keys is None:
            user_pool_id = app.config.get('COGNITO_USERPOOL_ID')

            keys_url = f"https://cognito-idp.us-east-1.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
            keys_resp = requests.get(keys_url).json()

            self.public_keys = keys_resp['keys']

        return self.public_keys

    def decode(self, token):
        return jwt.decode(token, self.get_public_keys(), algorithms=['RS256'], audience=self.cognito_client_id)


jwtHelper = JwtHelper()


def authenticate_token(token):
    return jwtHelper.decode(token)


def get_auth_user(token):
    results = authenticate_token(token)
    user = User.get_user(cognito_id=results['username'])
    return user


def get_token_from_header(headers):
    token = headers.get('Authorization')
    if token:
        return token.split('Bearer ')[1]
    else:
        return ''


def get_authenticated_user(headers):
    token = get_token_from_header(headers)
    if token:
        return get_auth_user(token)
    else:
        return None


def get_user_roles(headers):
    token = get_token_from_header(headers)
    payload = authenticate_token(token)
    if 'cognito:groups' in payload:
        return payload['cognito:groups']
    else:
        return []


def is_request_authenticated(headers):
    token = get_token_from_header(headers)
    if token:
        user = get_auth_user(token)
        return True if user else False
    else:
        return False


def authentication_middleware(next, root, info, **args):
    if root is None:
        user = get_authenticated_user(info.context.headers)
        roles = get_user_roles(info.context.headers)
        if user:
            user.roles = roles
            setattr(info.context, "user", user)
            return next(root, info, **args)
        else:
            raise GraphQLError('Unauthorized - Must be logged in to access data')
    else:
        return next(root, info, **args)


def graphical_development_auth_middleware(next, root, info, **args):
    if root is None:
        user = db.session.query(User).filter(User.email == 'admin@funnelai.com').first()
        if user:
            user.roles = ['ADMIN']
            print('***** Using admin@funnelai.com User for developmental Authentication ***')
            setattr(info.context, "user", user)
            return next(root, info, **args)
        else:
            raise GraphQLError('Unauthorized - Must be logged in to access data')
    else:
        return next(root, info, **args)


def admin_protected(info, data):
    if info.context.user.is_admin():
        return data
    else:
        raise GraphQLError('Unauthorized - Only site admins are allowed to access this data')

