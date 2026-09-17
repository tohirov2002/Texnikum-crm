from rest_framework import serializers
from django.db.models import Count, Q
from datetime import date

from .models import (
    Subject, Room, Group, Student, Payment,
    Lesson, StudentAttendance, Grade, Notification
)
from app_texnikum.models import Employee


# ─────────────────────────────────────────────
#  SUBJECT
# ─────────────────────────────────────────────
class SubjectSerializer(serializers.ModelSerializer):
    texnikum_name = serializers.CharField(source='texnikum.name', read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'texnikum', 'texnikum_name', 'name', 'description', 'hours', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at', 'texnikum_name']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and not attrs.get('texnikum'):
            attrs['texnikum'] = request.user.texnikum
        return attrs


# ─────────────────────────────────────────────
#  ROOM
# ─────────────────────────────────────────────
class RoomSerializer(serializers.ModelSerializer):
    texnikum_name = serializers.CharField(source='texnikum.name', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'texnikum', 'texnikum_name', 'name', 'capacity', 'is_active']
        read_only_fields = ['id', 'texnikum_name']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and not attrs.get('texnikum'):
            attrs['texnikum'] = request.user.texnikum
        return attrs


# ─────────────────────────────────────────────
#  GROUP
# ─────────────────────────────────────────────
class GroupSerializer(serializers.ModelSerializer):
    texnikum_name   = serializers.CharField(source='texnikum.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    teacher_name    = serializers.CharField(source='teacher.full_name', read_only=True)
    subject_name    = serializers.CharField(source='subject.name', read_only=True)
    room_name       = serializers.CharField(source='room.name', read_only=True)
    students_count  = serializers.IntegerField(read_only=True)

    class Meta:
        model = Group
        fields = [
            'id', 'texnikum', 'texnikum_name',
            'department', 'department_name',
            'name', 'teacher', 'teacher_name',
            'subject', 'subject_name',
            'room', 'room_name',
            'schedule', 'start_date', 'end_date',
            'is_active', 'students_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'texnikum_name', 'department_name',
                            'teacher_name', 'subject_name', 'room_name', 'students_count']

    def validate_schedule(self, value):
        if value is None:
            return value
        days = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
        for item in value:
            if not {'day', 'from', 'to'}.issubset(item.keys()):
                raise serializers.ValidationError("Jadval: {day, from, to} kalitlari majburiy!")
            if item['day'] not in days:
                raise serializers.ValidationError(f"'{item['day']}' noto'g'ri kun nomi!")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and not attrs.get('texnikum'):
            attrs['texnikum'] = request.user.texnikum
        return attrs


class GroupDetailSerializer(GroupSerializer):
    """Guruh detail — talabalar ro'yxati bilan."""
    students = serializers.SerializerMethodField()

    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields + ['students']

    def get_students(self, obj):
        students = obj.students.filter(is_active=True)
        return StudentShortSerializer(students, many=True).data


# ─────────────────────────────────────────────
#  STUDENT
# ─────────────────────────────────────────────
class StudentShortSerializer(serializers.ModelSerializer):
    """Boshqa serializerlarda qisqa ko'rinish uchun."""
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'phone_number', 'photo', 'study_status']


class StudentSerializer(serializers.ModelSerializer):
    texnikum_name    = serializers.CharField(source='texnikum.name', read_only=True)
    group_name       = serializers.CharField(source='group.name', read_only=True)
    study_status_display = serializers.CharField(source='get_study_status_display', read_only=True)
    gender_display   = serializers.CharField(source='get_gender_display', read_only=True)
    debt_amount      = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    username         = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'username', 'texnikum', 'texnikum_name',
            'group', 'group_name',
            'full_name', 'birth_date', 'gender', 'gender_display',
            'address', 'phone_number', 'photo',
            'parent_name', 'parent_phone',
            'student_id', 'enrollment_date',
            'study_status', 'study_status_display',
            'contract_amount', 'paid_amount', 'debt_amount',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'texnikum_name', 'group_name',
                            'study_status_display', 'gender_display', 'debt_amount', 'username']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and not attrs.get('texnikum'):
            attrs['texnikum'] = request.user.texnikum
        return attrs


class StudentCreateSerializer(serializers.ModelSerializer):
    """Yangi talaba yaratish."""
    class Meta:
        model = Student
        fields = [
            'user', 'texnikum', 'group',
            'full_name', 'birth_date', 'gender',
            'address', 'phone_number', 'photo',
            'parent_name', 'parent_phone',
            'student_id', 'enrollment_date', 'contract_amount'
        ]

    def validate_user(self, value):
        if hasattr(value, 'student_profile'):
            raise serializers.ValidationError("Bu foydalanuvchida allaqachon talaba profili mavjud!")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and not attrs.get('texnikum'):
            attrs['texnikum'] = request.user.texnikum
        return attrs


# ─────────────────────────────────────────────
#  PAYMENT
# ─────────────────────────────────────────────
class PaymentSerializer(serializers.ModelSerializer):
    student_name    = serializers.CharField(source='student.full_name', read_only=True)
    texnikum_name   = serializers.CharField(source='texnikum.name', read_only=True)
    method_display  = serializers.CharField(source='get_method_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'texnikum', 'texnikum_name',
            'amount', 'method', 'method_display', 'date', 'description',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'student_name', 'texnikum_name',
                            'method_display', 'created_by_name']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("To'lov summasi 0 dan katta bo'lishi kerak!")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['created_by'] = request.user
            if not validated_data.get('texnikum'):
                validated_data['texnikum'] = request.user.texnikum
        return super().create(validated_data)


# ─────────────────────────────────────────────
#  LESSON
# ─────────────────────────────────────────────
class LessonSerializer(serializers.ModelSerializer):
    group_name   = serializers.CharField(source='group.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    room_name    = serializers.CharField(source='room.name', read_only=True)
    attended_count = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'group', 'group_name',
            'teacher', 'teacher_name',
            'subject', 'subject_name',
            'room', 'room_name',
            'date', 'start_time', 'end_time',
            'topic', 'homework', 'note', 'is_finished',
            'attended_count', 'total_students',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'group_name', 'teacher_name',
                            'subject_name', 'room_name', 'attended_count', 'total_students']

    def get_attended_count(self, obj):
        return obj.attendances.filter(status='present').count()

    def get_total_students(self, obj):
        return obj.group.students.filter(is_active=True).count()


# ─────────────────────────────────────────────
#  STUDENT ATTENDANCE
# ─────────────────────────────────────────────
class StudentAttendanceSerializer(serializers.ModelSerializer):
    student_name    = serializers.CharField(source='student.full_name', read_only=True)
    group_name      = serializers.CharField(source='group.name', read_only=True)
    status_display  = serializers.CharField(source='get_status_display', read_only=True)
    check_type_display = serializers.CharField(source='get_check_type_display', read_only=True)
    lesson_info     = serializers.SerializerMethodField()

    class Meta:
        model = StudentAttendance
        fields = [
            'id', 'lesson', 'lesson_info',
            'student', 'student_name',
            'group', 'group_name', 'date',
            'arrival_time', 'arrival_latitude', 'arrival_longitude', 'arrival_distance',
            'departure_time',
            'status', 'status_display',
            'check_type', 'check_type_display',
            'note', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'student_name',
                            'group_name', 'status_display', 'check_type_display', 'lesson_info']

    def get_lesson_info(self, obj):
        return {
            "id": obj.lesson.id,
            "date": str(obj.lesson.date),
            "subject": obj.lesson.subject.name if obj.lesson.subject else None,
            "start_time": str(obj.lesson.start_time),
        }


class StudentCheckInSerializer(serializers.Serializer):
    """Talaba GPS orqali kelish uchun input."""
    latitude  = serializers.FloatField()
    longitude = serializers.FloatField()
    lesson_id = serializers.IntegerField()

    def validate_latitude(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError("Latitude qiymati -90 dan 90 gacha bo'lishi kerak!")
        return value

    def validate_longitude(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError("Longitude qiymati -180 dan 180 gacha bo'lishi kerak!")
        return value


class LiveAttendanceBoardSerializer(serializers.Serializer):
    """
    Jonli davomat taxtasi — o'qituvchi uchun.
    Har bir talaba: yashil (keldi), sariq (kechikdi), qizil (kelmadi).
    """
    student_id   = serializers.IntegerField()
    student_name = serializers.CharField()
    photo        = serializers.ImageField(allow_null=True)
    status       = serializers.CharField()
    status_color = serializers.CharField()  # green, yellow, red
    arrival_time = serializers.TimeField(allow_null=True)
    note         = serializers.CharField(allow_blank=True)


class BulkAttendanceSerializer(serializers.Serializer):
    """
    O'qituvchi bir vaqtda butun guruh davomatini belgilash uchun.
    """
    class AttendanceItem(serializers.Serializer):
        student_id = serializers.IntegerField()
        status     = serializers.ChoiceField(choices=['present', 'absent', 'late', 'excused', 'left_early'])
        note       = serializers.CharField(required=False, allow_blank=True)

    lesson_id   = serializers.IntegerField()
    attendances = AttendanceItem(many=True)


# ─────────────────────────────────────────────
#  GRADE
# ─────────────────────────────────────────────
class GradeSerializer(serializers.ModelSerializer):
    student_name    = serializers.CharField(source='student.full_name', read_only=True)
    subject_name    = serializers.CharField(source='subject.name', read_only=True)
    grade_type_display = serializers.CharField(source='get_grade_type_display', read_only=True)
    given_by_name   = serializers.CharField(source='given_by.full_name', read_only=True)
    percentage      = serializers.FloatField(read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name',
            'lesson', 'subject', 'subject_name',
            'grade_type', 'grade_type_display',
            'score', 'max_score', 'percentage',
            'date', 'comment',
            'given_by', 'given_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'student_name', 'subject_name',
                            'grade_type_display', 'given_by_name', 'percentage']

    def validate(self, attrs):
        if attrs.get('score', 0) > attrs.get('max_score', 100):
            raise serializers.ValidationError({"score": "Ball maksimal balldan oshib ketdi!"})
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            try:
                validated_data['given_by'] = request.user.employee_profile
            except Exception:
                pass
        return super().create(validated_data)


# ─────────────────────────────────────────────
#  NOTIFICATION
# ─────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    sent_by_name    = serializers.CharField(source='sent_by.username', read_only=True)
    notif_type_display  = serializers.CharField(source='get_notif_type_display', read_only=True)
    target_type_display = serializers.CharField(source='get_target_type_display', read_only=True)
    group_name      = serializers.CharField(source='target_group.name', read_only=True)
    student_name    = serializers.CharField(source='target_student.full_name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'texnikum', 'title', 'body',
            'notif_type', 'notif_type_display',
            'target_type', 'target_type_display',
            'target_group', 'group_name',
            'target_student', 'student_name',
            'target_user',
            'sent_by', 'sent_by_name',
            'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'sent_by_name', 'notif_type_display',
                            'target_type_display', 'group_name', 'student_name']

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['sent_by'] = request.user
            if not validated_data.get('texnikum'):
                validated_data['texnikum'] = request.user.texnikum
        return super().create(validated_data)


# ─────────────────────────────────────────────
#  STATISTIKA SERIALIZERLARI
# ─────────────────────────────────────────────
class StudentAttendanceSummarySerializer(serializers.Serializer):
    """Talaba davomati umumiy hisoboti."""
    student_id         = serializers.IntegerField()
    student_name       = serializers.CharField()
    group_name         = serializers.CharField()
    total_lessons      = serializers.IntegerField()
    present_count      = serializers.IntegerField()
    absent_count       = serializers.IntegerField()
    late_count         = serializers.IntegerField()
    excused_count      = serializers.IntegerField()
    attendance_percent = serializers.FloatField()


class GroupAttendanceSummarySerializer(serializers.Serializer):
    """Guruh davomati umumiy hisoboti."""
    group_id    = serializers.IntegerField()
    group_name  = serializers.CharField()
    date        = serializers.DateField()
    total       = serializers.IntegerField()
    present     = serializers.IntegerField()
    absent      = serializers.IntegerField()
    late        = serializers.IntegerField()
    percent     = serializers.FloatField()