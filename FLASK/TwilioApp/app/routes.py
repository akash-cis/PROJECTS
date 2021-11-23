# from app import create_app as app
from flask import Blueprint
app = Blueprint('app', __name__)

from flask import render_template
from twilio.rest import Client
from app.config import Config

config = Config()


client = Client(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)


@app.route('/')
def index():
    return 'hello'


@app.route('/sms')
def sms():
    message = client.messages.create(
        body="Hey this is a message from flaskapp!",
        from_=config.TWILIO_PHONE_NUMBER,
        to='+918758254358',
    )
    print(message)

    return render_template('index.html')
