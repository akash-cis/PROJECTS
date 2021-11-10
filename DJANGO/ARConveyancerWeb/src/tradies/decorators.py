from django.http import HttpResponseRedirect
from django.contrib import messages
from django.core.exceptions import PermissionDenied

def role_required(allowed_roles=[], redirect_to='/tradies/list/'):
    def decorator(func):
        def wrap(self, request, *args, **kwargs):
            if allowed_roles:
                if self.request.user.role.role_type in allowed_roles:
                    return func(self, request, *args, **kwargs)
                else:
                    messages.warning(request, 'You are not permitted to access the page.')
                    return HttpResponseRedirect(redirect_to)
            else:
                return func(self, request, *args, **kwargs)

        return wrap
    return decorator

def role_prohibited(prohibited_roles=[], redirect_to='/user/dashboard/'):
    def decorator(func):
        def wrap(self, request, *args, **kwargs):
            if prohibited_roles:
                if self.request.user.role.role_type not in prohibited_roles:
                    return func(self, request, *args, **kwargs)
                else:
                    messages.warning(request, 'You are not permitted to access this page.')
                    return HttpResponseRedirect(redirect_to)
            else:
                return func(self, request, *args, **kwargs)

        return wrap
    return decorator