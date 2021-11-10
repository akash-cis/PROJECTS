from flask import render_template, url_for, flash, redirect, request, Blueprint, abort
from flaskblog.posts.forms import PostCreateForm, PostUpdateForm
from flaskblog.models import Post
from flaskblog import db
from flask_login import current_user

posts = Blueprint('posts', __name__)

@posts.route('/post/new', methods=['GET', 'POST'])
def new_post():
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))
    form = PostCreateForm()
    posts = []
    if form.validate_on_submit():
        post = Post(title=form.title.data, content=form.content.data, user_id=current_user.id)
        db.session.add(post)
        db.session.commit()
        flash(f'Posted!', 'success')
    # elif request.method == 'GET':
    form.title.data = ''
    form.content.data = ''
    posts = Post.query.filter_by(user_id=current_user.id).order_by(Post.date_posted.desc())
    return render_template('article-new.html', posts=posts, form=form)


@posts.route('/post/edit/<int:id>', methods=['GET', 'POST'])
def edit_post(id=None):
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))

    post = Post.query.get(id)
    if post.author != current_user:
        abort(403)

    print(post.title)
    form = PostUpdateForm()
    if form.validate_on_submit():
        post.title = form.title.data
        post.content = form.content.data
        db.session.commit()
        flash(f'Post data Updated!', 'success')
        # return redirect(url_for('mains.post'))
    if request.method == 'GET':
        form.title.data = post.title
        form.content.data = post.content
    return render_template('article-edit.html', form=form)


@posts.route('/post/delete/<int:id>', methods=['GET','POST'])
def delete_post(id=None):
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))

    Post.query.filter_by(id=id).delete()
    db.session.commit()
    flash(f'Post deleted!', 'success')
    return redirect(url_for('posts.new_post'))
