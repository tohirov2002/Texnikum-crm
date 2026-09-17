from django.db import models
from django.db.models import JSONField
from datetime import date


# ─────────────────────────────────────────────
#  1. FAN (Subject)
# ─────────────────────────────────────────────
class Subject(models.Model):
    """
    O'quv fanlari.
    Masalan: Matematika, Fizika, Informatika
    """
    texnikum    = models.ForeignKey('app_texnikum.Texnikum', on_delete=models.CASCADE, related_name='subjects')
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    hours       = models.IntegerField(default=0, help_text="Jami soatlar")
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Fan'
        verbose_name_plural = 'Fanlar'
        unique_together = ('texnikum', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.texnikum.name})"


# ─────────────────────────────────────────────
#  2. XONA (Room / Auditoriya)
# ─────────────────────────────────────────────
class Room(models.Model):
    """
    Auditoriyalar va xonalar.
    """
    texnikum  = models.ForeignKey('app_texnikum.Texnikum', on_delete=models.CASCADE, related_name='rooms')
    name      = models.CharField(max_length=100, help_text="Xona nomi, masalan: 101-xona")
    capacity  = models.IntegerField(default=30, help_text="Sig'imi (talabalar soni)")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Xona'
        verbose_name_plural = 'Xonalar'
        unique_together = ('texnikum', 'name')

    def __str__(self):
        return f"{self.name} ({self.texnikum.name})"


# ─────────────────────────────────────────────
#  3. GURUH (Group)
# ─────────────────────────────────────────────
class Group(models.Model):
    """
    O'quv guruhlari.
    Har bir guruhning o'qituvchisi va jadvali bor.
    """
    texnikum    = models.ForeignKey('app_texnikum.Texnikum', on_delete=models.CASCADE, related_name='groups')
    department  = models.ForeignKey(
        'app_texnikum.Department', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='groups'
    )
    name        = models.CharField(max_length=100, help_text="Masalan: 1-IT-24")
    teacher     = models.ForeignKey(
        'app_texnikum.Employee', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='teaching_groups',
        help_text="Asosiy o'qituvchi"
    )
    subject     = models.ForeignKey(
        Subject, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='groups'
    )
    room        = models.ForeignKey(
        Room, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='groups'
    )

    # Dars vaqtlari (JSON)
    # Misol: [{"day": "Dushanba", "from": "09:00", "to": "11:00"}, ...]
    schedule    = JSONField(null=True, blank=True, help_text="Haftalik dars jadvali")

    start_date  = models.DateField(null=True, blank=True, help_text="Guruh boshlanish sanasi")
    end_date    = models.DateField(null=True, blank=True, help_text="Guruh tugash sanasi")
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Guruh'
        verbose_name_plural = 'Guruhlar'
        unique_together = ('texnikum', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} — {self.texnikum.name}"

    @property
    def students_count(self):
        return self.students.filter(is_active=True).count()


# ─────────────────────────────────────────────
#  4. TALABA (Student)
# ─────────────────────────────────────────────
class Student(models.Model):
    """
    Talaba modeli.
    users.CustomUser bilan bog'liq (1:1).
    """
    GENDER_CHOICES = (
        ('male',   'Erkak'),
        ('female', 'Ayol'),
    )
    STATUS_CHOICES = (
        ('active',    'O\'qiydi'),
        ('expelled',  'Haydalgan'),
        ('graduated', 'Bitirgan'),
        ('academic',  'Akademik ta\'til'),
        ('transfer',  'Ko\'chirilgan'),
    )

    # Asosiy bog'liqlik
    user        = models.OneToOneField(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='student_profile'
    )
    texnikum    = models.ForeignKey(
        'app_texnikum.Texnikum', on_delete=models.CASCADE, related_name='students'
    )
    group       = models.ForeignKey(
        Group, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='students'
    )

    # Shaxsiy ma'lumotlar
    full_name       = models.CharField(max_length=200)
    birth_date      = models.DateField(null=True, blank=True)
    gender          = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    address         = models.CharField(max_length=500, blank=True)
    phone_number    = models.CharField(max_length=15, blank=True)
    photo           = models.ImageField(upload_to='students/photos/', null=True, blank=True)

    # Ota-ona ma'lumotlari
    parent_name     = models.CharField(max_length=200, blank=True)
    parent_phone    = models.CharField(max_length=15, blank=True)

    # O'quv ma'lumotlari
    student_id      = models.CharField(max_length=50, blank=True, help_text="Talaba ID raqami")
    enrollment_date = models.DateField(null=True, blank=True, help_text="Qabul qilingan sana")
    study_status    = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')

    # Moliya
    contract_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Shartnoma summasi (so'm)"
    )
    paid_amount     = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="To'langan summa (so'm)"
    )

    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Talaba'
        verbose_name_plural = 'Talabalar'
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.group})"

    @property
    def debt_amount(self):
        """Qoldiq qarz."""
        return self.contract_amount - self.paid_amount


# ─────────────────────────────────────────────
#  5. TO'LOV (Payment)
# ─────────────────────────────────────────────
class Payment(models.Model):
    """
    Talaba to'lovlari.
    """
    PAYMENT_METHODS = (
        ('cash',     'Naqd'),
        ('card',     'Plastik karta'),
        ('transfer', 'Bank o\'tkazmasi'),
    )

    student     = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    texnikum    = models.ForeignKey('app_texnikum.Texnikum', on_delete=models.CASCADE, related_name='payments')
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    method      = models.CharField(max_length=10, choices=PAYMENT_METHODS, default='cash')
    date        = models.DateField(default=date.today)
    description = models.TextField(blank=True)
    created_by  = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='created_payments'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'To\'lov'
        verbose_name_plural = 'To\'lovlar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.full_name} — {self.amount} so'm ({self.date})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Talabaning paid_amount ni yangilash
        from django.db.models import Sum
        total = Payment.objects.filter(student=self.student).aggregate(Sum('amount'))['amount__sum'] or 0
        self.student.paid_amount = total
        self.student.save(update_fields=['paid_amount'])


# ─────────────────────────────────────────────
#  6. DARS (Lesson)
# ─────────────────────────────────────────────
class Lesson(models.Model):
    """
    Har bir o'tkazilgan dars yozuvi.
    O'qituvchi dars boshlaganda yaratiladi.
    """
    group       = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='lessons')
    teacher     = models.ForeignKey(
        'app_texnikum.Employee', on_delete=models.SET_NULL,
        null=True, related_name='lessons'
    )
    subject     = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, related_name='lessons')
    room        = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='lessons')
    date        = models.DateField(default=date.today)
    start_time  = models.TimeField()
    end_time    = models.TimeField(null=True, blank=True)
    topic       = models.CharField(max_length=500, blank=True, help_text="Dars mavzusi")
    homework    = models.TextField(blank=True, help_text="Uy vazifasi")
    note        = models.TextField(blank=True)
    is_finished = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Dars'
        verbose_name_plural = 'Darslar'
        ordering = ['-date', '-start_time']

    def __str__(self):
        return f"{self.group.name} — {self.subject} — {self.date}"


# ─────────────────────────────────────────────
#  7. TALABA DAVOMATI (Student Attendance)
# ─────────────────────────────────────────────
class StudentAttendance(models.Model):
    """
    Talabalar davomati — har bir dars uchun.
    GPS yoki o'qituvchi tomonidan belgilanadi.
    """
    STATUS_CHOICES = (
        ('present',      'Keldi'),
        ('absent',       'Kelmadi'),
        ('late',         'Kechikdi'),
        ('excused',      'Sababli yo\'q'),
        ('left_early',   'Erta ketdi'),
    )
    CHECK_TYPE = (
        ('gps',    'GPS orqali'),
        ('manual', 'O\'qituvchi tomonidan'),
        ('auto',   'Avto (tizim)'),
    )

    lesson      = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='attendances')
    student     = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    group       = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='student_attendances')
    date        = models.DateField(default=date.today)

    # Kelish
    arrival_time      = models.TimeField(null=True, blank=True)
    arrival_latitude  = models.FloatField(null=True, blank=True)
    arrival_longitude = models.FloatField(null=True, blank=True)
    arrival_distance  = models.FloatField(null=True, blank=True, help_text="Texnikumdan masofa (metr)")

    # Ketish
    departure_time    = models.TimeField(null=True, blank=True)

    status      = models.CharField(max_length=15, choices=STATUS_CHOICES, default='absent')
    check_type  = models.CharField(max_length=10, choices=CHECK_TYPE, default='gps')
    note        = models.TextField(blank=True, help_text="O'qituvchi izohi")

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Talaba Davomati'
        verbose_name_plural = 'Talabalar Davomati'
        unique_together = ('lesson', 'student')
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.full_name} — {self.lesson} — {self.get_status_display()}"


# ─────────────────────────────────────────────
#  8. BAHO (Grade)
# ─────────────────────────────────────────────
class Grade(models.Model):
    """
    Talaba baholari.
    """
    GRADE_TYPES = (
        ('homework',  'Uy vazifasi'),
        ('classwork', 'Dars ishi'),
        ('exam',      'Imtihon'),
        ('quiz',      'Nazorat ishi'),
        ('project',   'Loyiha'),
    )

    student     = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    lesson      = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True, related_name='grades')
    subject     = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, related_name='grades')
    grade_type  = models.CharField(max_length=15, choices=GRADE_TYPES)
    score       = models.DecimalField(max_digits=5, decimal_places=2, help_text="Ball (masalan: 85.5)")
    max_score   = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    date        = models.DateField(default=date.today)
    comment     = models.TextField(blank=True)
    given_by    = models.ForeignKey(
        'app_texnikum.Employee', on_delete=models.SET_NULL,
        null=True, related_name='given_grades'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Baho'
        verbose_name_plural = 'Baholar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.full_name} — {self.subject} — {self.score}/{self.max_score}"

    @property
    def percentage(self):
        if self.max_score > 0:
            return round(float(self.score) / float(self.max_score) * 100, 1)
        return 0


# ─────────────────────────────────────────────
#  9. BILDIRISHNOMA (Notification)
# ─────────────────────────────────────────────
class Notification(models.Model):
    """
    Tizim bildirishnomalari.
    Admin → xodimga, O'qituvchi → guruhga, Tizim → avtomatik.
    """
    TYPE_CHOICES = (
        ('attendance',  'Davomat eslatmasi'),
        ('payment',     'To\'lov eslatmasi'),
        ('homework',    'Uy vazifasi'),
        ('announcement','E\'lon'),
        ('system',      'Tizim xabari'),
    )
    TARGET_CHOICES = (
        ('all',      'Hammaga'),
        ('group',    'Guruhga'),
        ('student',  'Talabaga'),
        ('teacher',  'O\'qituvchiga'),
        ('staff',    'Xodimlarga'),
    )

    texnikum    = models.ForeignKey('app_texnikum.Texnikum', on_delete=models.CASCADE, related_name='notifications')
    title       = models.CharField(max_length=300)
    body        = models.TextField()
    notif_type  = models.CharField(max_length=15, choices=TYPE_CHOICES, default='announcement')
    target_type = models.CharField(max_length=10, choices=TARGET_CHOICES, default='all')

    # Kimga yuborildi
    target_group    = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True)
    target_student  = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True)
    target_user     = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='received_notifications')

    sent_by     = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='sent_notifications'
    )
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Bildirishnoma'
        verbose_name_plural = 'Bildirishnomalar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — {self.created_at.strftime('%Y-%m-%d %H:%M')}"