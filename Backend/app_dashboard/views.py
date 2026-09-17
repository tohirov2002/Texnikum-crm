from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import date, timedelta

from app_texnikum.models import (
    Texnikum, Employee, EmployeeAttendance, Payroll, Expense
)
from app_talaba.models import (
    Student, Group, Lesson, StudentAttendance, Payment, Notification
)
from users.models import CustomUser, AdminLog
from users.permissions import IsSuperAdmin, IsSuperAdminOrFounder


# ═══════════════════════════════════════════════════════════════
#  SUPER ADMIN DASHBOARD
#  Platforma egasi — barcha texnikumlar, global statistika, SaaS
# ═══════════════════════════════════════════════════════════════

class SuperAdminDashboardView(APIView):
    """
    GET /api/dashboard/superadmin/

    Faqat SuperAdmin ko'ra oladi.
    Platformadagi barcha texnikumlarning umumiy holati.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        today = date.today()
        this_month_start = today.replace(day=1)
        this_year_start  = today.replace(month=1, day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end   = this_month_start - timedelta(days=1)

        # ── 1. TEXNIKUMLAR UMUMIY ─────────────────────────────────────
        total_texnikum   = Texnikum.objects.count()
        active_texnikum  = Texnikum.objects.filter(is_active=True).count()
        inactive_texnikum = total_texnikum - active_texnikum

        # Obuna muddati tugayotganlar (30 kun ichida)
        expiring_soon = Texnikum.objects.filter(
            subscription_end__lte=today + timedelta(days=30),
            subscription_end__gte=today,
            is_active=True
        ).values('id', 'name', 'subscription_end')

        # Obunasi o'tganlar
        expired = Texnikum.objects.filter(
            subscription_end__lt=today,
            is_active=True
        ).count()

        # ── 2. FOYDALANUVCHILAR ───────────────────────────────────────
        total_users     = CustomUser.objects.count()
        users_by_role   = list(
            CustomUser.objects.values('role')
            .annotate(count=Count('id'))
            .order_by('role')
        )
        active_users    = CustomUser.objects.filter(is_active=True).count()
        new_users_month = CustomUser.objects.filter(
            date_joined__date__gte=this_month_start
        ).count()

        # ── 3. JAMI XODIM VA TALABALAR ───────────────────────────────
        total_employees = Employee.objects.filter(is_active=True).count()
        total_students  = Student.objects.filter(is_active=True, study_status='active').count()
        total_groups    = Group.objects.filter(is_active=True).count()

        # ── 4. BUGUNGI GLOBAL DAVOMAT ────────────────────────────────
        emp_present_today = EmployeeAttendance.objects.filter(
            date=today, arrival_time__isnull=False
        ).count()
        emp_late_today = EmployeeAttendance.objects.filter(
            date=today, late_minutes__gt=0
        ).count()

        std_present_today = StudentAttendance.objects.filter(
            date=today, status__in=['present', 'late']
        ).count()
        std_absent_today  = StudentAttendance.objects.filter(
            date=today, status='absent'
        ).count()

        # ── 5. MOLIYAVIY UMUMIY ───────────────────────────────────────
        # Talabalar to'lovlari (bu oy)
        monthly_payments = Payment.objects.filter(
            date__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        # O'tgan oy
        last_month_payments = Payment.objects.filter(
            date__range=[last_month_start, last_month_end]
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Yillik jami
        yearly_payments = Payment.objects.filter(
            date__gte=this_year_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Jami qarzdorlik
        total_debt = Student.objects.filter(
            is_active=True
        ).aggregate(
            debt=Sum(F('contract_amount') - F('paid_amount'))
        )['debt'] or 0

        # ── 6. TEXNIKUMLAR REYTINGI ───────────────────────────────────
        texnikum_stats = []
        texnikumlar = Texnikum.objects.filter(is_active=True).order_by('name')

        for t in texnikumlar:
            t_employees = Employee.objects.filter(texnikum=t, is_active=True).count()
            t_students  = Student.objects.filter(texnikum=t, is_active=True, study_status='active').count()
            t_groups    = Group.objects.filter(texnikum=t, is_active=True).count()

            t_present = EmployeeAttendance.objects.filter(
                texnikum=t, date=today, arrival_time__isnull=False
            ).count()
            t_emp_percent = round(t_present / t_employees * 100, 1) if t_employees else 0

            t_payment = Payment.objects.filter(
                texnikum=t, date__gte=this_month_start
            ).aggregate(total=Sum('amount'))['total'] or 0

            texnikum_stats.append({
                'id':             t.id,
                'name':           t.name,
                'is_active':      t.is_active,
                'subscription_end': str(t.subscription_end) if t.subscription_end else None,
                'employees':      t_employees,
                'students':       t_students,
                'groups':         t_groups,
                'emp_attendance_today': t_present,
                'emp_attendance_percent': t_emp_percent,
                'monthly_payment': t_payment,
                'gps_radius':     t.gps_radius,
            })

        # ── 7. OXIRGI LOGLAR ─────────────────────────────────────────
        recent_logs = AdminLog.objects.select_related('user', 'texnikum').order_by('-timestamp')[:20]
        logs_data = [
            {
                'user':       log.user.username if log.user else 'Tizim',
                'role':       log.user.role if log.user else '-',
                'action':     log.action,
                'action_type': log.action_type,
                'texnikum':   log.texnikum.name if log.texnikum else 'Global',
                'timestamp':  log.timestamp.strftime('%Y-%m-%d %H:%M'),
            }
            for log in recent_logs
        ]

        # ── 8. O'SISH GRAFIGI (Oxirgi 6 oy) ─────────────────────────
        growth_data = []
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            month_end   = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            new_students = Student.objects.filter(
                enrollment_date__range=[month_start, month_end]
            ).count()
            new_payments = Payment.objects.filter(
                date__range=[month_start, month_end]
            ).aggregate(total=Sum('amount'))['total'] or 0

            growth_data.append({
                'month':        month_start.strftime('%Y-%m'),
                'month_label':  month_start.strftime('%B %Y'),
                'new_students': new_students,
                'payments':     float(new_payments),
            })

        return Response({
            'date': str(today),

            # Texnikumlar
            'texnikum': {
                'total':          total_texnikum,
                'active':         active_texnikum,
                'inactive':       inactive_texnikum,
                'expired_sub':    expired,
                'expiring_soon':  list(expiring_soon),
            },

            # Foydalanuvchilar
            'users': {
                'total':          total_users,
                'active':         active_users,
                'new_this_month': new_users_month,
                'by_role':        users_by_role,
            },

            # Umumiy
            'overview': {
                'total_employees': total_employees,
                'total_students':  total_students,
                'total_groups':    total_groups,
            },

            # Bugungi davomat
            'attendance_today': {
                'employees_present': emp_present_today,
                'employees_late':    emp_late_today,
                'students_present':  std_present_today,
                'students_absent':   std_absent_today,
            },

            # Moliya
            'finance': {
                'monthly_payments':      float(monthly_payments),
                'last_month_payments':   float(last_month_payments),
                'yearly_payments':       float(yearly_payments),
                'total_student_debt':    float(total_debt),
                'growth_vs_last_month':  round(
                    (float(monthly_payments) - float(last_month_payments)) /
                    float(last_month_payments) * 100, 1
                ) if last_month_payments else 0,
            },

            # Texnikumlar reytingi
            'texnikum_stats': texnikum_stats,

            # Oxirgi loglar
            'recent_logs': logs_data,

            # O'sish grafigi
            'growth_chart': growth_data,
        })


class SuperAdminTexnikumStatsView(APIView):
    """
    GET /api/dashboard/superadmin/texnikum/<id>/
    Bitta texnikumning batafsil statistikasi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, texnikum_id):
        try:
            texnikum = Texnikum.objects.get(pk=texnikum_id)
        except Texnikum.DoesNotExist:
            return Response({"error": "Texnikum topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        today            = date.today()
        this_month_start = today.replace(day=1)
        this_year_start  = today.replace(month=1, day=1)

        # Xodimlar
        employees       = Employee.objects.filter(texnikum=texnikum, is_active=True)
        total_employees = employees.count()

        # Talabalar
        students       = Student.objects.filter(texnikum=texnikum, is_active=True)
        total_students = students.filter(study_status='active').count()

        # Guruhlar
        groups = Group.objects.filter(texnikum=texnikum, is_active=True)

        # Bugungi davomat
        emp_present = EmployeeAttendance.objects.filter(
            texnikum=texnikum, date=today, arrival_time__isnull=False
        ).count()
        emp_late = EmployeeAttendance.objects.filter(
            texnikum=texnikum, date=today, late_minutes__gt=0
        ).count()

        # Talabalar davomati (bu oy)
        std_att_month = StudentAttendance.objects.filter(
            group__texnikum=texnikum,
            date__gte=this_month_start
        )
        std_present_month = std_att_month.filter(status__in=['present', 'late']).count()
        std_total_month   = std_att_month.count()

        # Moliya
        monthly_income = Payment.objects.filter(
            texnikum=texnikum, date__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        yearly_income = Payment.objects.filter(
            texnikum=texnikum, date__gte=this_year_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        monthly_expenses = Expense.objects.filter(
            texnikum=texnikum, date__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_debt = students.aggregate(
            debt=Sum(F('contract_amount') - F('paid_amount'))
        )['debt'] or 0

        # Oylik maoshlar (bu oy approved)
        monthly_payroll = Payroll.objects.filter(
            texnikum=texnikum,
            year=today.year, month=today.month
        ).aggregate(total=Sum('net_salary'))['total'] or 0

        # Xodimlar bo'yicha davomat (bu oy)
        emp_attendance_month = EmployeeAttendance.objects.filter(
            texnikum=texnikum, date__gte=this_month_start
        )
        avg_late_min = emp_attendance_month.aggregate(
            avg=Avg('late_minutes')
        )['avg'] or 0

        # Guruhlar bo'yicha statistika
        groups_stats = []
        for g in groups:
            g_students = g.students.filter(is_active=True).count()
            g_present  = StudentAttendance.objects.filter(
                group=g, date=today, status__in=['present', 'late']
            ).count()
            groups_stats.append({
                'id':           g.id,
                'name':         g.name,
                'teacher':      g.teacher.full_name if g.teacher else None,
                'students':     g_students,
                'present_today': g_present,
                'percent':      round(g_present / g_students * 100, 1) if g_students else 0,
            })

        # Foydalanuvchilar
        users_in_texnikum = CustomUser.objects.filter(texnikum=texnikum)
        users_by_role = list(
            users_in_texnikum.values('role').annotate(count=Count('id'))
        )

        return Response({
            'texnikum': {
                'id':               texnikum.id,
                'name':             texnikum.name,
                'address':          texnikum.address,
                'phone':            texnikum.phone,
                'is_active':        texnikum.is_active,
                'subscription_end': str(texnikum.subscription_end) if texnikum.subscription_end else None,
                'gps_radius':       texnikum.gps_radius,
                'latitude':         texnikum.latitude,
                'longitude':        texnikum.longitude,
            },
            'overview': {
                'total_employees': total_employees,
                'total_students':  total_students,
                'total_groups':    groups.count(),
            },
            'users_by_role': users_by_role,
            'attendance_today': {
                'employees_present':  emp_present,
                'employees_late':     emp_late,
                'employees_percent':  round(emp_present / total_employees * 100, 1) if total_employees else 0,
                'students_present_today': StudentAttendance.objects.filter(
                    group__texnikum=texnikum, date=today, status__in=['present', 'late']
                ).count(),
            },
            'attendance_month': {
                'std_present': std_present_month,
                'std_total':   std_total_month,
                'std_percent': round(std_present_month / std_total_month * 100, 1) if std_total_month else 0,
                'avg_emp_late_minutes': round(float(avg_late_min), 1),
            },
            'finance': {
                'monthly_income':   float(monthly_income),
                'yearly_income':    float(yearly_income),
                'monthly_expenses': float(monthly_expenses),
                'monthly_payroll':  float(monthly_payroll),
                'net_profit':       float(monthly_income) - float(monthly_expenses) - float(monthly_payroll),
                'total_debt':       float(total_debt),
            },
            'groups_stats':   groups_stats,
        })


# ═══════════════════════════════════════════════════════════════
#  FOUNDER DASHBOARD
#  Ta'sischi — faqat o'z texnikumi, moliya va natijalar
# ═══════════════════════════════════════════════════════════════

class FounderDashboardView(APIView):
    """
    GET /api/dashboard/founder/
    Faqat Founder ko'ra oladi — faqat o'z texnikumi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounder]

    def get(self, request):
        user     = request.user
        texnikum = user.texnikum

        if not texnikum:
            return Response({"error": "Texnikum biriktirilmagan!"}, status=status.HTTP_400_BAD_REQUEST)

        today            = date.today()
        this_month_start = today.replace(day=1)
        this_year_start  = today.replace(month=1, day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end   = this_month_start - timedelta(days=1)

        # ── 1. XODIMLAR ───────────────────────────────────────────────
        total_employees  = Employee.objects.filter(texnikum=texnikum, is_active=True).count()
        emp_present_today = EmployeeAttendance.objects.filter(
            texnikum=texnikum, date=today, arrival_time__isnull=False
        ).count()
        emp_late_today = EmployeeAttendance.objects.filter(
            texnikum=texnikum, date=today, late_minutes__gt=0
        ).count()

        # Bu oyda kechikishlar
        late_this_month = EmployeeAttendance.objects.filter(
            texnikum=texnikum,
            date__gte=this_month_start,
            late_minutes__gt=0
        ).count()
        total_late_min_month = EmployeeAttendance.objects.filter(
            texnikum=texnikum, date__gte=this_month_start
        ).aggregate(total=Sum('late_minutes'))['total'] or 0

        # ── 2. TALABALAR ──────────────────────────────────────────────
        total_students  = Student.objects.filter(
            texnikum=texnikum, is_active=True, study_status='active'
        ).count()
        std_present_today = StudentAttendance.objects.filter(
            group__texnikum=texnikum, date=today, status__in=['present', 'late']
        ).count()
        std_absent_today  = StudentAttendance.objects.filter(
            group__texnikum=texnikum, date=today, status='absent'
        ).count()

        # Bu oyda talabalar davomati
        std_att_month = StudentAttendance.objects.filter(
            group__texnikum=texnikum, date__gte=this_month_start
        )
        std_present_month = std_att_month.filter(status__in=['present', 'late']).count()
        std_total_month   = std_att_month.count()

        # ── 3. MOLIYA — TUSHUM ────────────────────────────────────────
        monthly_income = Payment.objects.filter(
            texnikum=texnikum, date__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        last_month_income = Payment.objects.filter(
            texnikum=texnikum, date__range=[last_month_start, last_month_end]
        ).aggregate(total=Sum('amount'))['total'] or 0

        yearly_income = Payment.objects.filter(
            texnikum=texnikum, date__gte=this_year_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        # ── 4. MOLIYA — XARAJATLAR ────────────────────────────────────
        monthly_expenses = Expense.objects.filter(
            texnikum=texnikum, date__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        expenses_by_category = list(
            Expense.objects.filter(
                texnikum=texnikum, date__gte=this_month_start
            ).values('category').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-total')
        )

        last_month_expenses = Expense.objects.filter(
            texnikum=texnikum, date__range=[last_month_start, last_month_end]
        ).aggregate(total=Sum('amount'))['total'] or 0

        yearly_expenses = Expense.objects.filter(
            texnikum=texnikum, date__gte=this_year_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        # ── 5. OYLIK MAOSHLAR ─────────────────────────────────────────
        monthly_payroll_total = Payroll.objects.filter(
            texnikum=texnikum, year=today.year, month=today.month
        ).aggregate(total=Sum('net_salary'))['total'] or 0

        pending_payrolls = Payroll.objects.filter(
            texnikum=texnikum, year=today.year, month=today.month, status='draft'
        ).count()

        total_penalties_month = Payroll.objects.filter(
            texnikum=texnikum, year=today.year, month=today.month
        ).aggregate(total=Sum('late_penalty'))['total'] or 0

        # ── 6. SOF FOYDA ──────────────────────────────────────────────
        net_profit_month = float(monthly_income) - float(monthly_expenses) - float(monthly_payroll_total)
        net_profit_last  = float(last_month_income) - float(last_month_expenses)

        # ── 7. QARZDORLAR ─────────────────────────────────────────────
        total_debt = Student.objects.filter(
            texnikum=texnikum, is_active=True
        ).aggregate(
            debt=Sum(F('contract_amount') - F('paid_amount'))
        )['debt'] or 0

        debtors_count = Student.objects.filter(
            texnikum=texnikum,
            is_active=True,
            paid_amount__lt=F('contract_amount')
        ).count()

        # ── 8. DIREKTOR HARAKATLARI (Logs) ───────────────────────────
        director_logs = AdminLog.objects.filter(
            texnikum=texnikum
        ).select_related('user').order_by('-timestamp')[:30]

        logs_data = [
            {
                'user':        l.user.username if l.user else 'Tizim',
                'role':        l.user.get_role_display() if l.user else '-',
                'action':      l.action,
                'action_type': l.action_type,
                'timestamp':   l.timestamp.strftime('%Y-%m-%d %H:%M'),
            }
            for l in director_logs
        ]

        # ── 9. OYLIK GRAFIK (Oxirgi 6 oy) ────────────────────────────
        monthly_chart = []
        for i in range(5, -1, -1):
            m_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            m_end   = (m_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            m_income   = Payment.objects.filter(
                texnikum=texnikum, date__range=[m_start, m_end]
            ).aggregate(total=Sum('amount'))['total'] or 0

            m_expense  = Expense.objects.filter(
                texnikum=texnikum, date__range=[m_start, m_end]
            ).aggregate(total=Sum('amount'))['total'] or 0

            m_payroll  = Payroll.objects.filter(
                texnikum=texnikum, year=m_start.year, month=m_start.month
            ).aggregate(total=Sum('net_salary'))['total'] or 0

            m_std_att  = StudentAttendance.objects.filter(
                group__texnikum=texnikum, date__range=[m_start, m_end]
            )
            m_present  = m_std_att.filter(status__in=['present', 'late']).count()
            m_total    = m_std_att.count()

            monthly_chart.append({
                'month':          m_start.strftime('%Y-%m'),
                'month_label':    m_start.strftime('%B %Y'),
                'income':         float(m_income),
                'expenses':       float(m_expense),
                'payroll':        float(m_payroll),
                'net_profit':     float(m_income) - float(m_expense) - float(m_payroll),
                'std_attendance_percent': round(m_present / m_total * 100, 1) if m_total else 0,
            })

        # ── 10. HR UMUMIY ─────────────────────────────────────────────
        # Xodimlar davomati foizi (bu oy)
        working_days = sum(
            1 for d in range((today - this_month_start).days + 1)
            if (this_month_start + timedelta(days=d)).weekday() < 5
        )
        expected_emp_att = total_employees * working_days
        actual_emp_att   = EmployeeAttendance.objects.filter(
            texnikum=texnikum,
            date__gte=this_month_start,
            arrival_time__isnull=False
        ).count()
        emp_att_percent = round(actual_emp_att / expected_emp_att * 100, 1) if expected_emp_att else 0

        return Response({
            'date':     str(today),
            'texnikum': {
                'id':   texnikum.id,
                'name': texnikum.name,
            },

            # Xodimlar holati
            'employees': {
                'total':              total_employees,
                'present_today':      emp_present_today,
                'absent_today':       total_employees - emp_present_today,
                'late_today':         emp_late_today,
                'present_percent':    round(emp_present_today / total_employees * 100, 1) if total_employees else 0,
                'late_this_month':    late_this_month,
                'total_late_min_month': total_late_min_month,
                'monthly_att_percent': emp_att_percent,
            },

            # Talabalar holati
            'students': {
                'total':            total_students,
                'present_today':    std_present_today,
                'absent_today':     std_absent_today,
                'present_percent_today': round(
                    std_present_today / total_students * 100, 1
                ) if total_students else 0,
                'monthly_att_percent': round(
                    std_present_month / std_total_month * 100, 1
                ) if std_total_month else 0,
                'debtors_count':    debtors_count,
                'total_debt':       float(total_debt),
            },

            # Moliya
            'finance': {
                # Tushum
                'monthly_income':       float(monthly_income),
                'last_month_income':    float(last_month_income),
                'yearly_income':        float(yearly_income),
                'income_growth':        round(
                    (float(monthly_income) - float(last_month_income)) /
                    float(last_month_income) * 100, 1
                ) if last_month_income else 0,

                # Xarajatlar
                'monthly_expenses':     float(monthly_expenses),
                'last_month_expenses':  float(last_month_expenses),
                'yearly_expenses':      float(yearly_expenses),
                'expenses_by_category': expenses_by_category,

                # Maoshlar
                'monthly_payroll':      float(monthly_payroll_total),
                'pending_payrolls':     pending_payrolls,
                'total_penalties':      float(total_penalties_month),

                # Foyda
                'net_profit_month':     net_profit_month,
                'net_profit_last_month': net_profit_last,
                'profit_growth':        round(
                    (net_profit_month - net_profit_last) /
                    abs(net_profit_last) * 100, 1
                ) if net_profit_last else 0,
            },

            # Grafik ma'lumotlari
            'monthly_chart': monthly_chart,

            # Director harakatlari
            'director_logs': logs_data,
        })


# ═══════════════════════════════════════════════════════════════
#  FOUNDER — HR BATAFSIL
#  Xodimlar davomati, kechikishlar, oyliklar
# ═══════════════════════════════════════════════════════════════

class FounderHRDetailView(APIView):
    """
    GET /api/dashboard/founder/hr/
    Xodimlar intizomi va oylik hisob-kitoblar.

    Query params:
      ?year=2024&month=5
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounder]

    def get(self, request):
        user     = request.user
        texnikum = user.texnikum if not user.is_superuser else None

        today = date.today()
        year  = int(request.query_params.get('year', today.year))
        month = int(request.query_params.get('month', today.month))

        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)

        emp_filter = {'is_active': True}
        att_filter = {'date__range': [month_start, month_end]}
        if texnikum:
            emp_filter['texnikum'] = texnikum
            att_filter['texnikum'] = texnikum

        employees = Employee.objects.filter(**emp_filter).select_related('user', 'texnikum', 'position')

        # Ish kunlari (bu oy)
        working_days = sum(
            1 for d in range((month_end - month_start).days + 1)
            if (month_start + timedelta(days=d)).weekday() < 5
        )

        hr_data = []
        for emp in employees:
            atts = EmployeeAttendance.objects.filter(employee=emp, **att_filter)

            present_days   = atts.filter(arrival_time__isnull=False).count()
            absent_days    = working_days - present_days
            late_days      = atts.filter(late_minutes__gt=0).count()
            total_late_min = atts.aggregate(total=Sum('late_minutes'))['total'] or 0

            # Payroll
            payroll = Payroll.objects.filter(
                employee=emp, year=year, month=month
            ).first()

            hr_data.append({
                'employee_id':    emp.id,
                'employee_name':  emp.full_name,
                'position':       emp.position.name if emp.position else None,
                'texnikum':       emp.texnikum.name,
                'employment_type': emp.get_employment_type_display(),
                'base_salary':    float(emp.base_salary),

                # Davomat
                'working_days':   working_days,
                'present_days':   present_days,
                'absent_days':    absent_days,
                'late_days':      late_days,
                'total_late_min': total_late_min,
                'att_percent':    round(present_days / working_days * 100, 1) if working_days else 0,

                # Oylik
                'payroll': {
                    'status':       payroll.get_status_display() if payroll else 'Hisoblanmagan',
                    'net_salary':   float(payroll.net_salary) if payroll else None,
                    'late_penalty': float(payroll.late_penalty) if payroll else None,
                    'bonus':        float(payroll.bonus) if payroll else None,
                } if payroll else None,
            })

        # Umumiy statistika
        total_late_all   = sum(e['total_late_min'] for e in hr_data)
        total_penalty    = Payroll.objects.filter(
            year=year, month=month,
            **({'texnikum': texnikum} if texnikum else {})
        ).aggregate(total=Sum('late_penalty'))['total'] or 0

        return Response({
            'period':         f"{year}/{month:02d}",
            'working_days':   working_days,
            'total_employees': len(hr_data),
            'summary': {
                'total_late_minutes': total_late_all,
                'total_penalty_sum':  float(total_penalty),
                'avg_attendance':     round(
                    sum(e['att_percent'] for e in hr_data) / len(hr_data), 1
                ) if hr_data else 0,
            },
            'employees': hr_data,
        })


# ═══════════════════════════════════════════════════════════════
#  FOUNDER — MOLIYA BATAFSIL
#  Xarajatlar, tushum, sof foyda tahlili
# ═══════════════════════════════════════════════════════════════

class FounderFinanceDetailView(APIView):
    """
    GET /api/dashboard/founder/finance/
    Moliyaviy batafsil tahlil.

    Query params:
      ?year=2024
      ?from_date=2024-01-01&to_date=2024-12-31
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounder]

    def get(self, request):
        user     = request.user
        texnikum = user.texnikum if not user.is_superuser else None

        today = date.today()
        year  = int(request.query_params.get('year', today.year))

        from_date = request.query_params.get('from_date')
        to_date   = request.query_params.get('to_date')

        if from_date and to_date:
            date_range = [from_date, to_date]
        else:
            date_range = [date(year, 1, 1), date(year, 12, 31)]

        t_filter = {'texnikum': texnikum} if texnikum else {}

        # ── Tushum (talabalar to'lovlari) ─────────────────────────────
        income_total = Payment.objects.filter(
            date__range=date_range, **t_filter
        ).aggregate(total=Sum('amount'))['total'] or 0

        income_by_month = []
        for m in range(1, 13):
            m_start = date(year, m, 1)
            if m == 12:
                m_end = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                m_end = date(year, m + 1, 1) - timedelta(days=1)

            m_income = Payment.objects.filter(
                date__range=[m_start, m_end], **t_filter
            ).aggregate(total=Sum('amount'))['total'] or 0

            m_expense = Expense.objects.filter(
                date__range=[m_start, m_end], **t_filter
            ).aggregate(total=Sum('amount'))['total'] or 0

            m_payroll = Payroll.objects.filter(
                year=year, month=m,
                **({'texnikum': texnikum} if texnikum else {})
            ).aggregate(total=Sum('net_salary'))['total'] or 0

            income_by_month.append({
                'month':     m,
                'label':     m_start.strftime('%B'),
                'income':    float(m_income),
                'expense':   float(m_expense),
                'payroll':   float(m_payroll),
                'net':       float(m_income) - float(m_expense) - float(m_payroll),
            })

        # ── Xarajatlar ────────────────────────────────────────────────
        expense_total = Expense.objects.filter(
            date__range=date_range, **t_filter
        ).aggregate(total=Sum('amount'))['total'] or 0

        expense_by_category = list(
            Expense.objects.filter(
                date__range=date_range, **t_filter
            ).values('category').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-total')
        )

        # Eng katta xarajatlar
        top_expenses = list(
            Expense.objects.filter(
                date__range=date_range, **t_filter
            ).order_by('-amount').values(
                'id', 'title', 'category', 'amount', 'date'
            )[:10]
        )

        # ── Oylik maoshlar ────────────────────────────────────────────
        payroll_total = Payroll.objects.filter(
            year=year,
            **({'texnikum': texnikum} if texnikum else {})
        ).aggregate(total=Sum('net_salary'))['total'] or 0

        payroll_penalty_total = Payroll.objects.filter(
            year=year,
            **({'texnikum': texnikum} if texnikum else {})
        ).aggregate(total=Sum('late_penalty'))['total'] or 0

        # ── Talabalar qarzdorligi ─────────────────────────────────────
        debt_total = Student.objects.filter(
            is_active=True, **t_filter
        ).aggregate(
            debt=Sum(F('contract_amount') - F('paid_amount'))
        )['debt'] or 0

        # To'lov usullari bo'yicha
        payment_by_method = list(
            Payment.objects.filter(
                date__range=date_range, **t_filter
            ).values('method').annotate(
                total=Sum('amount'), count=Count('id')
            )
        )

        return Response({
            'year':       year,
            'date_range': {'from': str(date_range[0]), 'to': str(date_range[1])},

            'summary': {
                'total_income':         float(income_total),
                'total_expenses':       float(expense_total),
                'total_payroll':        float(payroll_total),
                'total_penalties':      float(payroll_penalty_total),
                'net_profit':           float(income_total) - float(expense_total) - float(payroll_total),
                'total_student_debt':   float(debt_total),
            },

            'income': {
                'total':            float(income_total),
                'by_month':         income_by_month,
                'by_method':        payment_by_method,
            },

            'expenses': {
                'total':            float(expense_total),
                'by_category':      expense_by_category,
                'top_10':           top_expenses,
            },

            'payroll': {
                'total_net':        float(payroll_total),
                'total_penalties':  float(payroll_penalty_total),
            },
        })


# ═══════════════════════════════════════════════════════════════
#  SUPERADMIN — SaaS BOSHQARUV
#  Texnikum qo'shish, obuna, litsenziya
# ═══════════════════════════════════════════════════════════════

class SaaSManagementView(APIView):
    """
    GET  /api/saas/texnikumlar/   — Barcha texnikumlar + obuna holati
    POST /api/saas/texnikumlar/   — Yangi texnikum + founder yaratish
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        today = date.today()

        texnikumlar = Texnikum.objects.all().order_by('-created_at')
        result = []

        for t in texnikumlar:
            founder = CustomUser.objects.filter(
                texnikum=t, role='founder', is_active=True
            ).first()

            days_left = None
            sub_status = 'active'
            if t.subscription_end:
                days_left = (t.subscription_end - today).days
                if days_left < 0:
                    sub_status = 'expired'
                elif days_left <= 7:
                    sub_status = 'critical'
                elif days_left <= 30:
                    sub_status = 'warning'

            result.append({
                'id':               t.id,
                'name':             t.name,
                'address':          t.address,
                'phone':            t.phone,
                'is_active':        t.is_active,
                'subscription_end': str(t.subscription_end) if t.subscription_end else None,
                'days_left':        days_left,
                'sub_status':       sub_status,
                'founder': {
                    'id':       founder.id if founder else None,
                    'username': founder.username if founder else None,
                    'name':     f"{founder.first_name} {founder.last_name}".strip() if founder else None,
                } if founder else None,
                'stats': {
                    'employees': Employee.objects.filter(texnikum=t, is_active=True).count(),
                    'students':  Student.objects.filter(texnikum=t, is_active=True).count(),
                    'groups':    Group.objects.filter(texnikum=t, is_active=True).count(),
                },
                'created_at': t.created_at.strftime('%Y-%m-%d'),
            })

        return Response({
            'total': len(result),
            'active': sum(1 for r in result if r['is_active'] and r['sub_status'] == 'active'),
            'expired': sum(1 for r in result if r['sub_status'] == 'expired'),
            'warning': sum(1 for r in result if r['sub_status'] in ('warning', 'critical')),
            'texnikumlar': result,
        })

    def post(self, request):
        """
        Yangi texnikum + Founder foydalanuvchisini birga yaratish.
        Body:
        {
          "texnikum": {"name": "...", "address": "...", "phone": "...", "subscription_end": "2025-12-31"},
          "founder":  {"username": "...", "password": "...", "first_name": "...", "last_name": "...", "email": "..."}
        }
        """
        from app_texnikum.serializers import TexnikumCreateSerializer
        from users.serializers import UserCreateSerializer

        texnikum_data = request.data.get('texnikum')
        founder_data  = request.data.get('founder')

        if not texnikum_data or not founder_data:
            return Response(
                {"error": "texnikum va founder ma'lumotlari majburiy!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Texnikum yaratish
        t_serializer = TexnikumCreateSerializer(data=texnikum_data)
        if not t_serializer.is_valid():
            return Response({"texnikum_errors": t_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        texnikum = t_serializer.save()

        # Founder yaratish
        founder_data['role']     = 'founder'
        founder_data['texnikum'] = texnikum.id
        founder_data.setdefault('confirm_password', founder_data.get('password'))

        f_serializer = UserCreateSerializer(
            data=founder_data,
            context={'request': request}
        )
        if not f_serializer.is_valid():
            texnikum.delete()  # Rollback
            return Response({"founder_errors": f_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        founder = f_serializer.save()

        AdminLog.objects.create(
            user=request.user,
            action_type='create',
            action=f"Yangi texnikum yaratildi: {texnikum.name} | Founder: {founder.username}",
        )

        return Response({
            "success": f"'{texnikum.name}' texnikumi va '{founder.username}' founder yaratildi!",
            "texnikum_id": texnikum.id,
            "founder_id":  founder.id,
        }, status=status.HTTP_201_CREATED)


class SaaSSubscriptionUpdateView(APIView):
    """
    PUT /api/saas/texnikumlar/<id>/subscription/
    Texnikum obunasini yangilash yoki to'xtatish.
    Body: {"subscription_end": "2025-12-31", "is_active": true}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def put(self, request, texnikum_id):
        try:
            texnikum = Texnikum.objects.get(pk=texnikum_id)
        except Texnikum.DoesNotExist:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        subscription_end = request.data.get('subscription_end')
        is_active        = request.data.get('is_active')

        old_sub = texnikum.subscription_end
        old_active = texnikum.is_active

        if subscription_end:
            from datetime import datetime
            texnikum.subscription_end = datetime.strptime(subscription_end, '%Y-%m-%d').date()
        if is_active is not None:
            texnikum.is_active = is_active

        texnikum.save()

        AdminLog.objects.create(
            user=request.user,
            action_type='update',
            action=(
                f"Texnikum obunasi yangilandi: {texnikum.name} | "
                f"Obuna: {old_sub} → {texnikum.subscription_end} | "
                f"Holat: {old_active} → {texnikum.is_active}"
            ),
        )

        return Response({
            "success": f"'{texnikum.name}' obunasi yangilandi!",
            "subscription_end": str(texnikum.subscription_end),
            "is_active": texnikum.is_active,
            "days_left": (texnikum.subscription_end - date.today()).days if texnikum.subscription_end else None,
        })