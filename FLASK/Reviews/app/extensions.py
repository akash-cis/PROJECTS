from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from twilio.rest import Client
from app.config import Config
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from flask_security import Security, SQLAlchemyUserDatastore


conf = Config()

tjws = Serializer(conf.SECRET_KEY, 60)
s = Serializer(conf.SECRET_KEY)

db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
security = Security()
login.login_view = 'user.login'
login.login_message_category = 'info'
client = Client(conf.TWILIO_ACCOUNT_SID, conf.TWILIO_AUTH_TOKEN)
