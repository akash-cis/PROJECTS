from flask import url_for, redirect, request, abort
from app import db
from flask_admin.contrib.sqla import ModelView as AdminModelView
from flask_admin import BaseView as AdminBaseView
from flask_admin.base import expose
from app.user.models import User
from app.review.models import Review
from flask_admin import Admin, AdminIndexView
# from flask_login import current_user
from flask_security import current_user, login_required
from flask_security.decorators import roles_required, roles_accepted

class BaseView(AdminBaseView):
    @expose('/')
    # @roles_required('admin')
    # @login_required
    def index(self): 
        return self.render('admin/custom_index.html') 

class SiteAdminIndexView(AdminIndexView):
    pass
    def is_accessible(self):
        print(current_user.roles)
        return current_user.is_authenticated and 'admin' in current_user.roles

    def inaccessible_callback(self, name, **kwargs):
        if current_user.is_authenticated:
            abort(403)
        else:
            return redirect(url_for('user.login', next= request.url))


class ModelView(AdminModelView):

    def is_accessible(self):
        return current_user.is_authenticated and 'admin' in current_user.roles

    def inaccessible_callback(self, name, **kwargs):
        if current_user.is_authenticated:
            abort(403)
        else:
            return redirect(url_for('user.login', next=request.url))


admin = Admin(template_mode='bootstrap4', index_view=SiteAdminIndexView(), name='Review')

admin.add_view(ModelView(User, db.session, endpoint="users"))
admin.add_view(ModelView(Review, db.session, endpoint="reviews"))