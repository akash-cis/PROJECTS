from django.urls import path
from .views import (
    delete_tradie_view,
    TradieCreateView, 
    TradieListView, 
    invite_tradie,
    edit_tradie_view,
    delete_tradie_view,
    # TradieUpdateView, 
    # TradieDeleteView, 
)

urlpatterns = [
    # in use
    path('list/', TradieListView.as_view(), name='list-tradie'),
    path('add/', TradieCreateView.as_view(), name='add-tradie'),
    path('edit-tradie-view/', edit_tradie_view, name='edit-tradie-view'),
    path('delete/tradie/<int:pk>/', delete_tradie_view, name='delete-tradie-view'),
    path('invite/<int:pk>/', invite_tradie, name='invite-tradie'),

    # not in use
    # path('edit/<int:pk>/', TradieUpdateView.as_view(), name='edit-tradie'),
    # path('delete/<int:pk>/', TradieDeleteView.as_view(), name='delete-tradie'),
]