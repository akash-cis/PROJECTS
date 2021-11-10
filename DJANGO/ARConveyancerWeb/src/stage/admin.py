from django.contrib import admin
from .models import Stage

# Register your models here.
@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    readonly_fields=('plan_date',)
    list_display = ['id', 'name', 'plan_date', 'status', 'project', 'tradie']