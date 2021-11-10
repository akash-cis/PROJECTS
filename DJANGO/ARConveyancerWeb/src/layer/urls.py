from django.urls import path
from .views import delete_layer_view, layer_create_view, LayerCreateView

urlpatterns = [
    path('create/', LayerCreateView.as_view(), name="create-layer"),
    path('delete/<int:pk>/', delete_layer_view, name="delete-layer"),
]
