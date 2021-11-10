"""AR URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from user.views import BuilderAdminListView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', BuilderAdminListView.as_view()),
    path('user/',include('user.urls')),
    path('builder/', include('ar_builder.urls')),
    path('tradies/',include('tradies.urls')),
    path('projects/',include('project.urls')),
    path('stage/',include('stage.urls')),
    path('layer/',include('layer.urls')),
    path('settings/',include('settings.urls')),
    path('payment/',include('payment.urls')),


    # DRF APIs
    path('api-auth/', include('rest_framework.urls')),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    # Custom APIs
    path('api/tradie/', include('tradies.api.urls')),
    path('api/project/', include('project.api.urls')),

]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)