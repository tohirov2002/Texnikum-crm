from django.urls import path
from .views import (
    # Fan va Xona
    SubjectListCreateView, RoomListCreateView,
    # Guruh
    GroupListCreateView, GroupDetailView,
    # Talaba
    StudentListCreateView, StudentDetailView, MyProfileView,
    # To'lov
    PaymentListCreateView, MyPaymentListView,
    # Dars
    LessonListCreateView, LessonDetailView, LessonFinishView,
    # Talaba Davomati
    StudentCheckInView, StudentCheckOutView,
    BulkAttendanceView, MarkLeftEarlyView,
    LiveAttendanceBoardView,
    StudentAttendanceListView, MyStudentAttendanceView,
    # Baho
    GradeListCreateView, MyGradesView,
    # Bildirishnoma
    NotificationListCreateView, MarkNotificationReadView, MarkAllNotificationsReadView,
    # Dashboard
    StudentDashboardView, CenterAdminDashboardView, TeacherDashboardView,
)

urlpatterns = [

    # ── Fan va Xona ───────────────────────────────────────────────────
    path('subjects/',                   SubjectListCreateView.as_view(),      name='subject_list_create'),
    path('rooms/',                      RoomListCreateView.as_view(),         name='room_list_create'),

    # ── Guruhlar ──────────────────────────────────────────────────────
    path('groups/',                     GroupListCreateView.as_view(),        name='group_list_create'),
    path('groups/<int:pk>/',            GroupDetailView.as_view(),            name='group_detail'),

    # ── Talabalar ─────────────────────────────────────────────────────
    path('students/',                   StudentListCreateView.as_view(),      name='student_list_create'),
    path('students/me/',                MyProfileView.as_view(),              name='my_profile'),
    path('students/<int:pk>/',          StudentDetailView.as_view(),          name='student_detail'),

    # ── To'lovlar ─────────────────────────────────────────────────────
    path('payments/',                   PaymentListCreateView.as_view(),      name='payment_list_create'),
    path('payments/my/',                MyPaymentListView.as_view(),          name='my_payment_list'),

    # ── Darslar ───────────────────────────────────────────────────────
    path('lessons/',                    LessonListCreateView.as_view(),       name='lesson_list_create'),
    path('lessons/<int:pk>/',           LessonDetailView.as_view(),           name='lesson_detail'),
    path('lessons/<int:pk>/finish/',    LessonFinishView.as_view(),            name='lesson_finish'),

    # ── Jonli davomat taxtasi ─────────────────────────────────────────
    path('lessons/<int:lesson_id>/live-board/', LiveAttendanceBoardView.as_view(), name='live_board'),

    # ── Talaba Davomati (GPS) ─────────────────────────────────────────
    path('student-attendance/',             StudentAttendanceListView.as_view(),   name='student_attendance_list'),
    path('student-attendance/my/',          MyStudentAttendanceView.as_view(),     name='my_student_attendance'),
    path('student-attendance/check-in/',    StudentCheckInView.as_view(),          name='student_check_in'),
    path('student-attendance/check-out/',   StudentCheckOutView.as_view(),         name='student_check_out'),
    path('student-attendance/bulk/',        BulkAttendanceView.as_view(),          name='bulk_attendance'),
    path('student-attendance/left-early/',  MarkLeftEarlyView.as_view(),           name='mark_left_early'),

    # ── Baholar ───────────────────────────────────────────────────────
    path('grades/',                     GradeListCreateView.as_view(),        name='grade_list_create'),
    path('grades/my/',                  MyGradesView.as_view(),               name='my_grades'),

    # ── Bildirishnomalar ──────────────────────────────────────────────
    path('notifications/',              NotificationListCreateView.as_view(), name='notification_list_create'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(),  name='notification_read'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='notifications_mark_all_read'),

    # ── Dashboard ─────────────────────────────────────────────────────
    path('dashboard/student/',          StudentDashboardView.as_view(),       name='student_dashboard'),
    path('dashboard/center-admin/',     CenterAdminDashboardView.as_view(),   name='center_admin_dashboard'),
    path('dashboard/teacher/',          TeacherDashboardView.as_view(),       name='teacher_dashboard'),
]
