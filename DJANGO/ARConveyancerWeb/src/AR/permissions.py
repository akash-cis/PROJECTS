from rest_framework import permissions
from django.conf import settings

class IsAPIUser(permissions.BasePermission):
    '''
    Allow access to only user created for accessiong the api.
    '''
    def has_permission(self, request, view):
        return request.user.email == settings.API_ADMIN_EMAIL
