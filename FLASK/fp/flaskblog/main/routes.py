from flask import render_template, redirect, request, current_app as app
from sqlalchemy.sql.operators import desc_op
from flaskblog import db
from flaskblog.models import Post
from flask_login import current_user
from flask import Blueprint

main = Blueprint('mains', __name__)

@main.route('/')
@main.route('/<int:page>')
def home(page=1):
    if not current_user.is_authenticated:
        return redirect('/login')

    posts = Post.query.order_by(Post.date_posted.desc()).paginate(page=page, per_page=1)
    return render_template('home.html', posts=posts, heading='Home Page')

@main.route('/post')
def post():
    if not current_user.is_authenticated:
        return redirect('/login')

    # posts = Post.query.order_
    # posts = db.session.query(Post).all().order_by()
    posts = db.session.query(Post).order_by(desc_op(Post.id))
    return render_template('article.html', posts=posts, heading='Posts')

@main.route('/about')
def about():
    if not current_user.is_authenticated:
        return redirect('/login')
    return render_template('about.html', heading='About Page')

