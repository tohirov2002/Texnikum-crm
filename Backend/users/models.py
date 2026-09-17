from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    """
    MET TEXNIKUM asosiy foydalanuvchi modeli.
    6 ta rol ierarxiyasi:
      superadmin  -> Platforma egasi (SaaS)
      founder     -> Texnikum asoschisi
      director    -> Texnikum direktori
      center_admin-> O'quv bo'limi menejeri
      teacher     -> O'qituvchi
      student     -> Talaba
    """
    ROLE_CHOICES = (
        ('superadmin',   'Super Admin'),
        ('founder',      'Ta\'sischi Admin'),
        ('director',     'Direktor'),
        ('center_admin', 'Texnikum Admini'),
        ('teacher',      'O\'qituvchi'),
        ('student',      'Talaba'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='teacher'
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    # Qaysi texnikumga tegishli (superadmin uchun null bo'ladi)
    texnikum = models.ForeignKey(
        'app_texnikum.Texnikum',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='users'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_superadmin(self):
        return self.role == 'superadmin' or self.is_superuser

    @property
    def is_founder(self):
        return self.role == 'founder'

    @property
    def is_director(self):
        return self.role == 'director'

    @property
    def is_center_admin(self):
        return self.role == 'center_admin'

    @property
    def is_teacher(self):
        return self.role == 'teacher'

    @property
    def is_student(self):
        return self.role == 'student'


class AdminLog(models.Model):
    """
    Tizimda amalga oshirilgan barcha muhim amallar logi.
    SuperAdmin va Founder bu loglarni ko'ra oladi.
    """
    ACTION_TYPES = (
        ('create', 'Yaratildi'),
        ('update', 'O\'zgartirildi'),
        ('delete', 'O\'chirildi'),
        ('login',  'Tizimga kirdi'),
        ('logout', 'Tizimdan chiqdi'),
        ('other',  'Boshqa'),
    )

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='logs'
    )
    action_type = models.CharField(max_length=10, choices=ACTION_TYPES, default='other')
    action = models.CharField(max_length=512)
    # Qaysi texnikumda sodir bo'ldi
    texnikum = models.ForeignKey(
        'app_texnikum.Texnikum',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='logs'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Admin Log'
        verbose_name_plural = 'Admin Loglar'

    def __str__(self):
        user_str = self.user.username if self.user else "O'chirilgan foydalanuvchi"
        return f"{user_str} | {self.action} | {self.timestamp.strftime('%Y-%m-%d %H:%M')}"