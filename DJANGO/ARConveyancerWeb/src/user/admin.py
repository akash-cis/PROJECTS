from django.contrib import admin
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.admin import (
    UserAdmin as DjangoUserAdmin, 
    GroupAdmin as DjangoGroupAdmin
)
from django.contrib.auth.models import Group
from .models import User, Role, Profile
from .forms import UserCreationForm, BuilderAdminCreateForm


# Register your models here.


# Role model's admin model
@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['id','role_type','name']


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['id','user','address','postal_code','city','state','country','auto_pay']


# User model's admin model
@admin.register(User)
class UserAdmin(DjangoUserAdmin, BuilderAdminCreateForm):
    """Admin model for Custom User model with personalized fields."""

    # add form of the model
    add_form = BuilderAdminCreateForm
    
    fieldsets = (
        (None, {'fields': ('email', 'password', 'membership')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'company', 'role')}),
        (_('Permissions'), {'fields': ('is_active', 'is_admin', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login','date_joined',)}),
    )

    list_filter = ('is_admin', 'is_superuser', 'groups', 'user_permissions')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'company', 'is_admin', 'is_active', 'is_superuser', 'groups',),
        }),
    )

    list_display = ('id', 'email', 'first_name', 'last_name', 'is_admin', 'role', 'company')

    list_display_links = ('id', 'email')

    search_fields = ('email', 'first_name', 'last_name')

    ordering = ('email',)


admin.site.unregister(Group)
# Group model's admin model 
@admin.register(Group)
class GroupAdmin(DjangoGroupAdmin):
    """Define admin model for Group model."""
    
    list_display = ('id', 'name',)
