from flask.helpers import flash
from app import db
from flask import Blueprint, render_template, redirect, url_for
from app.review.forms import ReviewForm
from app.review.models import Review
from app.extensions import s


review = Blueprint('review', __name__)

@review.route('/review', methods=['GET', 'POST'])
def review_view():

    form = ReviewForm()
    if form.validate_on_submit():
        review = Review(name=form.name.data, message=form.message.data)
        db.session.add(review)
        db.session.commit()
        return redirect(url_for('review.review_thank_you'))
    return render_template('review.html', title='Review', form=form)


@review.route('/review/thankyou')
def review_thank_you():
    return render_template('review_thank_you.html', title="Thank You")

@review.route('/review/openion/<token>')
def review_openion(token):
    # try:
    #     user_id = s.loads(token)['user_id']
    # except:
    #     flash('This link has been expired', "warning")
    #     return redirect(url_for('main.index'))
    
    return render_template('review_openion.html', title="Review")