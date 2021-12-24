from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from app.config import Config

cors = CORS()
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    cors.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes import main

    from app.post import models

    app.register_blueprint(main) 

    return app