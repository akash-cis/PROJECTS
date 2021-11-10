from django.urls import path
from .views import StageListView, StageCreateView, edit_stage_view, delete_stage_view

urlpatterns = [
    path('create/', StageCreateView.as_view(), name="create-stage"),
    path('project/<int:pk>/', StageListView.as_view(), name="list-stage"),
    path('edit/', edit_stage_view, name="edit-stage"),
    path('delete/<int:pk>/', delete_stage_view, name="delete-stage"),
]
