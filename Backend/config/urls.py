from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# Swagger view
schema_view = get_schema_view(
    openapi.Info(
        title="TimeFast API",
        default_version='v1',
        description="Met Texnikum loyihasining API",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@texnikum.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Apps endpoints
    path('api/', include('users.urls')),
    path('api/', include('app_texnikum.urls')),
    path('api/', include('app_talaba.urls')),
    path('api/', include('app_dashboard.urls')),
    # Swagger endpoints (root da ochiladi)
    path('', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)