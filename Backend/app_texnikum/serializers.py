from rest_framework import serializers
from .models import (
    Texnikum, Department, Position,
    Employee, EmployeeStatus, EmployeeAttendance,
    Payroll, Expense
)
from users.models import AdminLog


# ─────────────────────────────────────────────
#  TEXNIKUM
# ─────────────────────────────────────────────
# serializers.py ichidagi TexnikumSerializer ni shu bilan almashtiring

class TexnikumSerializer(serializers.ModelSerializer):
    employees_count = serializers.SerializerMethodField()
    is_subscription_active = serializers.BooleanField(read_only=True)
    founder = serializers.SerializerMethodField()  # ← QO'SHILDI

    class Meta:
        model = Texnikum
        fields = [
            'id', 'name', 'address', 'phone', 'email', 'logo',
            'latitude', 'longitude', 'gps_radius',
            'is_active', 'subscription_end', 'is_subscription_active',
            'employees_count', 'founder', 'created_at'  # ← founder qo'shildi
        ]
        read_only_fields = ['id', 'created_at', 'employees_count', 'is_subscription_active', 'founder']

    def get_employees_count(self, obj):
        return obj.employees.filter(is_active=True).count()

    def get_founder(self, obj):
        """Texnikumning founder foydalanuvchisini qaytaradi."""
        try:
            # Texnikumga tegishli foydalanuvchilar ichidan founder rolini topamiz
            founder = obj.users.filter(role='founder').first()
            if not founder:
                return None
            return {
                'id':         founder.id,
                'username':   founder.username,
                'first_name': founder.first_name,
                'last_name':  founder.last_name,
                'email':      founder.email or '',
                'role':       founder.role,
            }
        except Exception:
            return None


class TexnikumCreateSerializer(serializers.ModelSerializer):
    """Yangi texnikum yaratish (faqat SuperAdmin)."""
    class Meta:
        model = Texnikum
        fields = [
            'name', 'address', 'phone', 'email', 'logo',
            'latitude', 'longitude', 'gps_radius',
            'subscription_end'
        ]


# ─────────────────────────────────────────────
#  DEPARTMENT
# ─────────────────────────────────────────────
class DepartmentSerializer(serializers.ModelSerializer):
    texnikum_name = serializers.CharField(source='texnikum.name', read_only=True)
    employees_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'texnikum', 'texnikum_name', 'name', 'description', 'is_active', 'employees_count', 'created_at']
        read_only_fields = ['id', 'created_at', 'texnikum_name', 'employees_count']

    def get_employees_count(self, obj):
        return obj.employees.filter(is_active=True).count()

    def validate(self, attrs):
        # Texnikumni request userdan olish (agar kiritilmasa)
        request = self.context.get('request')
        if request and not attrs.get('texnikum'):
            attrs['texnikum'] = request.user.texnikum
        return attrs


# ─────────────────────────────────────────────
#  POSITION
# ─────────────────────────────────────────────
class PositionSerializer(serializers.ModelSerializer):
    texnikum_name = serializers.CharField(source='texnikum.name', read_only=True)

    class Meta:
        model = Position
        fields = ['id', 'texnikum', 'texnikum_name', 'name', 'description']
        read_only_fields = ['id', 'texnikum_name']


# ─────────────────────────────────────────────
#  EMPLOYEE STATUS
# ─────────────────────────────────────────────
class EmployeeStatusSerializer(serializers.ModelSerializer):
    status_display  = serializers.CharField(source='get_status_display', read_only=True)
    employee_name   = serializers.CharField(source='employee.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)

    class Meta:
        model = EmployeeStatus
        fields = [
            'id', 'employee', 'employee_name', 'status', 'status_display',
            'from_date', 'to_date', 'reason',
            'approved_by', 'approved_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'status_display', 'employee_name', 'approved_by_name']

    def validate(self, attrs):
        if attrs.get('from_date') and attrs.get('to_date'):
            if attrs['from_date'] > attrs['to_date']:
                raise serializers.ValidationError({"to_date": "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas!"})
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['approved_by'] = request.user
        return super().create(validated_data)


# ─────────────────────────────────────────────
#  EMPLOYEE
# ─────────────────────────────────────────────
class EmployeeShortSerializer(serializers.ModelSerializer):
    """Boshqa serializerlarda qisqa ma'lumot uchun."""
    role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'phone_number', 'photo', 'role']


class EmployeeSerializer(serializers.ModelSerializer):
    texnikum_name    = serializers.CharField(source='texnikum.name', read_only=True)
    department_name  = serializers.CharField(source='department.name', read_only=True)
    position_name    = serializers.CharField(source='position.name', read_only=True)
    role             = serializers.CharField(source='user.role', read_only=True)
    username         = serializers.CharField(source='user.username', read_only=True)
    active_status    = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'username', 'texnikum', 'texnikum_name',
            'department', 'department_name', 'position', 'position_name',
            'full_name', 'birth_date', 'address', 'phone_number', 'photo',
            'employment_type', 'base_salary', 'work_start_date', 'schedule',
            'role', 'is_active', 'active_status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'texnikum_name', 'department_name',
                            'position_name', 'role', 'username', 'active_status']

    def get_active_status(self, obj):
        """Xodimning bugungi holati."""
        from datetime import date
        active = EmployeeStatus.get_active_status(obj, date.today())
        if active:
            return active.get_status_display()
        return "ISHDA"

    def validate_schedule(self, value):
        """
        Schedule formati:
        [{"day": "Dushanba", "from": "08:00", "to": "17:00"}, ...]
        """
        if value is None:
            return value
        required_keys = {'day', 'from', 'to'}
        days = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
        for item in value:
            if not required_keys.issubset(item.keys()):
                raise serializers.ValidationError(f"Har bir jadval elementi {required_keys} kalitlarini o'z ichiga olishi kerak!")
            if item['day'] not in days:
                raise serializers.ValidationError(f"'{item['day']}' noto'g'ri kun nomi!")
        return value


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """
    Yangi xodim yaratish.
    User allaqachon yaratilgan bo'lishi kerak.
    """
    class Meta:
        model = Employee
        fields = [
            'user', 'texnikum', 'department', 'position',
            'full_name', 'birth_date', 'address', 'phone_number', 'photo',
            'employment_type', 'base_salary', 'work_start_date', 'schedule'
        ]

    def validate_user(self, value):
        # Foydalanuvchida allaqachon profil bormi?
        if hasattr(value, 'employee_profile'):
            raise serializers.ValidationError("Bu foydalanuvchida allaqachon xodim profili mavjud!")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        # SuperAdmin emas bo'lsa, texnikumni requestdan oladi
        if request and not (request.user.is_superuser or request.user.role == 'superadmin'):
            attrs['texnikum'] = request.user.texnikum
        return attrs


# ─────────────────────────────────────────────
#  EMPLOYEE ATTENDANCE
# ─────────────────────────────────────────────
class EmployeeAttendanceSerializer(serializers.ModelSerializer):
    employee_name    = serializers.CharField(source='employee.full_name', read_only=True)
    texnikum_name    = serializers.CharField(source='texnikum.name', read_only=True)
    arrival_type_display   = serializers.CharField(source='get_arrival_type_display', read_only=True)
    departure_type_display = serializers.CharField(source='get_departure_type_display', read_only=True)

    class Meta:
        model = EmployeeAttendance
        fields = [
            'id', 'employee', 'employee_name', 'texnikum', 'texnikum_name',
            'date',
            'arrival_time', 'arrival_latitude', 'arrival_longitude',
            'arrival_distance', 'arrival_type', 'arrival_type_display',
            'departure_time', 'departure_latitude', 'departure_longitude',
            'departure_type', 'departure_type_display',
            'late_minutes', 'early_leave_minutes',
            'status', 'employee_status', 'created_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'employee_name', 'texnikum_name',
            'arrival_type_display', 'departure_type_display',
            'late_minutes', 'early_leave_minutes', 'employee_status'
        ]


class AttendanceCheckInSerializer(serializers.Serializer):
    """GPS orqali kelish uchun input."""
    latitude  = serializers.FloatField()
    longitude = serializers.FloatField()

    def validate_latitude(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError("Latitude qiymati -90 dan 90 gacha bo'lishi kerak!")
        return value

    def validate_longitude(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError("Longitude qiymati -180 dan 180 gacha bo'lishi kerak!")
        return value


class AttendanceSummarySerializer(serializers.Serializer):
    """Davomat umumiy hisoboti uchun."""
    employee_id     = serializers.IntegerField()
    employee_name   = serializers.CharField()
    total_days      = serializers.IntegerField()
    present_days    = serializers.IntegerField()
    absent_days     = serializers.IntegerField()
    late_days       = serializers.IntegerField()
    total_late_min  = serializers.IntegerField()
    attendance_percent = serializers.FloatField()


# ─────────────────────────────────────────────
#  PAYROLL
# ─────────────────────────────────────────────
class PayrollSerializer(serializers.ModelSerializer):
    employee_name   = serializers.CharField(source='employee.full_name', read_only=True)
    texnikum_name   = serializers.CharField(source='texnikum.name', read_only=True)
    status_display  = serializers.CharField(source='get_status_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'texnikum', 'texnikum_name',
            'year', 'month',
            'base_salary', 'working_days', 'present_days',
            'late_minutes', 'late_penalty', 'bonus', 'deductions', 'net_salary',
            'status', 'status_display',
            'approved_by', 'approved_by_name', 'approved_at',
            'note', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'employee_name', 'texnikum_name',
            'status_display', 'approved_by_name', 'net_salary'
        ]

    def validate(self, attrs):
        if attrs.get('base_salary', 0) < 0:
            raise serializers.ValidationError({"base_salary": "Maosh manfiy bo'lishi mumkin emas!"})
        return attrs


class PayrollApproveSerializer(serializers.Serializer):
    """Oylikni tasdiqlash uchun."""
    note = serializers.CharField(required=False, allow_blank=True)


# ─────────────────────────────────────────────
#  EXPENSE
# ─────────────────────────────────────────────
class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    texnikum_name    = serializers.CharField(source='texnikum.name', read_only=True)
    created_by_name  = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'texnikum', 'texnikum_name',
            'category', 'category_display', 'title', 'amount',
            'date', 'receipt', 'description',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'texnikum_name', 'category_display', 'created_by_name']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Xarajat summasi 0 dan katta bo'lishi kerak!")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['created_by'] = request.user
            if not validated_data.get('texnikum'):
                validated_data['texnikum'] = request.user.texnikum
        return super().create(validated_data)


class ExpenseSummarySerializer(serializers.Serializer):
    """Xarajatlar umumiy hisoboti."""
    category        = serializers.CharField()
    category_display = serializers.CharField()
    total_amount    = serializers.DecimalField(max_digits=14, decimal_places=2)
    count           = serializers.IntegerField()