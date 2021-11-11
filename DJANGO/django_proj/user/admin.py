from django.contrib import admin

from user.models import Parent, Profile, Student

# Register your models here.
admin.site.register(Parent)
admin.site.register(Profile)
admin.site.register(Student)