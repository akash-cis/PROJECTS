from django.contrib.auth.mixins import UserPassesTestMixin
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.core.exceptions import PermissionDenied

# this decorator demands the user to be a superuser.
def superuser_required():
    def wrapper(wrapped):
        class WrappedClass(UserPassesTestMixin, wrapped):
            def test_func(self):
                return self.request.user.is_superuser

        return WrappedClass
    return wrapper



def membership_required(redirect_to='/payment/'):
    def decorator(func):
        def wrap(self, request, *args, **kwargs):
                if self.request.user.membership != 'expired':
                    print(self.request.user.membership)
                    return func(self, request, *args, **kwargs)
                else:
                    messages.warning(request, 'Your account has been expired please pay the invoices before accessing the features..')
                    return HttpResponseRedirect(redirect_to)

        return wrap
    return decorator