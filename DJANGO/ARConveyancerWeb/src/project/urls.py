from django.urls import path
from .views import ProjectListView, ProjectCreateView, SuperAdminProjectListView, edit_project_view, delete_project_view, ProjectDetailView
urlpatterns = [
    path('', ProjectListView.as_view(), name='list-project'),
    path('create-project/', ProjectCreateView.as_view(), name='create-project'),
    path('edit-project/', edit_project_view, name='edit-project'),
    path('delete-project/<int:pk>/', delete_project_view, name='delete-project'),
    path('project/<int:pk>/', ProjectDetailView.as_view(), name='detail-project'),
    path('builder/<int:pk>/', SuperAdminProjectListView.as_view(), name='super-admin-list-project'),
]