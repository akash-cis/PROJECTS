from django.urls import path
from django.contrib.auth.decorators import login_required
from .views import (
    LoginView,
    RegisterView, 
    DashboardView, 
    BuilderAdminListView,
    SuperAdminCreateview, 
    edit_user_view, 
    BuilderAdminCreateview,
    UserPasswordChangeView,
    delete_user_view,
    UserPasswordResetView,
    UserPasswordResetConfirmView,
    SuperAdminDashboardView,
    delete_builder_view,
    UserUpdateView,
    ProfileUpdateView, 
)
from django.contrib.auth.views import (
    LogoutView, 
    PasswordResetCompleteView, 
    # PasswordResetView, 
    PasswordResetDoneView, 
    # PasswordResetConfirmView, 
    PasswordChangeDoneView,
)
from django.urls import reverse_lazy

urlpatterns = [

    # User urls
    path("login/",LoginView.as_view(), name="login"),
    path("register/",RegisterView.as_view(),name="register"),
    path("logout/",LogoutView.as_view(),name="logout"),
    path("dashboard/",DashboardView.as_view(),name="dashboard"),
    path("account-settings/",UserUpdateView.as_view(),name="account-settings"),
    path("profile-settings/",ProfileUpdateView.as_view(),name="profile-settings"),

    # super admin dashboard urls
    path("super-admin/",SuperAdminDashboardView.as_view(),name="super-admin"),
    path("super-admin/create/", SuperAdminCreateview.as_view(), name="super-admin-create-view"),
    path("super-admin/delete/<int:pk>/", delete_builder_view, name="super-admin-delete-view"),

    # Builder admin dashboard urls
    path("builder-admin/",BuilderAdminListView.as_view(),name="builder-admin"),
    path("builder-admin-create-view/", BuilderAdminCreateview.as_view(), name="builder-admin-create-view"),
    path("builder-admin-edit-view/", edit_user_view, name="builder-admin-edit-view"),
    path("builder-admin-delete-view/<int:pk>/", delete_user_view, name="builder-admin-delete-view"),


    # change password views
    path('password-change/', login_required(UserPasswordChangeView.as_view()), name='password-change'),
    path('password-change-done/', login_required(PasswordChangeDoneView.as_view(template_name='user/password-change-done.html')), name='password-change-done'),

    # forget password views
    # 1
    path('password-reset/', 
        UserPasswordResetView.as_view(
            template_name = 'user/password-reset.html',
            success_url = reverse_lazy('password-reset-done'), 
            from_email = 'kunaitrackerapp@gmail.com',
            email_template_name = 'emails/forgot_password_email_text.html',
            html_email_template_name = 'emails/forgot_password_email.html',
        ), 
        name='password-reset'),

    # 2
    path('password-reset-done/', 
        PasswordResetDoneView.as_view(
            template_name = 'user/password-reset-done.html',
        ), 
        name='password-reset-done'),
    
    # 3
    path('password-reset-confirm/<uidb64>/<token>/', 
        UserPasswordResetConfirmView.as_view(
            template_name = 'user/password-reset-form.html', 
            success_url = reverse_lazy('password-reset-complete'),
        ), 
        name='password-reset-confirm'),

    # 4
    path('password-reset-complete/', 
        PasswordResetCompleteView.as_view(
            template_name = 'user/password-reset-complete.html',
        ), 
        name='password-reset-complete'),
]