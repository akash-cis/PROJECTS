from flask import Flask
from app.config import Config



def create_app(config_class=Config):
    app = Flask(__name__)

    from app.routes import app as main

    app.register_blueprint(main)

    return app