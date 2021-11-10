from django.contrib import admin
from .models import Tradie


# Register your models here.
@admin.register(Tradie)
class TradieAdmin(admin.ModelAdmin):

    readonly_fields = ['password',]

    fields = ( 'name', 'email', 'contact', 'status', 'company', 'password')

    list_display = ['name', 'email', 'contact', 'status', 'company',]