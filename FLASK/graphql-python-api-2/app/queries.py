from app import db
from app.post.models import Post
from ariadne import convert_kwargs_to_snake_case

def getpost_resolver(obj, info, id):
    try:
        post = Post.query.get(id)
        payload = {
            "success": True,
            "post": post.to_dict()
        }
    except AttributeError as e:
        payload = {
            "success": False,
            "errors": [f"{e}"]
        }
    return payload


def listposts_resolver(obj, info):
    try:
        posts = [post.to_dict() for post in Post.query.all()]
        print(posts)
        payload = {
            "success": True,
            "post": posts
        }
    except Exception as e:
        payload = {
            "success": False,
            "errors": [f"{e}"]
        }
    return payload


@convert_kwargs_to_snake_case
def createpost_resolver(obj, info, title, description):
    try:
        from datetime import date
        post = Post(title=title, description=description, created_at=date.today())
        db.session.add(post)
        db.session.commit()
        payload = {
            "success": True,
            "post": post.to_dict()
        }
    except Exception as e:
        payload = {
            "success": False,
            "errors": [f'{e}']
        }
    return payload


@convert_kwargs_to_snake_case
def updatepost_resolver(obj, info, id, title, description):
    print('*--------------------------')
    try:
        post = Post.query.get(id)
        post.title = title
        post.description = description
        db.session.commit()
        payload = {
            "success": True,
            "post": post
        }
    except Exception as e:
        payload = {
            "success": False,
            "errors": [f'{e}']
        }
    return payload

@convert_kwargs_to_snake_case
def deletepost_resolver(obj, info, id):
    try:
        post = Post.query.get(id)
        db.session.delete(post)
        db.session.commit()
        payload = {
            "success": True,
            "post": post
        }
    except Exception as e:
        payload = {
            "success": True,
            "errors": [f'{e}']
        }
    return payload