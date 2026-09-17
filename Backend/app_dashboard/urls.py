from django.urls import path
from .views import (
    # SuperAdmin
    SuperAdminDashboardView,
    SuperAdminTexnikumStatsView,
    # Founder
    FounderDashboardView,
    FounderHRDetailView,
    FounderFinanceDetailView,
    # SaaS
    SaaSManagementView,
    SaaSSubscriptionUpdateView,
)

urlpatterns = [

    # ── SuperAdmin Dashboard ──────────────────────────────────────────
    path('dashboard/superadmin/',
         SuperAdminDashboardView.as_view(),
         name='superadmin_dashboard'),

    path('dashboard/superadmin/texnikum/<int:texnikum_id>/',
         SuperAdminTexnikumStatsView.as_view(),
         name='superadmin_texnikum_stats'),

    # ── Founder Dashboard ─────────────────────────────────────────────
    path('dashboard/founder/',
         FounderDashboardView.as_view(),
         name='founder_dashboard'),

    path('dashboard/founder/hr/',
         FounderHRDetailView.as_view(),
         name='founder_hr_detail'),

    path('dashboard/founder/finance/',
         FounderFinanceDetailView.as_view(),
         name='founder_finance_detail'),

    # ── SaaS Boshqaruv (faqat SuperAdmin) ────────────────────────────
    path('saas/texnikumlar/',
         SaaSManagementView.as_view(),
         name='saas_management'),

    path('saas/texnikumlar/<int:texnikum_id>/subscription/',
         SaaSSubscriptionUpdateView.as_view(),
         name='saas_subscription_update'),
]