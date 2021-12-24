from app import db
from flask import Blueprint, request, redirect, url_for, flash, render_template, request
from flask_login import current_user, login_user, logout_user
from app.extensions import client, tjws
from app.user.models import datastore

from app.user.forms import LoginForm, RegistrationForm
from app.user.models import User

user = Blueprint('user', __name__)

# @user.route('/register', methods=['GET', 'POST'])
# def register():
#     if current_user.is_authenticated:
#         return redirect(url_for('index'))

#     form = RegistrationForm()

#     if form.validate_on_submit():
#         # user = User(
#         #     first_name=form.first_name.data,
#         #     last_name=form.last_name.data,
#         #     username=form.username.data,
#         #     email=form.email.data,
#         # )
#         user = datastore.create_user(
#             first_name=form.first_name.data,
#             last_name=form.last_name.data,
#             username=form.username.data,
#             email=form.email.data,
#         )
#         user.set_password(form.password.data)
#         role = datastore.find_or_create_role('user')
#         user_role = datastore.add_role_to_user(user, role)
#         print(user_role)
#         db.session.add(user)
#         db.session.commit()
#         flash("Congratulations, you are now a registered user!")
#         return redirect(url_for('user.login'))
#     return render_template('register.html', title="Register", form=form)

# @user.route('/login', methods=['GET','POST'])
# def login():
#     if current_user.is_authenticated:
#         return redirect(url_for('main.index'))

#     form = LoginForm()

#     if form.validate_on_submit():
#         user = User.query.filter_by(email=form.email.data).first()
#         if user and user.check_password(form.password.data):
#             login_user(user, remember=form.remember_me.data)
#             if request.args.get('next'):
#                 return redirect(request.args.get('next'))
#             else:
#                 return redirect(url_for('main.index'))
        
#         flash('Email or Password is wrong.', 'error')
#         return redirect('login')
#     return render_template('login.html', title='Login', form=form)


@user.route('/logout')
def logout():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))

    logout_user()
    return redirect('login')

@user.route('/review/send')
def send_review():
    token = tjws.dumps({'user_id': current_user.id}).decode('utf-8')
    print(url_for('review.review_openion', token=token))
    message = client.messages.create(
        body=f"Hello Thank you so much for visiting us, Please review our work by clicking the link. {url_for('review.review_openion', token=token, _external=True)}",
        from_='+19123784048',
        media_url=['https://www.barfblog.com/wp-content/uploads/2021/03/review2-1.jpg',],
        to='+918758254358',
    )
    flash('Review Message sent.', 'success')
    return redirect(url_for('main.index'))