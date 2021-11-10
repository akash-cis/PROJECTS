from django.contrib import admin
from .models import SuperAdminSettings
# Register your models here.
@admin.register(SuperAdminSettings)
class SuperAdminSttingsAdmin(admin.ModelAdmin):

    fieldsets = (
        ('Main', {'fields':('logo',)}),
        ('QR Code', {'fields':('qr_code_text','project_rate','layer_rate')}),
        ('Payment', {'fields':('duration_period','duration')}),
        ('Trial', {'fields':('trial_duration_period','trial_duration')}),
        ('Invoice', {'fields':('due_days',)}),
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False