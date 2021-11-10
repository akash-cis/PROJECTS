import os
import secrets
from PIL import Image
from flask import url_for, current_app as app
from flaskblog import mail
from flask_mail import Message

def send_reset_email(user):
    token = user.generate_reset_token()
    print(app.config['MAIL_USERNAME'])
    msg = Message('Password Reset Request',sender=app.config['MAIL_USERNAME'], recipients=[user.email])
    msg.body = f'''To reset Your password click on the link bilow.
    {url_for('users.reset_password', token=token, _external=True)}    
    '''
    print(msg)
    try:
        mail.send(msg)
    except:
        return False
    return True


def save_picture(image_data):
    rtx = secrets.token_hex(8)
    _, f_ext = os.path.splitext(image_data.filename)
    filename = rtx + f_ext
    picture_path = os.path.join(app.root_path, 'static/images', filename)
    
    thumb_size = (125, 125)
    i = Image.open(image_data)
    i.thumbnail(thumb_size)

    i.save(picture_path)
    return filename
