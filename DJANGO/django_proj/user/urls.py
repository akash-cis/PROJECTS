from django.urls import path
from django.contrib.auth.views import LogoutView
from django.contrib.auth.decorators import login_required
from .views import RegistrationView, cancel_subscription, index, lessons, SubscribeView, RegistrationWizardView, LoginView

urlpatterns = [
    path('', login_required(index), name="index"),
    path('lessons/', login_required(lessons), name="lessons"),
    path('subscribe/', SubscribeView.as_view(), name="subscribe"),
    path('cancel-subscription/', login_required(cancel_subscription), name="cancel-subscription"),
    path('register/', RegistrationView.as_view(), name="register"),
    path('signup/', RegistrationWizardView.as_view(), name="signup"),
    path('login/', LoginView.as_view(), name="login"),
    path('logout/', LogoutView.as_view(), name="logout"),
]
