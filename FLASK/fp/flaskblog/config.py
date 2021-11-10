class Config():
    SECRET_KEY = 'bf069d5de6e5bd7da9bb4ed06848b2f7'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SERVER = 'smtp.googlemail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'kunaitrackerapp@gmail.com'
    MAIL_PASSWORD = '@Ka@Me@Ha@Me@Ha'