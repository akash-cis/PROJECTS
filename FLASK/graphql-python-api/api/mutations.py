from datetime import date
from api import db
from api.models import Post
from ariadne import convert_kwargs_to_snake_case


@convert_kwargs_to_snake_case
def create_post_resolver(obj, info, title, description):
    try:
        today = date.today()
        post = Post(title=title, description=description, date=today)
        db.session.add(post)
        db.session.commit()
        payload = {
            "success": True,
            "post": post.to_dict()
        }
    except ValueError:
        payload = {
            "success": False,
            "errors": [f"Incorrect date format provided. Date should be in "
                       f"the format dd-mm-yyyy"]
        }
    return payload


@convert_kwargs_to_snake_case
def delete_post_resolver(obj, info, id):
    try:
        post = Post.query.get(id)
        db.session.delete(post)
        db.session.commit()
        payload = {
            "success": True,
            "post": post.to_dict()
        }
    except ValueError:
        payload = {
            "success": False,
            "errors": [f"unable to delete post."]
        }
    return payload



@convert_kwargs_to_snake_case
def update_post_resolver(obj, info, id, title, description):
    try:
        post = Post.query.get(id)
        post.title = title
        post.description = description
        db.session.commit()
        payload = {
            "success": True,
            "post": post.to_dict()
        }
    except ValueError:
        payload = {
            "success": False,
            "errors": [f'Unable to edit the post! something went wrong.']
        }
    return payload
