from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Lesson


@receiver(post_save, sender=Lesson)
def on_lesson_created(sender, instance, created, **kwargs):
    """
    Yangi dars yaratilganda:
    1. Barcha talabalar uchun 'absent' davomat yozuvlari yaratiladi
    2. Dars tugash vaqtida o'qituvchiga eslatma rejalashtiriladi
    """
    if created:
        from .tasks import create_lesson_attendance_records, notify_lesson_end
        from datetime import datetime, date
        from django.utils import timezone

        # Talabalar uchun 'absent' yozuvlar yaratish
        create_lesson_attendance_records.delay(instance.id)

        # Dars tugash vaqtida eslatma (agar end_time belgilangan bo'lsa)
        if instance.end_time:
            end_dt = datetime.combine(instance.date, instance.end_time)
            end_dt_aware = timezone.make_aware(end_dt, timezone.get_current_timezone())
            notify_lesson_end.apply_async(args=[instance.id], eta=end_dt_aware)