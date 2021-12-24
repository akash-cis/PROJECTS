
from flask import url_for


class Config():
    SECRET_KEY = 'SECRET'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TWILIO_ACCOUNT_SID = 'AC7e63fe8dca4902ebb0ef360a808899cc'
    TWILIO_AUTH_TOKEN = '879f6793f69fb52b08c9ae48cdb8fb91'
    FLASK_ADMIN_SWATCH = 'Slate'
    SECURITY_PASSWORD_HASH = 'sha512_crypt'
    SECURITY_PASSWORD_SALT = 'secret'
    # SECURITY_LOGIN_URL = '/user/login'
    SECURITY_LOGIN_USER_TEMPLATE = 'login.html'
    # SECURITY_POST_LOGIN_VIEW = 'login'
    SECURITY_REGISTERABLE = True