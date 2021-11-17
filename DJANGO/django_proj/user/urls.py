from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.decorators import login_required
from .views import RegistrationView, index, lessons

urlpatterns = [
    path('', login_required(index), name="index"),
    path('lessons/', lessons, name="lessons"),
    path('register/', RegistrationView.as_view(), name="register"),
    path('login/', LoginView.as_view(template_name='user/login.html'), name="login"),
    path('logout/', LogoutView.as_view(), name="logout"),
]
