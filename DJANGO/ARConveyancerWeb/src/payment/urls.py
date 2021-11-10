from django.urls import path
from . import views

urlpatterns = [
    path('', views.PaymentView.as_view(), name="payment"),
    path('card', views.CardCreateView.as_view(), name="save-card"),
    path('invoices/', views.InvoiceListView.as_view(), name="payment-invoices"),
    path('success/', views.payment_success, name="payment-success"),
    path('cancel/', views.payment_cancel, name="payment-cancel"),
]
