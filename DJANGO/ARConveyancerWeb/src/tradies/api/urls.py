from django.urls import path
from . import views
urlpatterns = [
    path('', views.TradieAPIView.as_view()),
    path('<int:pk>/', views.TradieAPIView.as_view()),
    path('login/', views.TradieLoginAPIView.as_view(), name="api-tradie-login"),
    path('login/company/', views.TradieLoginSelectCompany.as_view(), name="api-tradie-login-company"),
    path('change-password/', views.TradieChangePasswordAPIView.as_view(), name="api-tradie-change-password"),
    path('forgot-password/', views.TradieForgetPasswordAPIView.as_view(), name="api-tradie-forgot-password"),
    path('select-company/', views.ForgetPasswordCompanySelectAPIView.as_view(), name="api-tradie-forgot-password-select-company"),
    path('reset-password/', views.PasswordResetAPIView.as_view(), name="api-tradie-reset-password"),
]