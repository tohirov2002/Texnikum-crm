from django.urls import path
from .views import (
    # Texnikum
    TexnikumListCreateView, TexnikumDetailView,
    TexnikumSubscriptionView,
    # Texnikum Users (yangi)
    TexnikumUsersListView, TexnikumUserCreateView,
    TexnikumUserAssignView, TexnikumUserDetailView,
    UnassignedUsersView,
    # Department & Position
    DepartmentListCreateView, PositionListCreateView,
    # Employee
    EmployeeListCreateView, EmployeeDetailView, EmployeeMeView,
    EmployeeStatusListCreateView,
    # Davomat
    EmployeeCheckInView, EmployeeCheckOutView,
    ManualAttendanceView, AttendanceListView, MyAttendanceView,
    # Payroll
    PayrollListView, MyPayrollView, PayrollApproveView,
    # Expense
    ExpenseListCreateView, ExpenseDetailView,
    # Dashboard
    DirectorDashboardView,
)

urlpatterns = [

    # ── Texnikum ──────────────────────────────────────────────────────
    path('texnikum/',                          TexnikumListCreateView.as_view(),   name='texnikum_list_create'),
    path('texnikum/<int:pk>/',                 TexnikumDetailView.as_view(),       name='texnikum_detail'),
    path('texnikum/<int:pk>/subscription/',    TexnikumSubscriptionView.as_view(), name='texnikum_subscription'),

    # ── Texnikum Foydalanuvchilari ────────────────────────────────────
    path('texnikum/users/unassigned/',                      UnassignedUsersView.as_view(),      name='unassigned_users'),
    path('texnikum/<int:pk>/users/',                        TexnikumUsersListView.as_view(),     name='texnikum_users'),
    path('texnikum/<int:pk>/users/create/',                 TexnikumUserCreateView.as_view(),    name='texnikum_user_create'),
    path('texnikum/<int:pk>/users/assign/',                 TexnikumUserAssignView.as_view(),    name='texnikum_user_assign'),
    path('texnikum/<int:pk>/users/<int:user_pk>/',          TexnikumUserDetailView.as_view(),    name='texnikum_user_detail'),

    # ── Bo'lim va Lavozim ─────────────────────────────────────────────
    path('departments/',           DepartmentListCreateView.as_view(), name='department_list_create'),
    path('positions/',             PositionListCreateView.as_view(),   name='position_list_create'),

    # ── Xodimlar ──────────────────────────────────────────────────────
    path('employees/',             EmployeeListCreateView.as_view(),   name='employee_list_create'),
    path('employees/me/',          EmployeeMeView.as_view(),           name='employee_me'),
    path('employees/<int:pk>/',    EmployeeDetailView.as_view(),       name='employee_detail'),
    path('employee-statuses/',     EmployeeStatusListCreateView.as_view(), name='employee_status'),

    # ── Davomat ───────────────────────────────────────────────────────
    path('attendance/',            AttendanceListView.as_view(),       name='attendance_list'),
    path('attendance/my/',         MyAttendanceView.as_view(),         name='my_attendance'),
    path('attendance/check-in/',   EmployeeCheckInView.as_view(),      name='employee_check_in'),
    path('attendance/check-out/',  EmployeeCheckOutView.as_view(),     name='employee_check_out'),
    path('attendance/manual/',     ManualAttendanceView.as_view(),     name='manual_attendance'),

    # ── Oylik hisob-kitob ─────────────────────────────────────────────
    path('payroll/',               PayrollListView.as_view(),          name='payroll_list'),
    path('payroll/my/',            MyPayrollView.as_view(),            name='my_payroll'),
    path('payroll/<int:pk>/approve/', PayrollApproveView.as_view(),    name='payroll_approve'),

    # ── Xarajatlar ────────────────────────────────────────────────────
    path('expenses/',              ExpenseListCreateView.as_view(),    name='expense_list_create'),
    path('expenses/<int:pk>/',     ExpenseDetailView.as_view(),        name='expense_detail'),

    # ── Dashboard ─────────────────────────────────────────────────────
    path('dashboard/director/',    DirectorDashboardView.as_view(),    name='director_dashboard'),
]



# from django.urls import path
# from .views import (
#     # Texnikum
#     TexnikumListCreateView, TexnikumDetailView,
#     # Department & Position
#     DepartmentListCreateView, PositionListCreateView,
#     # Employee
#     EmployeeListCreateView, EmployeeDetailView,
#     EmployeeStatusListCreateView,
#     # Davomat
#     EmployeeCheckInView, EmployeeCheckOutView,
#     ManualAttendanceView, AttendanceListView, MyAttendanceView,
#     # Payroll
#     PayrollListView, PayrollApproveView,
#     # Expense
#     ExpenseListCreateView, ExpenseDetailView,
#     # Dashboard
#     DirectorDashboardView,
# )

# urlpatterns = [

#     # ── Texnikum ──────────────────────────────────────────────────────
#     path('texnikum/',              TexnikumListCreateView.as_view(),   name='texnikum_list_create'),
#     path('texnikum/<int:pk>/',     TexnikumDetailView.as_view(),       name='texnikum_detail'),

#     # ── Bo'lim va Lavozim ─────────────────────────────────────────────
#     path('departments/',           DepartmentListCreateView.as_view(), name='department_list_create'),
#     path('positions/',             PositionListCreateView.as_view(),   name='position_list_create'),

#     # ── Xodimlar ──────────────────────────────────────────────────────
#     path('employees/',             EmployeeListCreateView.as_view(),   name='employee_list_create'),
#     path('employees/<int:pk>/',    EmployeeDetailView.as_view(),       name='employee_detail'),
#     path('employee-statuses/',     EmployeeStatusListCreateView.as_view(), name='employee_status'),

#     # ── Davomat ───────────────────────────────────────────────────────
#     path('attendance/',            AttendanceListView.as_view(),       name='attendance_list'),
#     path('attendance/my/',         MyAttendanceView.as_view(),         name='my_attendance'),
#     path('attendance/check-in/',   EmployeeCheckInView.as_view(),      name='employee_check_in'),
#     path('attendance/check-out/',  EmployeeCheckOutView.as_view(),     name='employee_check_out'),
#     path('attendance/manual/',     ManualAttendanceView.as_view(),     name='manual_attendance'),

#     # ── Oylik hisob-kitob ─────────────────────────────────────────────
#     path('payroll/',               PayrollListView.as_view(),          name='payroll_list'),
#     path('payroll/<int:pk>/approve/', PayrollApproveView.as_view(),    name='payroll_approve'),

#     # ── Xarajatlar ────────────────────────────────────────────────────
#     path('expenses/',              ExpenseListCreateView.as_view(),    name='expense_list_create'),
#     path('expenses/<int:pk>/',     ExpenseDetailView.as_view(),        name='expense_detail'),

#     # ── Dashboard ─────────────────────────────────────────────────────
#     path('dashboard/director/',    DirectorDashboardView.as_view(),    name='director_dashboard'),
# ]
