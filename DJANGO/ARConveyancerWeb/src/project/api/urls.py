from pathlib import Path
from django.urls import path
from .views import ProjectAPIView

urlpatterns = [
    path('', ProjectAPIView.as_view()),
    path('<int:pk>/', ProjectAPIView.as_view()),
]