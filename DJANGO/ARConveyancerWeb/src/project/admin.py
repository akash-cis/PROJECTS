from django.contrib import admin
from .models import Project
# Register your models here.
# admin.site.register(Project)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    readonly_fields = ('qr_code',)
    list_display = ['id','name','address','email','contact','status','user','company',]
    