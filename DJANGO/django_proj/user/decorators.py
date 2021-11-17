from django.http import HttpResponseRedirect
from django.contrib import messages
from django.core.exceptions import PermissionDenied
from functools import wraps

def subscription_required(function, redirect_url='/user/'):
    @wraps(function)
    def wrap(request, *args, **kwargs):
        print(request.user.subscription_status)
        if request.user.subscription_status in ['active', 'trialing']:
            return function(request, *args, **kwargs)
        else:
            messages.warning(request, 'Subscription is required to access this feature.')
            return HttpResponseRedirect(redirect_url)
    return wrap


# def subscription_required(redirect_url='/payment/'):
#     def decorator(func):
#         def wrap(self, request, *args, **kwargs):
#             if self.request.parent.subscription_status in ['active', 'trialing']:
#                 return func(self, request, *args, **kwargs)
#             else:
#                 messages.warning(request, 'Subscription is required to access this feature.')
#                 return HttpResponseRedirect(redirect_url)
#         return wrap
#     return decorator