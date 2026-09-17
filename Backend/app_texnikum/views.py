from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import date, datetime, timedelta
from math import radians, sin, cos, sqrt, atan2

from django.contrib.auth.hashers import make_password

from users.models import CustomUser
from users.permissions import IsSuperAdmin, IsSuperAdminOrFounder
from users.models import AdminLog
from .models import Texnikum


from .models import (
    Texnikum, Department, Position,
    Employee, EmployeeStatus, EmployeeAttendance,
    Payroll, Expense
)
from .serializers import (
    TexnikumSerializer, TexnikumCreateSerializer,
    DepartmentSerializer, PositionSerializer,
    EmployeeSerializer, EmployeeCreateSerializer,
    EmployeeStatusSerializer,
    EmployeeAttendanceSerializer, AttendanceCheckInSerializer,
    PayrollSerializer, PayrollApproveSerializer,
    ExpenseSerializer, ExpenseSummarySerializer,
)
from users.permissions import (
    IsSuperAdmin,
    IsSuperAdminOrFounder,
    IsSuperAdminOrFounderOrDirector,
    IsDirectorOrCenterAdmin,
    IsTeacherOrCenterAdmin,
    IsStaff,
)
from users.models import AdminLog


# ─────────────────────────────────────────────
#  YORDAMCHI FUNKSIYALAR
# ─────────────────────────────────────────────
def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Haversin formulasi — ikkita GPS nuqta orasidagi masofa (metrda).
    """
    R = 6371000  # Yer radiusi (metr)
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c  # metrda


def get_today_schedule(employee):
    """
    Xodimning bugungi ish jadvalini qaytaradi.
    Return: {"day": "Dushanba", "from": "08:00", "to": "17:00"} yoki None
    """
    if not employee.schedule:
        return None
    weekday_names = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
    today_name = weekday_names[date.today().weekday()]
    return next((item for item in employee.schedule if item.get("day") == today_name), None)


def calculate_late_minutes(arrival_time, schedule_start_str):
    """Kechikkan daqiqalarni hisoblash."""
    schedule_start = datetime.strptime(schedule_start_str, "%H:%M").time()
    if arrival_time > schedule_start:
        delta = datetime.combine(date.today(), arrival_time) - datetime.combine(date.today(), schedule_start)
        return int(delta.total_seconds() / 60)
    return 0


# ─────────────────────────────────────────────
#  TEXNIKUM VIEWS
# ─────────────────────────────────────────────
class TexnikumListCreateView(APIView):
    """
    GET  /api/texnikum/          → SuperAdmin barcha, boshqalar faqat o'ziniki
    POST /api/texnikum/          → Faqat SuperAdmin
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_superuser or user.role == 'superadmin':
            queryset = Texnikum.objects.all()
        elif user.texnikum:
            queryset = Texnikum.objects.filter(id=user.texnikum.id)
        else:
            return Response({"error": "Texnikum topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TexnikumSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not (request.user.is_superuser or request.user.role == 'superadmin'):
            return Response({"error": "Faqat SuperAdmin texnikum yarata oladi!"}, status=status.HTTP_403_FORBIDDEN)

        serializer = TexnikumCreateSerializer(data=request.data)
        if serializer.is_valid():
            texnikum = serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='create',
                action=f"Yangi texnikum yaratildi: {texnikum.name}"
            )
            return Response(TexnikumSerializer(texnikum).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TexnikumDetailView(APIView):
    """
    GET    /api/texnikum/<id>/   → ko'rish
    PUT    /api/texnikum/<id>/   → yangilash (SuperAdmin yoki Founder)
    DELETE /api/texnikum/<id>/   → o'chirish (faqat SuperAdmin)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounder]

    def get_object(self, pk, user):
        try:
            texnikum = Texnikum.objects.get(pk=pk)
        except Texnikum.DoesNotExist:
            return None
        if not (user.is_superuser or user.role == 'superadmin') and user.texnikum != texnikum:
            return None
        return texnikum

    def get(self, request, pk):
        texnikum = self.get_object(pk, request.user)
        if not texnikum:
            return Response({"error": "Topilmadi yoki ruxsat yo'q!"}, status=status.HTTP_404_NOT_FOUND)
        return Response(TexnikumSerializer(texnikum).data)

    def put(self, request, pk):
        texnikum = self.get_object(pk, request.user)
        if not texnikum:
            return Response({"error": "Topilmadi yoki ruxsat yo'q!"}, status=status.HTTP_404_NOT_FOUND)
        serializer = TexnikumSerializer(texnikum, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='update',
                action=f"Texnikum yangilandi: {texnikum.name}",
                texnikum=texnikum
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not (request.user.is_superuser or request.user.role == 'superadmin'):
            return Response({"error": "Faqat SuperAdmin o'chira oladi!"}, status=status.HTTP_403_FORBIDDEN)
        texnikum = self.get_object(pk, request.user)
        if not texnikum:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        name = texnikum.name
        texnikum.delete()
        AdminLog.objects.create(
            user=request.user, action_type='delete',
            action=f"Texnikum o'chirildi: {name}"
        )
        return Response({"success": f"'{name}' o'chirildi!"})


# ─────────────────────────────────────────────
#  DEPARTMENT va POSITION
# ─────────────────────────────────────────────
class DepartmentListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get(self, request):
        user = request.user
        if user.is_superuser or user.role == 'superadmin':
            qs = Department.objects.all()
        else:
            qs = Department.objects.filter(texnikum=user.texnikum)
        serializer = DepartmentSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PositionListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get(self, request):
        user = request.user
        if user.is_superuser or user.role == 'superadmin':
            qs = Position.objects.all()
        else:
            qs = Position.objects.filter(texnikum=user.texnikum)
        serializer = PositionSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PositionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  EMPLOYEE VIEWS
# ─────────────────────────────────────────────
class EmployeeListCreateView(APIView):
    """
    GET  /api/employees/         → Xodimlar ro'yxati
    POST /api/employees/         → Yangi xodim qo'shish (Director)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get(self, request):
        user = request.user
        if user.is_superuser or user.role == 'superadmin':
            qs = Employee.objects.all()
        else:
            qs = Employee.objects.filter(texnikum=user.texnikum)

        # Filterlash
        department = request.query_params.get('department')
        is_active  = request.query_params.get('is_active')
        search     = request.query_params.get('search')
        if department:
            qs = qs.filter(department_id=department)
        if is_active is not None:
            qs = qs.filter(is_active=is_active == 'true')
        if search:
            qs = qs.filter(full_name__icontains=search)

        serializer = EmployeeSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        serializer = EmployeeCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            employee = serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='create',
                action=f"Yangi xodim qo'shildi: {employee.full_name}",
                texnikum=employee.texnikum
            )
            return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get_object(self, pk, user):
        try:
            emp = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return None
        if not (user.is_superuser or user.role == 'superadmin') and emp.texnikum != user.texnikum:
            return None
        return emp

    def get(self, request, pk):
        emp = self.get_object(pk, request.user)
        if not emp:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        return Response(EmployeeSerializer(emp).data)

    def put(self, request, pk):
        emp = self.get_object(pk, request.user)
        if not emp:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        serializer = EmployeeSerializer(emp, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='update',
                action=f"Xodim yangilandi: {emp.full_name}", texnikum=emp.texnikum
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        emp = self.get_object(pk, request.user)
        if not emp:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        emp.is_active = False
        emp.save()
        AdminLog.objects.create(
            user=request.user, action_type='delete',
            action=f"Xodim o'chirildi (arxivlandi): {emp.full_name}", texnikum=emp.texnikum
        )
        return Response({"success": f"{emp.full_name} arxivlandi!"})


# ─────────────────────────────────────────────
#  EMPLOYEE STATUS
# ─────────────────────────────────────────────
class EmployeeStatusListCreateView(APIView):
    """
    GET  /api/employee-statuses/?employee=<id>
    POST /api/employee-statuses/
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsDirectorOrCenterAdmin]

    def get(self, request):
        user = request.user
        qs = EmployeeStatus.objects.filter(employee__texnikum=user.texnikum)
        employee_id = request.query_params.get('employee')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        serializer = EmployeeStatusSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EmployeeStatusSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            obj = serializer.save()
            return Response(EmployeeStatusSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  DAVOMAT — CHECK IN / CHECK OUT
# ─────────────────────────────────────────────
class EmployeeCheckInView(APIView):
    """
    POST /api/attendance/check-in/
    Body: {"latitude": 41.123, "longitude": 69.456}

    GPS 100m radius ichida bo'lsa → qabul qilinadi.
    Kechikish avtomatik hisoblanadi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def post(self, request):
        serializer = AttendanceCheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        lat  = serializer.validated_data['latitude']
        lon  = serializer.validated_data['longitude']
        today = date.today()

        # Xodim profilini topish
        try:
            employee = user.employee_profile
        except Exception:
            return Response({"error": "Xodim profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        # Allaqachon kelganmi?
        if EmployeeAttendance.objects.filter(employee=employee, date=today, arrival_time__isnull=False).exists():
            return Response({"error": "Siz bugun allaqachon kelish davomatini o'tdingiz!"}, status=status.HTTP_400_BAD_REQUEST)

        # Xodim holati (ta'til, kasallik...)
        active_status = EmployeeStatus.get_active_status(employee, today)
        if active_status:
            return Response({
                "error": f"Siz bugun '{active_status.get_status_display()}' statusidasiz. Davomat kerak emas!"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Texnikum GPS tekshiruvi
        texnikum = employee.texnikum
        if not texnikum.latitude or not texnikum.longitude:
            return Response({"error": "Texnikum GPS koordinatalari kiritilmagan!"}, status=status.HTTP_400_BAD_REQUEST)

        distance = calculate_distance(lat, lon, texnikum.latitude, texnikum.longitude)
        radius   = texnikum.gps_radius  # default 100 metr

        if distance > radius:
            return Response({
                "error": f"Siz texnikum hududida emassiz! Masofa: {distance:.0f} metr (limit: {radius} metr)"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Bugungi jadval
        today_schedule = get_today_schedule(employee)
        if not today_schedule:
            return Response({"error": "Bugun ish kuni emas!"}, status=status.HTTP_400_BAD_REQUEST)

        # Kechikishni hisoblash
        now_time     = timezone.localtime(timezone.now()).time()
        late_minutes = calculate_late_minutes(now_time, today_schedule['from'])

        # Status aniqlash
        if late_minutes == 0:
            att_status = "O'z vaqtida keldi"
        else:
            att_status = f"Kechikdi — {late_minutes} daqiqa"

        # Davomat yozuvi yaratish
        attendance = EmployeeAttendance.objects.create(
            employee=employee,
            texnikum=texnikum,
            date=today,
            arrival_time=now_time,
            arrival_latitude=lat,
            arrival_longitude=lon,
            arrival_distance=round(distance, 2),
            arrival_type='gps',
            late_minutes=late_minutes,
            status=att_status,
            employee_status='ISHDA'
        )

        return Response({
            "success": f"Kelish davomati qabul qilindi!",
            "time": str(now_time.strftime('%H:%M')),
            "status": att_status,
            "late_minutes": late_minutes,
            "distance_to_texnikum": f"{distance:.0f} metr"
        }, status=status.HTTP_201_CREATED)


class EmployeeCheckOutView(APIView):
    """
    POST /api/attendance/check-out/
    Body: {"latitude": 41.123, "longitude": 69.456}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def post(self, request):
        serializer = AttendanceCheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        lat  = serializer.validated_data['latitude']
        lon  = serializer.validated_data['longitude']
        today = date.today()

        try:
            employee = user.employee_profile
        except Exception:
            return Response({"error": "Xodim profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        # Bugun kelganmi?
        attendance = EmployeeAttendance.objects.filter(
            employee=employee, date=today, arrival_time__isnull=False
        ).first()
        if not attendance:
            return Response({"error": "Avval kelish davomatini o'ting!"}, status=status.HTTP_400_BAD_REQUEST)

        # Allaqachon ketganmi?
        if attendance.departure_time:
            return Response({"error": "Siz bugun allaqachon ketish davomatini o'tdingiz!"}, status=status.HTTP_400_BAD_REQUEST)

        # GPS tekshiruv
        texnikum = employee.texnikum
        if texnikum.latitude and texnikum.longitude:
            distance = calculate_distance(lat, lon, texnikum.latitude, texnikum.longitude)
            if distance > texnikum.gps_radius:
                return Response({
                    "error": f"Siz texnikum hududida emassiz! Masofa: {distance:.0f} metr"
                }, status=status.HTTP_400_BAD_REQUEST)

        # Erta ketishni tekshirish
        today_schedule = get_today_schedule(employee)
        now_time = timezone.localtime(timezone.now()).time()
        early_leave_minutes = 0

        if today_schedule:
            schedule_end = datetime.strptime(today_schedule['to'], "%H:%M").time()
            if now_time < schedule_end:
                end_dt  = datetime.combine(today, schedule_end)
                now_dt  = datetime.combine(today, now_time)
                early_leave_minutes = int((end_dt - now_dt).total_seconds() / 60)

        attendance.departure_time       = now_time
        attendance.departure_latitude   = lat
        attendance.departure_longitude  = lon
        attendance.departure_type       = 'gps'
        attendance.early_leave_minutes  = early_leave_minutes
        attendance.save()

        msg = "Ketish davomati qabul qilindi!"
        if early_leave_minutes > 0:
            msg += f" Erta ketdingiz: {early_leave_minutes} daqiqa."

        return Response({
            "success": msg,
            "time": str(now_time.strftime('%H:%M')),
            "early_leave_minutes": early_leave_minutes
        }, status=status.HTTP_200_OK)


class ManualAttendanceView(APIView):
    """
    POST /api/attendance/manual/
    Director/CenterAdmin tomonidan xodimni qo'lda davomat qilish.
    Body: {"employee_id": 5, "arrival_time": "08:00", "departure_time": "17:00", "date": "2024-01-15"}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsDirectorOrCenterAdmin]

    def post(self, request):
        employee_id    = request.data.get('employee_id')
        arrival_time   = request.data.get('arrival_time')
        departure_time = request.data.get('departure_time')
        target_date    = request.data.get('date', str(date.today()))

        if not employee_id or not arrival_time:
            return Response({"error": "employee_id va arrival_time majburiy!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            employee = Employee.objects.get(pk=employee_id, texnikum=request.user.texnikum)
        except Employee.DoesNotExist:
            return Response({"error": "Xodim topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        try:
            target_date_obj = datetime.strptime(target_date, '%Y-%m-%d').date()
            arrival_time_obj = datetime.strptime(arrival_time, '%H:%M').time()
            departure_time_obj = datetime.strptime(departure_time, '%H:%M').time() if departure_time else None
        except ValueError:
            return Response({"error": "Vaqt formati noto'g'ri! (HH:MM) va sana (YYYY-MM-DD) bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)

        # Allaqachon mavjudmi?
        attendance, created = EmployeeAttendance.objects.get_or_create(
            employee=employee, date=target_date_obj,
            defaults={
                'texnikum': employee.texnikum,
                'arrival_time': arrival_time_obj,
                'departure_time': departure_time_obj,
                'arrival_type': 'manual',
                'departure_type': 'manual' if departure_time_obj else None,
                'status': "Qo'lda kiritildi (Admin)",
                'employee_status': 'ISHDA'
            }
        )
        if not created:
            # Mavjud yozuvni yangilash
            attendance.arrival_time    = arrival_time_obj
            attendance.departure_time  = departure_time_obj
            attendance.arrival_type    = 'manual'
            attendance.status          = "Qo'lda yangilandi (Admin)"
            attendance.save()

        AdminLog.objects.create(
            user=request.user, action_type='create',
            action=f"Qo'lda davomat: {employee.full_name} — {target_date}",
            texnikum=employee.texnikum
        )
        return Response({
            "success": f"{employee.full_name} davomati {'yaratildi' if created else 'yangilandi'}!",
            "date": target_date, "arrival_time": arrival_time
        }, status=status.HTTP_201_CREATED)


class AttendanceListView(APIView):
    """
    GET /api/attendance/
    Query params:
      ?employee=<id>
      ?today=1 | ?weekly=1 | ?monthly=1 | ?yearly=1
      ?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        user = request.user
        today = date.today()

        # Base queryset — texnikum bo'yicha cheklash
        if user.is_superuser or user.role == 'superadmin':
            qs = EmployeeAttendance.objects.all()
        elif user.role in ('founder', 'director', 'center_admin'):
            qs = EmployeeAttendance.objects.filter(texnikum=user.texnikum)
        elif user.role == 'teacher':
            # O'qituvchi faqat o'z davomatini ko'radi
            try:
                employee = user.employee_profile
                qs = EmployeeAttendance.objects.filter(employee=employee)
            except Exception:
                return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        # Filterlash
        employee_id = request.query_params.get('employee')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        # Sana filterlash
        if request.query_params.get('today'):
            qs = qs.filter(date=today)
        elif request.query_params.get('weekly'):
            start = today - timedelta(days=today.weekday())
            qs = qs.filter(date__range=[start, start + timedelta(days=6)])
        elif request.query_params.get('monthly'):
            qs = qs.filter(date__year=today.year, date__month=today.month)
        elif request.query_params.get('yearly'):
            qs = qs.filter(date__year=today.year)
        else:
            from_date = request.query_params.get('from_date')
            to_date   = request.query_params.get('to_date')
            if from_date and to_date:
                qs = qs.filter(date__range=[from_date, to_date])

        serializer = EmployeeAttendanceSerializer(qs.order_by('-date'), many=True)
        return Response({"count": qs.count(), "results": serializer.data})


class MyAttendanceView(APIView):
    """
    GET /api/attendance/my/
    Faqat o'z davomati (barcha xodimlar uchun).
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        try:
            employee = request.user.employee_profile
        except Exception:
            return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()

        if request.query_params.get('today'):
            qs = EmployeeAttendance.objects.filter(employee=employee, date=today)
        elif request.query_params.get('weekly'):
            start = today - timedelta(days=today.weekday())
            qs = EmployeeAttendance.objects.filter(employee=employee, date__range=[start, start + timedelta(days=6)])
        elif request.query_params.get('monthly'):
            qs = EmployeeAttendance.objects.filter(employee=employee, date__year=today.year, date__month=today.month)
        elif request.query_params.get('yearly'):
            qs = EmployeeAttendance.objects.filter(employee=employee, date__year=today.year)
        else:
            qs = EmployeeAttendance.objects.filter(employee=employee).order_by('-date')[:30]

        serializer = EmployeeAttendanceSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})


class EmployeeMeView(APIView):
    """GET /api/employees/me/ — tizimga kirgan xodimning profili."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        try:
            employee = request.user.employee_profile
        except Exception:
            return Response({"error": "Xodim profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        return Response(EmployeeSerializer(employee).data)


# ─────────────────────────────────────────────
#  PAYROLL VIEWS
# ─────────────────────────────────────────────
class PayrollListView(APIView):
    """
    GET /api/payroll/
    Director → o'z texnikumidagi barcha payrollar
    Teacher  → faqat o'ziniki
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        user = request.user
        today = date.today()

        if user.is_superuser or user.role == 'superadmin':
            qs = Payroll.objects.all()
        elif user.role in ('founder', 'director', 'center_admin'):
            qs = Payroll.objects.filter(texnikum=user.texnikum)
        elif user.role == 'teacher':
            try:
                employee = user.employee_profile
                qs = Payroll.objects.filter(employee=employee)
            except Exception:
                return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        # Filterlash
        year  = request.query_params.get('year', today.year)
        month = request.query_params.get('month')
        emp   = request.query_params.get('employee')
        pstat = request.query_params.get('status')

        qs = qs.filter(year=year)
        if month:
            qs = qs.filter(month=month)
        if emp:
            qs = qs.filter(employee_id=emp)
        if pstat:
            qs = qs.filter(status=pstat)

        serializer = PayrollSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})


class MyPayrollView(APIView):
    """GET /api/payroll/my/ — xodimning faqat o'z oyliklari."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        try:
            employee = request.user.employee_profile
        except Exception:
            return Response({"error": "Xodim profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        qs = Payroll.objects.filter(employee=employee)
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        if year:
            qs = qs.filter(year=year)
        if month:
            qs = qs.filter(month=month)
        serializer = PayrollSerializer(qs.order_by('-year', '-month'), many=True)
        return Response({"count": qs.count(), "results": serializer.data})


class PayrollApproveView(APIView):
    """
    POST /api/payroll/<id>/approve/
    Faqat Director tasdiqlaydi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def post(self, request, pk):
        try:
            payroll = Payroll.objects.get(pk=pk, texnikum=request.user.texnikum)
        except Payroll.DoesNotExist:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        if payroll.status != 'draft':
            return Response({"error": "Bu oylik allaqachon tasdiqlangan!"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PayrollApproveSerializer(data=request.data)
        if serializer.is_valid():
            payroll.status      = 'approved'
            payroll.approved_by = request.user
            payroll.approved_at = timezone.now()
            payroll.note        = serializer.validated_data.get('note', '')
            payroll.save()

            AdminLog.objects.create(
                user=request.user, action_type='update',
                action=f"Oylik tasdiqlandi: {payroll.employee.full_name} — {payroll.year}/{payroll.month:02d}",
                texnikum=request.user.texnikum
            )
            return Response(PayrollSerializer(payroll).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  EXPENSE VIEWS
# ─────────────────────────────────────────────
class ExpenseListCreateView(APIView):
    """
    GET  /api/expenses/
    POST /api/expenses/
    Director kiritadi, Founder ko'radi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get(self, request):
        user  = request.user
        today = date.today()

        if user.is_superuser or user.role == 'superadmin':
            qs = Expense.objects.all()
        else:
            qs = Expense.objects.filter(texnikum=user.texnikum)

        # Filterlash
        category   = request.query_params.get('category')
        from_date  = request.query_params.get('from_date')
        to_date    = request.query_params.get('to_date')
        year       = request.query_params.get('year')
        month      = request.query_params.get('month')

        if category:
            qs = qs.filter(category=category)
        if from_date and to_date:
            qs = qs.filter(date__range=[from_date, to_date])
        if year:
            qs = qs.filter(date__year=year)
        if month:
            qs = qs.filter(date__month=month)

        # Jami
        total = qs.aggregate(total=Sum('amount'))['total'] or 0

        serializer = ExpenseSerializer(qs, many=True)
        return Response({
            "total_amount": total,
            "count": qs.count(),
            "results": serializer.data
        })

    def post(self, request):
        if request.user.role not in ('superadmin', 'director') and not request.user.is_superuser:
            return Response({"error": "Faqat Direktor xarajat kirita oladi!"}, status=status.HTTP_403_FORBIDDEN)
        serializer = ExpenseSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            expense = serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='create',
                action=f"Xarajat kiritildi: {expense.title} — {expense.amount} so'm",
                texnikum=expense.texnikum
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExpenseDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get_object(self, pk, user):
        try:
            exp = Expense.objects.get(pk=pk)
        except Expense.DoesNotExist:
            return None
        if not (user.is_superuser or user.role == 'superadmin') and exp.texnikum != user.texnikum:
            return None
        return exp

    def get(self, request, pk):
        exp = self.get_object(pk, request.user)
        if not exp:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ExpenseSerializer(exp).data)

    def put(self, request, pk):
        exp = self.get_object(pk, request.user)
        if not exp:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ExpenseSerializer(exp, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        exp = self.get_object(pk, request.user)
        if not exp:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        title = exp.title
        exp.delete()
        AdminLog.objects.create(
            user=request.user, action_type='delete',
            action=f"Xarajat o'chirildi: {title}", texnikum=request.user.texnikum
        )
        return Response({"success": f"'{title}' o'chirildi!"})


# ─────────────────────────────────────────────
#  STATISTIKA / DASHBOARD
# ─────────────────────────────────────────────
class DirectorDashboardView(APIView):
    """
    GET /api/dashboard/director/
    Bugungi umumiy holat: kelganlar, kelmaganlar, xarajatlar.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get(self, request):
        user  = request.user
        today = date.today()

        if user.is_superuser or user.role == 'superadmin':
            texnikum_filter = {}
        else:
            texnikum_filter = {'texnikum': user.texnikum}

        total_employees   = Employee.objects.filter(is_active=True, **texnikum_filter).count()
        present_today     = EmployeeAttendance.objects.filter(
            date=today, arrival_time__isnull=False, **texnikum_filter
        ).count()
        absent_today      = total_employees - present_today
        late_today        = EmployeeAttendance.objects.filter(
            date=today, late_minutes__gt=0, **texnikum_filter
        ).count()

        # Joriy oy xarajatlari
        monthly_expenses  = Expense.objects.filter(
            date__year=today.year, date__month=today.month, **texnikum_filter
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Kutilayotgan oyliklar
        pending_payrolls  = Payroll.objects.filter(
            status='draft', year=today.year, month=today.month, **texnikum_filter
        ).count()

        return Response({
            "date": str(today),
            "total_employees": total_employees,
            "present_today": present_today,
            "absent_today": absent_today,
            "late_today": late_today,
            "attendance_percent": round(present_today / total_employees * 100, 1) if total_employees else 0,
            "monthly_expenses": monthly_expenses,
            "pending_payrolls": pending_payrolls,
        })
        
        




# ─────────────────────────────────────────────────────────────────────────────
#  TEXNIKUM OBUNA (alohida endpoint)
# ─────────────────────────────────────────────────────────────────────────────
class TexnikumSubscriptionView(APIView):
    """
    PUT /api/texnikum/<pk>/subscription/
    Faqat obuna va is_active ni yangilash.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated, IsSuperAdmin]

    def put(self, request, pk):
        try:
            texnikum = Texnikum.objects.get(pk=pk)
        except Texnikum.DoesNotExist:
            return Response({"error": "Texnikum topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        subscription_end = request.data.get("subscription_end")
        is_active        = request.data.get("is_active")

        if subscription_end:
            texnikum.subscription_end = subscription_end
        if is_active is not None:
            texnikum.is_active = is_active

        texnikum.save()

        AdminLog.objects.create(
            user=request.user,
            action_type="update",
            action=f"Texnikum obunasi yangilandi: {texnikum.name}",
        )

        return Response({
            "success": "Obuna yangilandi!",
            "subscription_end": str(texnikum.subscription_end),
            "is_active": texnikum.is_active,
        })


# ─────────────────────────────────────────────────────────────────────────────
#  TEXNIKUM FOYDALANUVCHILARI
# ─────────────────────────────────────────────────────────────────────────────
def user_to_dict(user):
    """CustomUser ni dict ga aylantirish."""
    return {
        "id":         user.id,
        "username":   user.username,
        "first_name": user.first_name,
        "last_name":  user.last_name,
        "email":      user.email,
        "role":       user.role,
        "is_active":  user.is_active,
        "texnikum":   user.texnikum_id,
    }


class TexnikumUsersListView(APIView):
    """
    GET /api/texnikum/<pk>/users/
    Texnikumdagi barcha foydalanuvchilar (founder, director, center_admin).
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated, IsSuperAdminOrFounder]

    def get(self, request, pk):
        try:
            texnikum = Texnikum.objects.get(pk=pk)
        except Texnikum.DoesNotExist:
            return Response({"error": "Texnikum topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        # Ruxsat tekshiruvi
        user = request.user
        if not (user.is_superuser or user.role == "superadmin"):
            if user.texnikum_id != texnikum.id:
                return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        users = CustomUser.objects.filter(
            texnikum=texnikum,
            role__in=["founder", "director", "center_admin"]
        ).order_by("role", "last_name")

        return Response([user_to_dict(u) for u in users])


class TexnikumUserCreateView(APIView):
    """
    POST /api/texnikum/<pk>/users/create/
    Yangi user yaratib texnikumga biriktirish.
    Body: {role, username, password, first_name, last_name, email}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        try:
            texnikum = Texnikum.objects.get(pk=pk)
        except Texnikum.DoesNotExist:
            return Response({"error": "Texnikum topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        data       = request.data
        role       = data.get("role")
        username   = data.get("username", "").strip()
        password   = data.get("password", "")
        first_name = data.get("first_name", "").strip()
        last_name  = data.get("last_name", "").strip()
        email      = data.get("email", "").strip()

        # Validatsiya
        errors = {}
        if not role or role not in ("director", "center_admin"):
            errors["role"] = ["Rol director yoki center_admin bo'lishi kerak!"]
        if not username:
            errors["username"] = ["Login majburiy!"]
        elif CustomUser.objects.filter(username=username).exists():
            errors["username"] = ["Bu login allaqachon band!"]
        if not password or len(password) < 8:
            errors["password"] = ["Parol kamida 8 ta belgi bo'lishi kerak!"]
        if not first_name:
            errors["first_name"] = ["Ism majburiy!"]
        if not last_name:
            errors["last_name"] = ["Familiya majburiy!"]
        if email and CustomUser.objects.filter(email=email).exists():
            errors["email"] = ["Bu email allaqachon band!"]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # User yaratish
        user = CustomUser.objects.create(
            username=username,
            password=make_password(password),
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=role,
            texnikum=texnikum,
            is_active=True,
        )

        AdminLog.objects.create(
            user=request.user,
            action_type="create",
            action=f"Yangi {role} yaratildi: {last_name} {first_name} (@{username})",
            texnikum=texnikum,
        )

        return Response(user_to_dict(user), status=status.HTTP_201_CREATED)


class TexnikumUserAssignView(APIView):
    """
    POST /api/texnikum/<pk>/users/assign/
    Mavjud userni texnikumga biriktirish.
    Body: {user_id, role}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        try:
            texnikum = Texnikum.objects.get(pk=pk)
        except Texnikum.DoesNotExist:
            return Response({"error": "Texnikum topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        user_id = request.data.get("user_id")
        role    = request.data.get("role")

        if not user_id:
            return Response({"error": "user_id majburiy!"}, status=status.HTTP_400_BAD_REQUEST)
        if not role or role not in ("director", "center_admin"):
            return Response({"role": ["Rol director yoki center_admin bo'lishi kerak!"]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Foydalanuvchi topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        user.texnikum = texnikum
        user.role     = role
        user.save()

        AdminLog.objects.create(
            user=request.user,
            action_type="update",
            action=f"User texnikumga biriktirildi: @{user.username} → {texnikum.name} ({role})",
            texnikum=texnikum,
        )

        return Response(user_to_dict(user))


class TexnikumUserDetailView(APIView):
    """
    PUT    /api/texnikum/<pk>/users/<user_pk>/  — tahrirlash
    DELETE /api/texnikum/<pk>/users/<user_pk>/  — texnikumdan chiqarish
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated, IsSuperAdmin]

    def get_user(self, pk, user_pk):
        try:
            texnikum = Texnikum.objects.get(pk=pk)
        except Texnikum.DoesNotExist:
            return None, None, "Texnikum topilmadi!"
        try:
            user = CustomUser.objects.get(pk=user_pk, texnikum=texnikum)
        except CustomUser.DoesNotExist:
            return None, None, "Foydalanuvchi topilmadi!"
        return texnikum, user, None

    def put(self, request, pk, user_pk):
        texnikum, user, err = self.get_user(pk, user_pk)
        if err:
            return Response({"error": err}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        errors = {}

        first_name = data.get("first_name", user.first_name).strip()
        last_name  = data.get("last_name",  user.last_name).strip()
        email      = data.get("email",      user.email).strip()
        role       = data.get("role",       user.role)
        is_active  = data.get("is_active",  user.is_active)

        if not first_name:
            errors["first_name"] = ["Ism majburiy!"]
        if not last_name:
            errors["last_name"] = ["Familiya majburiy!"]
        if role not in ("director", "center_admin"):
            errors["role"] = ["Rol director yoki center_admin bo'lishi kerak!"]
        if email and email != user.email and CustomUser.objects.filter(email=email).exclude(pk=user.pk).exists():
            errors["email"] = ["Bu email allaqachon band!"]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user.first_name = first_name
        user.last_name  = last_name
        user.email      = email
        user.role       = role
        user.is_active  = is_active
        user.save()

        AdminLog.objects.create(
            user=request.user,
            action_type="update",
            action=f"User yangilandi: @{user.username}",
            texnikum=texnikum,
        )

        return Response(user_to_dict(user))

    def delete(self, request, pk, user_pk):
        texnikum, user, err = self.get_user(pk, user_pk)
        if err:
            return Response({"error": err}, status=status.HTTP_404_NOT_FOUND)

        username = user.username
        # Texnikumdan chiqaramiz (o'chirmaydi — faqat texnikum va rolni tozalaymiz)
        user.texnikum  = None
        user.role      = "teacher"   # default rol
        user.is_active = False
        user.save()

        AdminLog.objects.create(
            user=request.user,
            action_type="delete",
            action=f"User texnikumdan chiqarildi: @{username}",
            texnikum=texnikum,
        )

        return Response({"success": f"@{username} texnikumdan chiqarildi!"})


class UnassignedUsersView(APIView):
    """
    GET /api/texnikum/users/unassigned/
    Hech qaysi texnikumga biriktirilmagan userlar (mavjuddan tanlash uchun).
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        users = CustomUser.objects.filter(
            texnikum__isnull=True,
            is_active=True,
            role__in=("director", "center_admin", "teacher"),  # faqat mana shular biriktirilishi mumkin
        ).order_by("last_name")

        return Response([user_to_dict(u) for u in users])
