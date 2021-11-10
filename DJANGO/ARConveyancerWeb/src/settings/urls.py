from django.urls import path
from . import views


urlpatterns = [
    path('super-admin/', views.SuperAdminSettingsView.as_view(), name="super-admin-settings"),
]
