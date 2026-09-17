from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from django.db.models import Count, Q, Sum
from datetime import date, datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
from django.db import models

from .models import (
    Subject, Room, Group, Student, Payment,
    Lesson, StudentAttendance, Grade, Notification
)
from .serializers import (
    SubjectSerializer, RoomSerializer,
    GroupSerializer, GroupDetailSerializer,
    StudentSerializer, StudentCreateSerializer, StudentShortSerializer,
    PaymentSerializer,
    LessonSerializer,
    StudentAttendanceSerializer, StudentCheckInSerializer,
    BulkAttendanceSerializer,
    GradeSerializer,
    NotificationSerializer,
    StudentAttendanceSummarySerializer,
)
from app_texnikum.models import Employee
from users.models import AdminLog
from users.permissions import (
    IsSuperAdminOrFounderOrDirector,
    IsDirectorOrCenterAdmin,
    IsTeacherOrCenterAdmin,
    IsStaff,
    IsStudent,
)


# ─────────────────────────────────────────────
#  YORDAMCHI FUNKSIYA
# ─────────────────────────────────────────────
def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversin formulasi — metrda."""
    R = 6371000
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def get_status_color(att_status):
    """Davomat holati rangini qaytaradi."""
    color_map = {
        'present':    'green',
        'late':       'yellow',
        'absent':     'red',
        'excused':    'blue',
        'left_early': 'orange',
    }
    return color_map.get(att_status, 'gray')


# ─────────────────────────────────────────────
#  SUBJECT va ROOM
# ─────────────────────────────────────────────
class SubjectListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsDirectorOrCenterAdmin]

    def get(self, request):
        user = request.user
        if user.is_superuser or user.role == 'superadmin':
            qs = Subject.objects.all()
        else:
            qs = Subject.objects.filter(texnikum=user.texnikum)
        serializer = SubjectSerializer(qs.filter(is_active=True), many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SubjectSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsDirectorOrCenterAdmin]

    def get(self, request):
        user = request.user
        if user.is_superuser or user.role == 'superadmin':
            qs = Room.objects.all()
        else:
            qs = Room.objects.filter(texnikum=user.texnikum)
        serializer = RoomSerializer(qs.filter(is_active=True), many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RoomSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  GURUH VIEWS
# ─────────────────────────────────────────────
class GroupListCreateView(APIView):
    """
    GET  /api/groups/        → Guruhlar ro'yxati
    POST /api/groups/        → Yangi guruh yaratish (CenterAdmin)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.role == 'superadmin':
            qs = Group.objects.all()
        elif user.role in ('founder', 'director', 'center_admin'):
            qs = Group.objects.filter(texnikum=user.texnikum)
        elif user.role == 'teacher':
            # O'qituvchi faqat o'z guruhlarini ko'radi
            try:
                employee = user.employee_profile
                qs = Group.objects.filter(teacher=employee, texnikum=user.texnikum)
            except Exception:
                return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        # Filterlash
        is_active  = request.query_params.get('is_active')
        department = request.query_params.get('department')
        search     = request.query_params.get('search')
        if is_active is not None:
            qs = qs.filter(is_active=is_active == 'true')
        if department:
            qs = qs.filter(department_id=department)
        if search:
            qs = qs.filter(name__icontains=search)

        serializer = GroupSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        if request.user.role not in ('superadmin', 'director', 'center_admin') and not request.user.is_superuser:
            return Response({"error": "Guruh yaratish huquqi yo'q!"}, status=status.HTTP_403_FORBIDDEN)
        serializer = GroupSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            group = serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='create',
                action=f"Yangi guruh yaratildi: {group.name}",
                texnikum=group.texnikum
            )
            return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get_object(self, pk, user):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return None
        if not (user.is_superuser or user.role == 'superadmin') and group.texnikum != user.texnikum:
            return None
        return group

    def get(self, request, pk):
        group = self.get_object(pk, request.user)
        if not group:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        # Detail serializer — talabalar ro'yxati bilan
        serializer = GroupDetailSerializer(group)
        return Response(serializer.data)

    def put(self, request, pk):
        group = self.get_object(pk, request.user)
        if not group:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        serializer = GroupSerializer(group, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='update',
                action=f"Guruh yangilandi: {group.name}", texnikum=group.texnikum
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role not in ('superadmin', 'director', 'center_admin') and not request.user.is_superuser:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)
        group = self.get_object(pk, request.user)
        if not group:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        group.is_active = False
        group.save()
        AdminLog.objects.create(
            user=request.user, action_type='delete',
            action=f"Guruh arxivlandi: {group.name}", texnikum=group.texnikum
        )
        return Response({"success": f"'{group.name}' arxivlandi!"})


# ─────────────────────────────────────────────
#  TALABA VIEWS
# ─────────────────────────────────────────────
class StudentListCreateView(APIView):
    """
    GET  /api/students/       → Talabalar ro'yxati
    POST /api/students/       → Yangi talaba qo'shish
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.role == 'superadmin':
            qs = Student.objects.all()
        elif user.role in ('founder', 'director', 'center_admin'):
            qs = Student.objects.filter(texnikum=user.texnikum)
        elif user.role == 'teacher':
            # O'qituvchi faqat o'z guruhidagi talabalarni ko'radi
            try:
                employee = user.employee_profile
                groups = Group.objects.filter(teacher=employee)
                qs = Student.objects.filter(group__in=groups, texnikum=user.texnikum)
            except Exception:
                return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        # Filterlash
        group        = request.query_params.get('group')
        study_status = request.query_params.get('study_status')
        search       = request.query_params.get('search')
        has_debt     = request.query_params.get('has_debt')

        if group:
            qs = qs.filter(group_id=group)
        if study_status:
            qs = qs.filter(study_status=study_status)
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(student_id__icontains=search)
            )
        if has_debt == 'true':
            # Qarzlilari — paid_amount < contract_amount
            qs = qs.filter(paid_amount__lt=models.F('contract_amount'))

        serializer = StudentSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        if request.user.role not in ('superadmin', 'director', 'center_admin') and not request.user.is_superuser:
            return Response({"error": "Talaba qo'shish huquqi yo'q!"}, status=status.HTTP_403_FORBIDDEN)
        serializer = StudentCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            student = serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='create',
                action=f"Yangi talaba qo'shildi: {student.full_name}",
                texnikum=student.texnikum
            )
            return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get_object(self, pk, user):
        try:
            student = Student.objects.get(pk=pk)
        except Student.DoesNotExist:
            return None
        if not (user.is_superuser or user.role == 'superadmin') and student.texnikum != user.texnikum:
            return None
        return student

    def get(self, request, pk):
        student = self.get_object(pk, request.user)
        if not student:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        return Response(StudentSerializer(student).data)

    def put(self, request, pk):
        student = self.get_object(pk, request.user)
        if not student:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        serializer = StudentSerializer(student, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role not in ('superadmin', 'director', 'center_admin') and not request.user.is_superuser:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)
        student = self.get_object(pk, request.user)
        if not student:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        student.is_active = False
        student.study_status = 'expelled'
        student.save()
        return Response({"success": f"{student.full_name} arxivlandi!"})


class MyProfileView(APIView):
    """
    GET /api/students/me/
    Talaba o'z profilini ko'radi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            student = user.student_profile
            return Response(StudentSerializer(student).data)
        except Exception:
            pass
        try:
            employee = user.employee_profile
            from app_texnikum.serializers import EmployeeSerializer
            return Response(EmployeeSerializer(employee).data)
        except Exception:
            pass
        return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────
#  TO'LOV VIEWS
# ─────────────────────────────────────────────
class PaymentListCreateView(APIView):
    """
    GET  /api/payments/?student=<id>
    POST /api/payments/
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsDirectorOrCenterAdmin]

    def get(self, request):
        user = request.user
        if user.is_superuser or user.role == 'superadmin':
            qs = Payment.objects.all()
        else:
            qs = Payment.objects.filter(texnikum=user.texnikum)

        student_id = request.query_params.get('student')
        from_date  = request.query_params.get('from_date')
        to_date    = request.query_params.get('to_date')
        method     = request.query_params.get('method')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if from_date and to_date:
            qs = qs.filter(date__range=[from_date, to_date])
        if method:
            qs = qs.filter(method=method)

        total = qs.aggregate(total=Sum('amount'))['total'] or 0
        serializer = PaymentSerializer(qs, many=True)
        return Response({"total_amount": total, "count": qs.count(), "results": serializer.data})

    def post(self, request):
        serializer = PaymentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            payment = serializer.save()
            AdminLog.objects.create(
                user=request.user, action_type='create',
                action=f"To'lov kiritildi: {payment.student.full_name} — {payment.amount} so'm",
                texnikum=payment.texnikum
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyPaymentListView(APIView):
    """GET /api/payments/my/ — talabaning faqat o'z to'lovlari."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({"error": "Talaba profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        qs = Payment.objects.filter(student=student).order_by('-date')
        serializer = PaymentSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})


# ─────────────────────────────────────────────
#  DARS VIEWS
# ─────────────────────────────────────────────
class LessonListCreateView(APIView):
    """
    GET  /api/lessons/?group=<id>&date=<YYYY-MM-DD>
    POST /api/lessons/   → Dars boshlash (o'qituvchi)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.role == 'superadmin':
            qs = Lesson.objects.all()
        elif user.role in ('founder', 'director', 'center_admin'):
            qs = Lesson.objects.filter(group__texnikum=user.texnikum)
        elif user.role == 'teacher':
            try:
                employee = user.employee_profile
                qs = Lesson.objects.filter(teacher=employee)
            except Exception:
                return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        # Filterlash
        group_id = request.query_params.get('group')
        target_date = request.query_params.get('date')
        today_only  = request.query_params.get('today')

        if group_id:
            qs = qs.filter(group_id=group_id)
        if target_date:
            qs = qs.filter(date=target_date)
        if today_only:
            qs = qs.filter(date=date.today())

        serializer = LessonSerializer(qs.order_by('-date', '-start_time'), many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        if request.user.role not in ('superadmin', 'director', 'center_admin', 'teacher') and not request.user.is_superuser:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()

        # O'qituvchi avtomatik belgilanadi
        if request.user.role == 'teacher':
            try:
                employee = request.user.employee_profile
                data['teacher'] = employee.id
            except Exception:
                return Response({"error": "O'qituvchi profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        serializer = LessonSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            lesson = serializer.save()

            # Dars boshlanishi bilan guruh barcha talabalari uchun 'absent' davomat yozuvlari yaratish
            students = Student.objects.filter(group=lesson.group, is_active=True)
            bulk_attendances = [
                StudentAttendance(
                    lesson=lesson,
                    student=s,
                    group=lesson.group,
                    date=lesson.date,
                    status='absent'
                ) for s in students
            ]
            StudentAttendance.objects.bulk_create(bulk_attendances, ignore_conflicts=True)

            return Response(LessonSerializer(lesson).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LessonDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get_object(self, pk, user):
        try:
            lesson = Lesson.objects.get(pk=pk)
        except Lesson.DoesNotExist:
            return None
        if not (user.is_superuser or user.role == 'superadmin') and lesson.group.texnikum != user.texnikum:
            return None
        return lesson

    def get(self, request, pk):
        lesson = self.get_object(pk, request.user)
        if not lesson:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        return Response(LessonSerializer(lesson).data)

    def put(self, request, pk):
        lesson = self.get_object(pk, request.user)
        if not lesson:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        serializer = LessonSerializer(lesson, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LessonFinishView(APIView):
    """POST /api/lessons/<pk>/finish/ — darsni yakunlash."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def post(self, request, pk):
        try:
            lesson = Lesson.objects.select_related('teacher').get(pk=pk)
        except Lesson.DoesNotExist:
            return Response({"error": "Dars topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (user.is_superuser or user.role in ('superadmin', 'director', 'center_admin')):
            try:
                if lesson.teacher_id != user.employee_profile.id:
                    return Response({"error": "Bu darsni yakunlash huquqingiz yo'q!"}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response({"error": "Xodim profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        lesson.is_finished = True
        lesson.save(update_fields=['is_finished'])
        return Response({"success": "Dars yakunlandi!", "lesson": LessonSerializer(lesson).data})


# ─────────────────────────────────────────────
#  TALABA DAVOMATI — STUDENT CHECK IN/OUT
# ─────────────────────────────────────────────
class StudentCheckInView(APIView):
    """
    POST /api/student-attendance/check-in/
    Talaba GPS orqali darsga kelish davomati.
    Body: {"latitude": 41.x, "longitude": 69.x, "lesson_id": 5}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StudentCheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user      = request.user
        lat       = serializer.validated_data['latitude']
        lon       = serializer.validated_data['longitude']
        lesson_id = serializer.validated_data['lesson_id']
        today     = date.today()

        # Talaba profilini topish
        try:
            student = user.student_profile
        except Exception:
            return Response({"error": "Talaba profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        # Darsni topish
        try:
            lesson = Lesson.objects.get(pk=lesson_id, group=student.group, date=today)
        except Lesson.DoesNotExist:
            return Response({"error": "Bugungi dars topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        # Allaqachon davomatdan o'tganmi?
        att = StudentAttendance.objects.filter(lesson=lesson, student=student).first()
        if att and att.status == 'present':
            return Response({"error": "Siz bu darsga allaqachon davomatdan o'tgansiz!"}, status=status.HTTP_400_BAD_REQUEST)

        # GPS tekshiruvi
        texnikum = student.texnikum
        if not texnikum.latitude or not texnikum.longitude:
            return Response({"error": "Texnikum GPS koordinatalari kiritilmagan!"}, status=status.HTTP_400_BAD_REQUEST)

        distance = calculate_distance(lat, lon, texnikum.latitude, texnikum.longitude)
        if distance > texnikum.gps_radius:
            return Response({
                "error": f"Siz texnikum hududida emassiz! Masofa: {distance:.0f} metr (limit: {texnikum.gps_radius} metr)"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Kechikishni aniqlash
        now_time = timezone.localtime(timezone.now()).time()
        lesson_start = lesson.start_time
        if now_time > lesson_start:
            diff = datetime.combine(today, now_time) - datetime.combine(today, lesson_start)
            late_min = int(diff.total_seconds() / 60)
            att_status = 'late' if late_min > 5 else 'present'
        else:
            att_status = 'present'

        # Davomat yozuvini yangilash yoki yaratish
        if att:
            att.arrival_time      = now_time
            att.arrival_latitude  = lat
            att.arrival_longitude = lon
            att.arrival_distance  = round(distance, 2)
            att.status            = att_status
            att.check_type        = 'gps'
            att.save()
        else:
            att = StudentAttendance.objects.create(
                lesson=lesson,
                student=student,
                group=lesson.group,
                date=today,
                arrival_time=now_time,
                arrival_latitude=lat,
                arrival_longitude=lon,
                arrival_distance=round(distance, 2),
                status=att_status,
                check_type='gps'
            )

        msg = "Darsga kelish davomati qabul qilindi!"
        if att_status == 'late':
            msg = f"Kechikib keldingiz!"

        return Response({
            "success": msg,
            "time": str(now_time.strftime('%H:%M')),
            "status": att_status,
            "distance_to_texnikum": f"{distance:.0f} metr"
        }, status=status.HTTP_200_OK)


class StudentCheckOutView(APIView):
    """
    POST /api/student-attendance/check-out/
    Talaba darsdan ketish davomati.
    Body: {"lesson_id": 5}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return Response({"error": "lesson_id majburiy!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = request.user.student_profile
        except Exception:
            return Response({"error": "Talaba profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        try:
            lesson = Lesson.objects.get(pk=lesson_id, group=student.group, date=date.today())
        except Lesson.DoesNotExist:
            return Response({"error": "Dars topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        att = StudentAttendance.objects.filter(lesson=lesson, student=student).first()
        if not att or att.status == 'absent':
            return Response({"error": "Avval darsga kelish davomatini o'ting!"}, status=status.HTTP_400_BAD_REQUEST)

        now_time = timezone.localtime(timezone.now()).time()

        # Erta ketganmi?
        if lesson.end_time and now_time < lesson.end_time:
            att.status = 'left_early'
            att.note   = f"Dars {lesson.end_time} da tugaydi, {now_time.strftime('%H:%M')} da chiqib ketdi."

        att.departure_time = now_time
        att.save()

        return Response({
            "success": "Darsdan chiqish davomati qabul qilindi!",
            "time": str(now_time.strftime('%H:%M')),
            "status": att.status
        })


# ─────────────────────────────────────────────
#  O'QITUVCHI DAVOMATI BELGILASH
# ─────────────────────────────────────────────
class BulkAttendanceView(APIView):
    """
    POST /api/student-attendance/bulk/
    O'qituvchi bir vaqtda butun guruh davomatini belgilaydi.
    Body:
    {
      "lesson_id": 5,
      "attendances": [
        {"student_id": 1, "status": "present"},
        {"student_id": 2, "status": "absent", "note": "Sababsiz"},
        ...
      ]
    }
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsTeacherOrCenterAdmin]

    def post(self, request):
        lesson_id   = request.data.get('lesson_id')
        attendances = request.data.get('attendances', [])

        if not lesson_id or not attendances:
            return Response({"error": "lesson_id va attendances majburiy!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lesson = Lesson.objects.get(pk=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Dars topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        # Faqat o'z guruhini o'zgartira oladi
        if request.user.role == 'teacher':
            try:
                employee = request.user.employee_profile
                if lesson.teacher != employee:
                    return Response({"error": "Bu dars sizning darsiz!"}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        updated = 0
        errors  = []

        for item in attendances:
            student_id = item.get('student_id')
            att_status = item.get('status')
            note       = item.get('note', '')

            if not student_id or not att_status:
                errors.append(f"student_id={student_id}: status majburiy!")
                continue

            try:
                student = Student.objects.get(pk=student_id, group=lesson.group)
            except Student.DoesNotExist:
                errors.append(f"student_id={student_id}: topilmadi!")
                continue

            StudentAttendance.objects.update_or_create(
                lesson=lesson, student=student,
                defaults={
                    'group': lesson.group,
                    'date': lesson.date,
                    'status': att_status,
                    'check_type': 'manual',
                    'arrival_time': timezone.localtime(timezone.now()).time() if att_status == 'present' else None,
                    'note': note
                }
            )
            updated += 1

        return Response({
            "success": f"{updated} ta talaba davomati belgilandi!",
            "errors": errors
        }, status=status.HTTP_200_OK)


class MarkLeftEarlyView(APIView):
    """
    POST /api/student-attendance/left-early/
    O'qituvchi — talaba darsdan chiqib ketdi deb belgilaydi.
    Body: {"lesson_id": 5, "student_id": 3, "note": "Ruxsatsiz chiqdi"}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsTeacherOrCenterAdmin]

    def post(self, request):
        lesson_id  = request.data.get('lesson_id')
        student_id = request.data.get('student_id')
        note       = request.data.get('note', 'Darsdan chiqib ketdi')

        try:
            lesson  = Lesson.objects.get(pk=lesson_id)
            student = Student.objects.get(pk=student_id, group=lesson.group)
        except (Lesson.DoesNotExist, Student.DoesNotExist):
            return Response({"error": "Dars yoki talaba topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        att, _ = StudentAttendance.objects.update_or_create(
            lesson=lesson, student=student,
            defaults={
                'group': lesson.group,
                'date': lesson.date,
                'status': 'left_early',
                'check_type': 'manual',
                'departure_time': timezone.localtime(timezone.now()).time(),
                'note': note
            }
        )

        return Response({
            "success": f"{student.full_name} 'Erta ketdi' deb belgilandi!",
            "time": str(att.departure_time)
        })


class LiveAttendanceBoardView(APIView):
    """
    GET /api/lessons/<lesson_id>/live-board/
    Jonli davomat taxtasi:
    - Yashil  → keldi (present)
    - Sariq   → kechikdi (late)
    - Qizil   → kelmadi (absent)
    - To'q sariq → erta ketdi (left_early)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsTeacherOrCenterAdmin]

    def get(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(pk=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Dars topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        students = Student.objects.filter(group=lesson.group, is_active=True)
        board = []

        for student in students:
            att = StudentAttendance.objects.filter(lesson=lesson, student=student).first()
            att_status = att.status if att else 'absent'
            board.append({
                "student_id":   student.id,
                "student_name": student.full_name,
                "photo":        student.photo.url if student.photo else None,
                "status":       att_status,
                "status_display": dict(StudentAttendance.STATUS_CHOICES).get(att_status, ''),
                "status_color": get_status_color(att_status),
                "arrival_time": str(att.arrival_time) if att and att.arrival_time else None,
                "departure_time": str(att.departure_time) if att and att.departure_time else None,
                "note":         att.note if att else '',
            })

        # Statistika
        total   = len(board)
        present = sum(1 for b in board if b['status'] in ('present', 'late'))
        absent  = sum(1 for b in board if b['status'] == 'absent')

        return Response({
            "lesson_id":   lesson.id,
            "lesson_date": str(lesson.date),
            "group_name":  lesson.group.name,
            "subject":     lesson.subject.name if lesson.subject else None,
            "start_time":  str(lesson.start_time),
            "total":       total,
            "present":     present,
            "absent":      absent,
            "percent":     round(present / total * 100, 1) if total else 0,
            "board":       board
        })


# ─────────────────────────────────────────────
#  TALABA DAVOMATI RO'YXATI VA HISOBOT
# ─────────────────────────────────────────────
class StudentAttendanceListView(APIView):
    """
    GET /api/student-attendance/
    Query params:
      ?student=<id> | ?group=<id> | ?lesson=<id>
      ?today=1 | ?weekly=1 | ?monthly=1 | ?yearly=1
      ?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        user  = request.user
        today = date.today()

        if user.is_superuser or user.role == 'superadmin':
            qs = StudentAttendance.objects.all()
        elif user.role in ('founder', 'director', 'center_admin'):
            qs = StudentAttendance.objects.filter(group__texnikum=user.texnikum)
        elif user.role == 'teacher':
            try:
                employee = user.employee_profile
                qs = StudentAttendance.objects.filter(lesson__teacher=employee)
            except Exception:
                return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        # Filterlash
        student_id = request.query_params.get('student')
        group_id   = request.query_params.get('group')
        lesson_id  = request.query_params.get('lesson')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if group_id:
            qs = qs.filter(group_id=group_id)
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)

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

        serializer = StudentAttendanceSerializer(qs.order_by('-date'), many=True)
        return Response({"count": qs.count(), "results": serializer.data})


class MyStudentAttendanceView(APIView):
    """
    GET /api/student-attendance/my/
    Talaba o'z davomatini ko'radi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({"error": "Talaba profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        if request.query_params.get('today'):
            qs = StudentAttendance.objects.filter(student=student, date=today)
        elif request.query_params.get('weekly'):
            start = today - timedelta(days=today.weekday())
            qs = StudentAttendance.objects.filter(student=student, date__range=[start, start + timedelta(days=6)])
        elif request.query_params.get('monthly'):
            qs = StudentAttendance.objects.filter(student=student, date__year=today.year, date__month=today.month)
        elif request.query_params.get('yearly'):
            qs = StudentAttendance.objects.filter(student=student, date__year=today.year)
        else:
            qs = StudentAttendance.objects.filter(student=student).order_by('-date')[:50]

        # Umumiy statistika
        total   = qs.count()
        present = qs.filter(status__in=['present', 'late']).count()
        absent  = qs.filter(status='absent').count()

        serializer = StudentAttendanceSerializer(qs, many=True)
        return Response({
            "summary": {
                "total_lessons": total,
                "present": present,
                "absent": absent,
                "percent": round(present / total * 100, 1) if total else 0
            },
            "results": serializer.data
        })


# ─────────────────────────────────────────────
#  BAHO VIEWS
# ─────────────────────────────────────────────
class GradeListCreateView(APIView):
    """
    GET  /api/grades/?student=<id>&subject=<id>
    POST /api/grades/
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.role == 'superadmin':
            qs = Grade.objects.all()
        elif user.role in ('founder', 'director', 'center_admin'):
            qs = Grade.objects.filter(student__texnikum=user.texnikum)
        elif user.role == 'teacher':
            try:
                employee = user.employee_profile
                qs = Grade.objects.filter(given_by=employee)
            except Exception:
                return Response({"error": "Profil topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        student_id = request.query_params.get('student')
        subject_id = request.query_params.get('subject')
        grade_type = request.query_params.get('grade_type')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if grade_type:
            qs = qs.filter(grade_type=grade_type)

        serializer = GradeSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        if request.user.role not in ('superadmin', 'director', 'center_admin', 'teacher') and not request.user.is_superuser:
            return Response({"error": "Baho qo'yish huquqi yo'q!"}, status=status.HTTP_403_FORBIDDEN)
        serializer = GradeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyGradesView(APIView):
    """
    GET /api/grades/my/
    Talaba o'z baholarini ko'radi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({"error": "Talaba profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        qs = Grade.objects.filter(student=student)
        subject_id = request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        # O'rtacha ball fanlar bo'yicha
        from django.db.models import Avg
        avg_by_subject = qs.values('subject__name').annotate(avg_score=Avg('score')).order_by('subject__name')

        serializer = GradeSerializer(qs, many=True)
        return Response({
            "average_by_subject": list(avg_by_subject),
            "results": serializer.data
        })


# ─────────────────────────────────────────────
#  BILDIRISHNOMA VIEWS
# ─────────────────────────────────────────────
class NotificationListCreateView(APIView):
    """
    GET  /api/notifications/   → O'z bildirishnomalarini ko'rish
    POST /api/notifications/   → Yangi bildirishnoma yuborish (Admin/Teacher)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Foydalanuvchiga tegishli bildirishnomalar
        qs = Notification.objects.filter(
            Q(target_user=user) |
            Q(target_type='all', texnikum=user.texnikum) |
            Q(target_type='staff', texnikum=user.texnikum) |
            Q(sent_by=user)
        ).distinct()

        # Talaba uchun o'z guruhi bildirishnomalari
        if user.role == 'student':
            try:
                student = user.student_profile
                qs = qs | Notification.objects.filter(
                    target_type='group', target_group=student.group
                )
            except Exception:
                pass

        is_read = request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read == 'true')

        serializer = NotificationSerializer(qs.distinct().order_by('-created_at')[:100], many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        if request.user.role not in ('superadmin', 'founder', 'director', 'center_admin', 'teacher') and not request.user.is_superuser:
            return Response({"error": "Bildirishnoma yuborish huquqi yo'q!"}, status=status.HTTP_403_FORBIDDEN)
        serializer = NotificationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            notif = serializer.save()
            return Response(NotificationSerializer(notif).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarkNotificationReadView(APIView):
    """
    PUT /api/notifications/<id>/read/
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({"error": "Topilmadi!"}, status=status.HTTP_404_NOT_FOUND)
        notif.is_read = True
        notif.save()
        return Response({"success": "O'qildi deb belgilandi!"})


class MarkAllNotificationsReadView(APIView):
    """PUT /api/notifications/mark-all-read/ — shaxsiy xabarlarni o'qilgan qiladi."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        qs = Notification.objects.filter(
            Q(target_user=user) |
            Q(target_type='all', texnikum=user.texnikum) |
            Q(target_type='staff', texnikum=user.texnikum) |
            Q(sent_by=user)
        )
        if user.role == 'student':
            try:
                qs = qs | Notification.objects.filter(target_type='group', target_group=user.student_profile.group)
            except Exception:
                pass
        updated = qs.distinct().filter(is_read=False).update(is_read=True)
        return Response({"success": f"{updated} ta bildirishnoma o'qildi deb belgilandi!", "updated": updated})


class TeacherDashboardView(APIView):
    """GET /api/dashboard/teacher/ — o'qituvchining kundalik ish maydoni."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        try:
            employee = request.user.employee_profile
        except Exception:
            return Response({"error": "O'qituvchi profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        groups = Group.objects.filter(teacher=employee, is_active=True)
        lessons = Lesson.objects.filter(teacher=employee, date=today).order_by('start_time')
        attendance = StudentAttendance.objects.filter(lesson__in=lessons)
        total = attendance.count()
        present = attendance.filter(status__in=('present', 'late')).count()
        return Response({
            "date": str(today),
            "teacher_name": employee.full_name,
            "groups_count": groups.count(),
            "students_count": Student.objects.filter(group__in=groups, is_active=True).count(),
            "today_lessons_count": lessons.count(),
            "attendance": {
                "total": total,
                "present": present,
                "absent": attendance.filter(status='absent').count(),
                "percent": round(present / total * 100, 1) if total else 0,
            },
            "today_lessons": LessonSerializer(lessons, many=True).data,
            "groups": GroupSerializer(groups, many=True).data,
        })


# ─────────────────────────────────────────────
#  STUDENT DASHBOARD
# ─────────────────────────────────────────────
class StudentDashboardView(APIView):
    """
    GET /api/dashboard/student/
    Talabaning shaxsiy dashboard ma'lumotlari.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({"error": "Talaba profili topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()

        # Bugungi darslar
        today_lessons = Lesson.objects.filter(group=student.group, date=today)

        # Umumiy davomat foizi
        total_att   = StudentAttendance.objects.filter(student=student)
        present_att = total_att.filter(status__in=['present', 'late']).count()
        total_count = total_att.count()

        # O'qilmagan bildirishnomalar
        unread_notifs = Notification.objects.filter(
            Q(target_user=request.user) |
            Q(target_type='group', target_group=student.group) |
            Q(target_type='all', texnikum=student.texnikum),
            is_read=False
        ).count()

        # Jadval
        schedule = student.group.schedule if student.group else []
        recent_attendance = StudentAttendance.objects.filter(student=student).order_by('-date')[:7]
        late_att = total_att.filter(status='late').count()
        absent_att = total_att.filter(status='absent').count()
        group_data = GroupSerializer([student.group], many=True).data if student.group else []
        lesson_data = LessonSerializer(today_lessons, many=True).data

        return Response({
            "student_name":     student.full_name,
            "group_name":       student.group.name if student.group else None,
            "student_id":       student.student_id,
            "contract_amount":  student.contract_amount,
            "paid_amount":      student.paid_amount,
            "debt_amount":      student.debt_amount,
            "attendance_percent": round(present_att / total_count * 100, 1) if total_count else 0,
            "today_lessons_count": today_lessons.count(),
            "unread_notifications": unread_notifs,
            "schedule": schedule,
            "today_lessons": lesson_data,

            # Mobil ilova uchun dashboard contracti. Yuqoridagi kalitlar
            # tashqi integratsiyalar bilan moslik uchun saqlanadi.
            "groups": group_data,
            "upcoming_lessons": lesson_data,
            "recent_attendance": StudentAttendanceSerializer(recent_attendance, many=True).data,
            "payment_summary": {
                "contract": float(student.contract_amount),
                "paid": float(student.paid_amount),
                "debt": float(student.debt_amount),
            },
            "student_info": {
                "total_days": total_count,
                "present_days": present_att,
                "late_days": late_att,
                "absent_days": absent_att,
            },
        })


# ─────────────────────────────────────────────
#  CENTER ADMIN DASHBOARD
# ─────────────────────────────────────────────
class CenterAdminDashboardView(APIView):
    """
    GET /api/dashboard/center-admin/
    Bugungi jonli holat: guruhlar, davomat, kelmagan talabalar.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsDirectorOrCenterAdmin]

    def get(self, request):
        user  = request.user
        today = date.today()

        texnikum = user.texnikum
        total_students  = Student.objects.filter(texnikum=texnikum, is_active=True, study_status='active').count()
        total_groups    = Group.objects.filter(texnikum=texnikum, is_active=True).count()
        today_lessons   = Lesson.objects.filter(group__texnikum=texnikum, date=today).count()

        present_today   = StudentAttendance.objects.filter(
            group__texnikum=texnikum, date=today, status__in=['present', 'late']
        ).count()
        absent_today    = StudentAttendance.objects.filter(
            group__texnikum=texnikum, date=today, status='absent'
        ).count()

        # Kelmagan talabalar (ota-onaga xabar uchun)
        absent_students = StudentAttendance.objects.filter(
            group__texnikum=texnikum, date=today, status='absent'
        ).select_related('student').values(
            'student__id', 'student__full_name',
            'student__parent_phone', 'student__phone_number',
            'group__name'
        )[:50]

        return Response({
            "date": str(today),
            "total_students": total_students,
            "total_groups": total_groups,
            "today_lessons": today_lessons,
            "present_today": present_today,
            "absent_today": absent_today,
            "attendance_percent": round(present_today / total_students * 100, 1) if total_students else 0,
            "absent_students_list": list(absent_students)
        })
