from django.contrib import admin
from .models import Invoice

# Register your models here.
@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'timestamp', 'tran_id', 'amount', 'user']

    fieldsets = (
        (None, {'fields': ('id', 'timestamp', 'tran_id', 'amount', 'user')}),
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    # def has_delete_permission(self, request, obj=None):
    #     return False
    
    def has_view_permission(self, request, obj=None):
        return super().has_view_permission(request, obj=obj)