from django.db import models
from django.contrib.auth.hashers import make_password
from django.db.models import JSONField
from django.utils import timezone
from datetime import date


# ─────────────────────────────────────────────
#  1. TEXNIKUM (asosiy tashkilot)
# ─────────────────────────────────────────────
class Texnikum(models.Model):
    """
    MET Texnikum asosiy modeli.
    SuperAdmin tomonidan yaratiladi.
    Founder o'z texnikumini boshqaradi.
    """
    name         = models.CharField(max_length=200)
    address      = models.CharField(max_length=500)
    phone        = models.CharField(max_length=20, blank=True)
    email        = models.EmailField(blank=True)
    logo         = models.ImageField(upload_to='texnikum/logos/', null=True, blank=True)

    # GPS — texnikum binosi koordinatalari (davomat uchun)
    latitude     = models.FloatField(null=True, blank=True, help_text="Texnikum GPS kenglik")
    longitude    = models.FloatField(null=True, blank=True, help_text="Texnikum GPS uzunlik")
    gps_radius   = models.IntegerField(default=100, help_text="Davomat uchun radius (metr)")

    # SaaS — litsenziya va obuna
    is_active         = models.BooleanField(default=True)
    subscription_end  = models.DateField(null=True, blank=True)

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)  

    class Meta:
        verbose_name = 'Texnikum'
        verbose_name_plural = 'Texnikumlar'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def is_subscription_active(self):
        if not self.subscription_end:
            return True
        return self.subscription_end >= date.today()


# ─────────────────────────────────────────────
#  2. BO'LIM (Department)
# ─────────────────────────────────────────────
class Department(models.Model):
    """
    Texnikum ichidagi bo'limlar / yo'nalishlar.
    Masalan: Informatika bo'limi, Iqtisodiyot bo'limi
    """
    texnikum     = models.ForeignKey(Texnikum, on_delete=models.CASCADE, related_name='departments')
    name         = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Bo\'lim'
        verbose_name_plural = 'Bo\'limlar'
        unique_together = ('texnikum', 'name')

    def __str__(self):
        return f"{self.texnikum.name} — {self.name}"


# ─────────────────────────────────────────────
#  3. LAVOZIM (Position)
# ─────────────────────────────────────────────
class Position(models.Model):
    """
    Xodimlar lavozimi (o'qituvchi, laborant, xo'jalik mudiri va h.k.)
    """
    texnikum     = models.ForeignKey(Texnikum, on_delete=models.CASCADE, related_name='positions')
    name         = models.CharField(max_length=100)
    description  = models.TextField(blank=True)

    class Meta:
        unique_together = ('texnikum', 'name')

    def __str__(self):
        return f"{self.name} ({self.texnikum.name})"


# ─────────────────────────────────────────────
#  4. XODIM (Employee / Teacher)
# ─────────────────────────────────────────────
class Employee(models.Model):
    """
    Texnikum xodimlari — o'qituvchilar, ma'murlar va boshqa xodimlar.
    users.CustomUser bilan bog'liq (1:1).
    """
    EMPLOYMENT_TYPES = (
        ('full_time',  'To\'liq stavka'),
        ('part_time',  'Yarim stavka'),
        ('contract',   'Shartnoma asosida'),
        ('hourly',     'Soatbay'),
    )

    # Asosiy bog'liqlik
    user         = models.OneToOneField(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='employee_profile'
    )
    texnikum     = models.ForeignKey(Texnikum, on_delete=models.CASCADE, related_name='employees')
    department   = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    position     = models.ForeignKey(Position, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')

    # Shaxsiy ma'lumotlar
    full_name    = models.CharField(max_length=200)
    birth_date   = models.DateField(null=True, blank=True)
    address      = models.CharField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    photo        = models.ImageField(upload_to='employees/photos/', null=True, blank=True)

    # Ish ma'lumotlari
    employment_type  = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='full_time')
    base_salary      = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                            help_text="Asosiy oylik maosh (so'm)")
    work_start_date  = models.DateField(null=True, blank=True, help_text="Ishga kirgan sana")

    # Ish vaqti grafigi (JSON)
    # Misol: [{"day": "Dushanba", "from": "08:00", "to": "17:00"}, ...]
    schedule         = JSONField(null=True, blank=True, help_text="Haftalik ish jadvali")

    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Xodim'
        verbose_name_plural = 'Xodimlar'
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.texnikum.name})"


# ─────────────────────────────────────────────
#  5. XODIM STATUS (Ta'til, Kasallik va h.k.)
# ─────────────────────────────────────────────
class EmployeeStatus(models.Model):
    """
    Xodimning vaqtinchalik holati.
    Bu status mavjud bo'lganda davomat jarimasi qo'shilmaydi.
    """
    STATUS_CHOICES = (
        ('vacation',      'Ta\'tilda'),
        ('sick_leave',    'Kasal varaqasi'),
        ('business_trip', 'Xizmat safari'),
        ('day_off',       'Dam olish kuni (ruxsat bilan)'),
        ('unpaid_leave',  'Haqsiz ta\'til'),
    )

    employee     = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='statuses')
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES)
    from_date    = models.DateField()
    to_date      = models.DateField()
    reason       = models.TextField(blank=True, help_text="Sabab")
    approved_by  = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_statuses'
    )
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Xodim Holati'
        verbose_name_plural = 'Xodim Holatlari'
        ordering = ['-from_date']

    def __str__(self):
        return f"{self.employee.full_name} — {self.get_status_display()} ({self.from_date} / {self.to_date})"

    @staticmethod
    def get_active_status(employee, check_date=None):
        """
        Berilgan sanada xodimning aktiv holati.
        Qaytaradi: status string yoki None (agar 'ISHDA' bo'lsa)
        """
        if check_date is None:
            check_date = date.today()

        active = EmployeeStatus.objects.filter(
            employee=employee,
            from_date__lte=check_date,
            to_date__gte=check_date
        ).first()

        return active


# ─────────────────────────────────────────────
#  6. XODIM DAVOMATI (Employee Attendance)
# ─────────────────────────────────────────────
class EmployeeAttendance(models.Model):
    """
    Xodimlar davomati — GPS 100m radius asosida.
    Kechikish avtomatik hisoblanadi va Payroll ga uzatiladi.
    """
    CHECK_TYPE = (
        ('gps',    'GPS orqali'),
        ('manual', 'Qo\'lda (Admin)'),
        ('auto',   'Avto-chiqish (Tizim)'),
    )

    employee     = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    texnikum     = models.ForeignKey(Texnikum, on_delete=models.CASCADE, related_name='employee_attendances')
    date         = models.DateField(default=date.today)

    # Kelish
    arrival_time      = models.TimeField(null=True, blank=True)
    arrival_latitude  = models.FloatField(null=True, blank=True)
    arrival_longitude = models.FloatField(null=True, blank=True)
    arrival_distance  = models.FloatField(null=True, blank=True, help_text="Texnikumdan masofa (metr)")
    arrival_type      = models.CharField(max_length=10, choices=CHECK_TYPE, default='gps')

    # Ketish
    departure_time      = models.TimeField(null=True, blank=True)
    departure_latitude  = models.FloatField(null=True, blank=True)
    departure_longitude = models.FloatField(null=True, blank=True)
    departure_type      = models.CharField(max_length=10, choices=CHECK_TYPE, default='gps')

    # Hisoblangan ma'lumotlar
    late_minutes        = models.IntegerField(default=0, help_text="Kechikkan daqiqalar soni")
    early_leave_minutes = models.IntegerField(default=0, help_text="Erta ketgan daqiqalar")
    status              = models.CharField(max_length=200, blank=True)

    # Xodim holati (ta'til, kasallik va h.k.)
    employee_status     = models.CharField(max_length=20, blank=True,
                                            help_text="O'sha kunda xodim holati (ISHDA, TATILDA...)")

    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Xodim Davomati'
        verbose_name_plural = 'Xodim Davomatlari'
        unique_together = ('employee', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.full_name} — {self.date}"


# ─────────────────────────────────────────────
#  7. OYLIK HISOB-KITOB (Payroll)
# ─────────────────────────────────────────────
class Payroll(models.Model):
    """
    Oylik maosh hisob-kitobi.
    Celery task oylik oxirida avtomatik yaratadi.
    Direktor tasdiqlaydi.
    """
    STATUS_CHOICES = (
        ('draft',    'Hisoblandi (Tasdiqlanmagan)'),
        ('approved', 'Tasdiqlandi'),
        ('paid',     'To\'landi'),
    )

    employee         = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payrolls')
    texnikum         = models.ForeignKey(Texnikum, on_delete=models.CASCADE, related_name='payrolls')
    year             = models.IntegerField()
    month            = models.IntegerField()

    # Hisob-kitob
    base_salary      = models.DecimalField(max_digits=12, decimal_places=2, help_text="Asosiy maosh")
    working_days     = models.IntegerField(default=0, help_text="Ish kunlari soni (joriy oy)")
    present_days     = models.IntegerField(default=0, help_text="Kelgan kunlar soni")
    late_minutes     = models.IntegerField(default=0, help_text="Jami kechikish daqiqalari")
    late_penalty     = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                            help_text="Kechikish jarimasi (so'm)")
    bonus            = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions       = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                            help_text="Boshqa chegirmalar")
    net_salary       = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                            help_text="Qo'lga tegadigan summa")

    status           = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    approved_by      = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_payrolls'
    )
    approved_at      = models.DateTimeField(null=True, blank=True)
    note             = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Oylik Hisob-Kitob'
        verbose_name_plural = 'Oylik Hisob-Kitoblar'
        unique_together = ('employee', 'year', 'month')
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.employee.full_name} — {self.year}/{self.month:02d} ({self.net_salary} so'm)"

    def calculate_net_salary(self):
        """Net maoshni qayta hisoblash."""
        self.net_salary = (
            self.base_salary
            - self.late_penalty
            - self.deductions
            + self.bonus
        )
        if self.net_salary < 0:
            self.net_salary = 0
        return self.net_salary


# ─────────────────────────────────────────────
#  8. XARAJATLAR (Expenses)
# ─────────────────────────────────────────────
class Expense(models.Model):
    """
    Texnikum xarajatlari — ijara, kommunal xizmatlar, ofis buyumlari va h.k.
    Direktor kiritadi, Founder ko'radi.
    """
    CATEGORY_CHOICES = (
        ('rent',       'Ijara'),
        ('utilities',  'Kommunal (elektr, suv, gaz)'),
        ('salary',     'Maosh to\'lovi'),
        ('equipment',  'Jihozlar va inventar'),
        ('marketing',  'Reklama va marketing'),
        ('education',  'O\'quv materiallari'),
        ('transport',  'Transport'),
        ('other',      'Boshqa'),
    )

    texnikum     = models.ForeignKey(Texnikum, on_delete=models.CASCADE, related_name='expenses')
    category     = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title        = models.CharField(max_length=300, help_text="Xarajat nomi")
    amount       = models.DecimalField(max_digits=14, decimal_places=2)
    date         = models.DateField()
    receipt      = models.ImageField(upload_to='expenses/receipts/', null=True, blank=True,
                                      help_text="Chek rasmi")
    description  = models.TextField(blank=True)
    created_by   = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='created_expenses'
    )
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Xarajat'
        verbose_name_plural = 'Xarajatlar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.texnikum.name} | {self.title} — {self.amount} so'm ({self.date})"