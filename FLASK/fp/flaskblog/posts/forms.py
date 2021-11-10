from typing import Text
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.fields.simple import TextAreaField
from wtforms.validators import DataRequired, Length



class PostCreateForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=2, max=200)])
    content = TextAreaField('Content', validators=[DataRequired(), Length(min=100)])
    submit = SubmitField('Post')

class PostUpdateForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=2, max=200)])
    content = TextAreaField('Content', validators=[DataRequired(), Length(min=100)])
    submit = SubmitField('Save')
