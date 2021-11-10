from django.contrib import admin
from .models import Layer

# Register your models here.
@admin.register(Layer)
class LayerAdmin(admin.ModelAdmin):
    list_display = ['id', 'image', 'project']