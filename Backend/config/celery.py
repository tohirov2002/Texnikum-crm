import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('met_texnikum')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ─────────────────────────────────────────────
#  AVTOMATIK VAZIFALAR JADVALI (Cron Jobs)
# ─────────────────────────────────────────────
app.conf.beat_schedule = {

    # ── Har 5 daqiqada: kelmagan xodimlar va talabalarga push xabar ──
    'notify-absent-employees': {
        'task': 'app_texnikum.tasks.notify_absent_employees',
        'schedule': crontab(minute='*/5'),
    },
    'notify-absent-students': {
        'task': 'app_talaba.tasks.notify_absent_students',
        'schedule': crontab(minute='*/5'),
    },

    # ── Har kuni kechqurun 23:00 da: auto check-out ──────────────────
    'auto-checkout-employees': {
        'task': 'app_texnikum.tasks.auto_checkout_employees',
        'schedule': crontab(hour=23, minute=0),
    },
    'auto-checkout-students': {
        'task': 'app_talaba.tasks.auto_checkout_students',
        'schedule': crontab(hour=23, minute=0),
    },

    # ── Har kuni 00:05 da: ertangi darslar uchun eslatma ─────────────
    'send-tomorrow-lesson-reminders': {
        'task': 'app_talaba.tasks.send_lesson_reminders',
        'schedule': crontab(hour=0, minute=5),
    },

    # ── Har oyning oxirgi kunida: oylik maosh hisoblash ───────────────
    # (1-chi sanada o'tgan oyniki hisoblanadi)
    'calculate-monthly-payroll': {
        'task': 'app_texnikum.tasks.calculate_monthly_payroll',
        'schedule': crontab(hour=1, minute=0, day_of_month=1),
    },

    # ── Har kuni 09:00 da: kelmagan talabalar ota-onasiga SMS ────────
    'notify-parents-absent-students': {
        'task': 'app_talaba.tasks.notify_parents_about_absent_students',
        'schedule': crontab(hour=9, minute=0),
    },

    # ── Har haftada dushanba 08:00 da: haftalik hisobot ─────────────
    'weekly-attendance-report': {
        'task': 'app_texnikum.tasks.send_weekly_attendance_report',
        'schedule': crontab(hour=8, minute=0, day_of_week=1),
    },

    # ── Har oyda 1-sanada: qarzdor talabalar eslatmasi ───────────────
    'monthly-debt-reminder': {
        'task': 'app_talaba.tasks.send_debt_reminders',
        'schedule': crontab(hour=10, minute=0, day_of_month=1),
    },
}

app.conf.timezone = 'Asia/Tashkent'