from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.decorators import login_required
from .views import RegistrationView, cancel_subscription, index, lessons, SubscribeView

urlpatterns = [
    path('', login_required(index), name="index"),
    path('lessons/', login_required(lessons), name="lessons"),
    path('subscribe/', SubscribeView.as_view(), name="subscribe"),
    path('cancel-subscription/', login_required(cancel_subscription), name="cancel-subscription"),
    path('register/', RegistrationView.as_view(), name="register"),
    path('login/', LoginView.as_view(template_name='user/login.html'), name="login"),
    path('logout/', LogoutView.as_view(), name="logout"),
]
