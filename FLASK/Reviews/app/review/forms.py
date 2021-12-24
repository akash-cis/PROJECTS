from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Length


class ReviewForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(min=2, max=40)])
    message = TextAreaField('Message', validators=[DataRequired(), Length(min=20, max=300)])
    submit = SubmitField('Submit')