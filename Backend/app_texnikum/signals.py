from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import EmployeeAttendance


@receiver(post_save, sender=EmployeeAttendance)
def on_attendance_saved(sender, instance, created, **kwargs):
    """
    Xodim davomat yozuvi saqlanganda:
    1. Agar kelish bo'lsa va kechiksa → jarima taskini ishga tushir
    2. Departure_time saqlansa → hech narsa (faqat check-in uchun)
    """
    # Faqat yangi CHECK-IN yozuvi uchun
    if created and instance.arrival_time and instance.late_minutes > 0:
        from .tasks import process_late_penalty
        # Async ravishda jarima hisoblash taskini yuborish
        process_late_penalty.delay(instance.id)