from flask import Blueprint, render_template
from flask_login import current_user, login_required


main = Blueprint('main', __name__)


@main.route('/')
@login_required
def index():
    return render_template('home.html', title="Home")