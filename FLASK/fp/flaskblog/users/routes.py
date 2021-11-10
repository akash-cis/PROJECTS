from flask import Blueprint
import os
from flask import render_template, url_for, flash, redirect, request
from flaskblog.users.forms import RegistrationForm, LoginForm, ResetPassword, ResetRequest, UserUpdateForm
from flaskblog.models import User, Post
from flaskblog import db, bcrypt
from flask_login import login_user, logout_user, current_user, login_required
from .utils import *
from flask import current_app as app

users = Blueprint('users', __name__)


@users.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect('/')
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_pass = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user = User(username=form.username.data, email=form.email.data, password=hashed_pass)
        db.session.add(user)
        db.session.commit()

    return render_template('register.html', heading='About Page', form=form)

@users.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect('/')

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            if request.args.get('next'):
                return redirect(request.args.get('next'))
            return redirect('/')
        else:
            flash(f'Email or password were provided wrong', 'danger')

    return render_template('login.html', heading='About Page', form=form)


@users.route('/logout')
def logout():
    logout_user()
    # flash(f'Successfully logged out', 'success')
    return redirect('/login')


@users.route('/account', methods=['GET', 'POST'])
@login_required
def account():
    form = UserUpdateForm()

    if form.validate_on_submit():
        current_user.username = form.username.data
        current_user.email = form.email.data
        if form.image.data:
            image_name = save_picture(form.image.data)
            if current_user.image != 'default.jpg':
                os.remove(os.path.join(users.root_path, 'static/images', current_user.image))
            current_user.image = image_name

        db.session.commit()
        flash(f'Accout details updated successfully', 'success')
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email

    return render_template('account.html', form=form)


@users.route('/account/<string:username>')
@users.route('/account/<string:username>/<int:page>')
def view_profile(username=None, page=1):
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))

    user = User.query.filter_by(username=username).first_or_404()
    posts = Post.query.filter_by(user_id=user.id).order_by(Post.date_posted.desc()).paginate(page=page, per_page=1)

    return render_template('profile-view.html', user=user, posts=posts)


@users.route('/password/reset/request', methods=['GET', 'POST'])
def request_reset_password():
    if current_user.is_authenticated:
        return redirect(url_for('mains.home'))

    form = ResetRequest()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if send_reset_email(user):
            flash('An email has been sent to reset your password.', 'success')
            redirect(url_for('users.login'))
        else:
            flash('Something went wrong please try after sometime.', 'danger')
    return render_template('request_reset_password.html', form=form)


@users.route('/password/reset/<token>', methods=['GET', 'POST'])
def reset_password(token=None):
    if current_user.is_authenticated:
        return redirect(url_for('mains.home'))

    form = ResetPassword()
    if token:
        user = User.verify_reset_token(token)
        if not user:
            flash(f'Eiter the link is invalid or has been expired! Try again.', 'danger')
            return redirect(url_for('users.request_reset_password'))
        else:
            if form.validate_on_submit():
                hashed_pass = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
                user.password = hashed_pass
                db.session.commit()
                flash('Your password has been changed successfully', 'success')
                redirect(url_for('users.login'))

    return render_template('reset_password.html', form=form)