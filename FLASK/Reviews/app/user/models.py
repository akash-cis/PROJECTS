from app import db
# from flask_login import UserMixin
from flask_security import RoleMixin, UserMixin
from app import login
# from werkzeug.security import check_password_hash, generate_password_hash
from flask_security import SQLAlchemyUserDatastore
from flask_security.utils import encrypt_password, verify_password


@login.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


roles_users = db.Table(
    'roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(20), nullable=False)
    last_name = db.Column(db.String(20), nullable=False)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password = db.Column(db.String(200), nullable=False)
    active = db.Column(db.Boolean, default=True)
    is_superuser = db.Column(db.Boolean, default=False)
    roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))

    def __repr__(self):
        return self.email

    def set_password(self, password):
        self.password = encrypt_password(password)

    def check_password(self, password):
        return verify_password(password, self.password)


class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False, unique=True)
    description = db.Column(db.String(255))
    
    def __repr__(self):
        return self.name


# from app.user.models import User, Role
datastore = SQLAlchemyUserDatastore(db, User, Role)