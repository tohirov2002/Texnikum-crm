from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserListCreateView,
    UserDetailView,
    AdminLogListView,
)

urlpatterns = [

    # ── Autentifikatsiya ──────────────────────────────────────────────
    path('auth/login/',           LoginView.as_view(),          name='login'),
    path('auth/logout/',          LogoutView.as_view(),         name='logout'),
    path('auth/token/refresh/',   TokenRefreshView.as_view(),   name='token_refresh'),
    path('auth/me/',              MeView.as_view(),             name='me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),

    # ── Foydalanuvchilar boshqaruvi ───────────────────────────────────
    path('users/',                UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/',       UserDetailView.as_view(),     name='user_detail'),

    # ── Audit loglar ──────────────────────────────────────────────────
    path('logs/',                 AdminLogListView.as_view(),   name='admin_logs'),
]