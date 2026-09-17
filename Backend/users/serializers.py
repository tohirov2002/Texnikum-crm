from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import CustomUser, AdminLog

User = get_user_model()


# ─────────────────────────────────────────────
#  JWT TOKEN SERIALIZER
# ─────────────────────────────────────────────
class MetTexnikumTokenSerializer(TokenObtainPairSerializer):
    """
    Login bo'lganda JWT tokenga qo'shimcha ma'lumotlar qo'shadi:
    role, full_name, texnikum_id
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # Token payload ga qo'shimcha field'lar
        data['role'] = user.role if not user.is_superuser else 'superadmin'
        data['full_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
        data['user_id'] = user.id
        data['texnikum_id'] = user.texnikum_id

        # Login logini yozish
        from .models import AdminLog
        AdminLog.objects.create(
            user=user,
            action_type='login',
            action=f"{user.username} tizimga kirdi",
            texnikum=user.texnikum
        )
        return data


# ─────────────────────────────────────────────
#  USER SERIALIZERS
# ─────────────────────────────────────────────
class UserShortSerializer(serializers.ModelSerializer):
    """Qisqa ma'lumot — boshqa serializerlarda ishlatish uchun."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'full_name', 'role', 'phone_number']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class UserSerializer(serializers.ModelSerializer):
    """
    Foydalanuvchi ro'yxati va detail uchun.
    SuperAdmin barcha userlarni ko'radi.
    Founder o'z texnikumidagi userlarni ko'radi.
    """
    full_name = serializers.SerializerMethodField()
    texnikum_name = serializers.CharField(source='texnikum.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'email', 'phone_number', 'role', 'role_display',
            'texnikum', 'texnikum_name', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'full_name', 'texnikum_name', 'role_display']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Yangi foydalanuvchi yaratish uchun.
    SuperAdmin → istalgan rol yarata oladi.
    Founder    → director, center_admin, teacher yarata oladi.
    Director   → center_admin, teacher yarata oladi.
    """
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'first_name', 'last_name', 'email',
            'phone_number', 'role', 'texnikum',
            'password', 'confirm_password'
        ]

    def validate(self, attrs):
        # Parol tasdiqlash
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Parollar mos kelmayapti!"})

        request_user = self.context['request'].user

        # Rol cheklovlari
        target_role = attrs.get('role')
        if request_user.role == 'founder':
            allowed_roles = ['director', 'center_admin', 'teacher']
            if target_role not in allowed_roles:
                raise serializers.ValidationError(
                    {"role": f"Ta'sibchi faqat {', '.join(allowed_roles)} yarata oladi."}
                )
            # Founder faqat o'z texnikumiga user yarata oladi
            attrs['texnikum'] = request_user.texnikum

        elif request_user.role == 'director':
            allowed_roles = ['center_admin', 'teacher']
            if target_role not in allowed_roles:
                raise serializers.ValidationError(
                    {"role": f"Direktor faqat {', '.join(allowed_roles)} yarata oladi."}
                )
            attrs['texnikum'] = request_user.texnikum

        elif not (request_user.is_superuser or request_user.role == 'superadmin'):
            raise serializers.ValidationError("Sizda foydalanuvchi yaratish huquqi yo'q!")

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        # Log yozish
        request_user = self.context['request'].user
        AdminLog.objects.create(
            user=request_user,
            action_type='create',
            action=f"Yangi foydalanuvchi yaratildi: {user.username} (rol: {user.role})",
            texnikum=user.texnikum
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Foydalanuvchi ma'lumotlarini yangilash.
    Parol alohida endpoint orqali o'zgartiriladi.
    """
    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'email',
            'phone_number', 'role', 'is_active'
        ]

    def validate_role(self, value):
        request_user = self.context['request'].user
        target_user = self.instance

        # SuperAdmin rolini hech kim o'zgartira olmaydi
        if target_user and target_user.role == 'superadmin':
            raise serializers.ValidationError("SuperAdmin rolini o'zgartirish mumkin emas!")

        return value

    def update(self, instance, validated_data):
        request_user = self.context['request'].user
        old_role = instance.role

        instance = super().update(instance, validated_data)

        # Log yozish
        AdminLog.objects.create(
            user=request_user,
            action_type='update',
            action=f"Foydalanuvchi yangilandi: {instance.username} "
                   f"(eski rol: {old_role} → yangi rol: {instance.role})",
            texnikum=instance.texnikum
        )
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Parol o'zgartirish."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({"confirm_new_password": "Yangi parollar mos kelmayapti!"})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Eski parol noto'g'ri!")
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


# ─────────────────────────────────────────────
#  ADMIN LOG SERIALIZER
# ─────────────────────────────────────────────
class AdminLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    texnikum_name = serializers.CharField(source='texnikum.name', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)

    class Meta:
        model = AdminLog
        fields = [
            'id', 'user_name', 'user_role', 'action_type',
            'action_type_display', 'action', 'texnikum_name',
            'ip_address', 'timestamp'
        ]
        read_only_fields = fields