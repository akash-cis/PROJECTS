from flask import Flask
from app.config import Config
from app.extensions import db, login, migrate, security
from app.user.models import datastore

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login.init_app(app)
    migrate.init_app(app, db)
    from app.admin import admin
    admin.init_app(app)
    security.init_app(app, datastore)
    

    from app.routes import main
    from app.user.routes import user
    from app.review.routes import review

    # Models
    from app.user import models
    from app.review import models

    app.register_blueprint(main)
    app.register_blueprint(user, endpoint='/user')
    app.register_blueprint(review)

    return app