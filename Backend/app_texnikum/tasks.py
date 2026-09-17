from celery import shared_task
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import date, datetime, timedelta
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
#  YORDAMCHI: Push Notification yuborish
# ─────────────────────────────────────────────
def send_push_notification(user, title, body, notif_type='system'):
    """
    Foydalanuvchiga push notification yuborish.
    Hozircha DB ga yozadi — keyinchalik Firebase FCM ulanadi.
    """
    try:
        from app_talaba.models import Notification
        Notification.objects.create(
            texnikum=user.texnikum,
            title=title,
            body=body,
            notif_type=notif_type,
            target_type='all',
            target_user=user,
        )
        logger.info(f"Push notification yuborildi: {user.username} → {title}")
        return True
    except Exception as e:
        logger.error(f"Push notification xatosi: {e}")
        return False


def get_today_schedule(employee):
    """Xodimning bugungi ish jadvalini qaytaradi."""
    if not employee.schedule:
        return None
    weekday_names = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
    today_name = weekday_names[date.today().weekday()]
    return next((item for item in employee.schedule if item.get("day") == today_name), None)


# ─────────────────────────────────────────────
#  1. KELMAGAN XODIMLARNI OGOHLANTIRISH
# ─────────────────────────────────────────────
@shared_task(name='app_texnikum.tasks.notify_absent_employees')
def notify_absent_employees():
    """
    Har 5 daqiqada ishlaydi.
    Ish vaqti boshlanishidan 5 daqiqa o'tgan, hali davomatdan o'tmagan
    xodimlar uchun push notification yuboradi.
    """
    from .models import Employee, EmployeeAttendance, EmployeeStatus

    now   = timezone.localtime(timezone.now())
    today = date.today()

    # Bugun ish kuni emasmi?
    weekday_names = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
    today_name = weekday_names[today.weekday()]

    notified_count = 0
    employees = Employee.objects.filter(is_active=True).select_related('user', 'texnikum')

    for emp in employees:
        try:
            # Jadval bormi?
            today_schedule = get_today_schedule(emp)
            if not today_schedule:
                continue

            # Ish vaqti boshlanishi
            schedule_start = datetime.strptime(today_schedule['from'], "%H:%M")
            notify_after   = schedule_start + timedelta(minutes=5)

            # Hozir ogohlantirish vaqtimi?
            now_time = now.time().replace(second=0, microsecond=0)
            notify_time = notify_after.time()

            # Faqat boshlanish vaqtidan 5-10 daqiqa o'tganda bir marta xabar yuboramiz
            if not (notify_time <= now_time <= (notify_after + timedelta(minutes=5)).time()):
                continue

            # Xodim holati (ta'til, kasallik...)
            active_status = EmployeeStatus.get_active_status(emp, today)
            if active_status:
                continue

            # Allaqachon kelganmi?
            already_checked_in = EmployeeAttendance.objects.filter(
                employee=emp, date=today, arrival_time__isnull=False
            ).exists()
            if already_checked_in:
                continue

            # Push xabar yuborish
            if emp.user:
                send_push_notification(
                    user=emp.user,
                    title="⏰ Davomat eslatmasi!",
                    body=f"Salom {emp.full_name}! Siz hali davomatdan o'tmagansiz. Iltimos, ilovani oching va 'KELDIM' tugmasini bosing.",
                    notif_type='attendance'
                )
                notified_count += 1

        except Exception as e:
            logger.error(f"Xodim {emp.id} uchun xabar yuborishda xato: {e}")
            continue

    logger.info(f"notify_absent_employees: {notified_count} ta xodimga xabar yuborildi.")
    return f"{notified_count} ta xodimga xabar yuborildi."


# ─────────────────────────────────────────────
#  2. XODIMLAR AVTO-CHIQISH (Auto Check-out)
# ─────────────────────────────────────────────
@shared_task(name='app_texnikum.tasks.auto_checkout_employees')
def auto_checkout_employees():
    """
    Har kuni 23:00 da ishlaydi.
    Keldi, lekin ketmadi deb belgilagan xodimlarni avtomatik chiqaradi.
    Admin panelida qizil belgi bilan ko'rinadi.
    """
    from .models import Employee, EmployeeAttendance

    today  = date.today()
    now    = timezone.localtime(timezone.now()).time()

    # Kelish bor, ketish yo'q bo'lgan yozuvlar
    pending = EmployeeAttendance.objects.filter(
        date=today,
        arrival_time__isnull=False,
        departure_time__isnull=True
    ).select_related('employee__user', 'employee__texnikum')

    auto_count = 0
    for att in pending:
        try:
            # Xodimning jadvalidagi tugash vaqtini olish
            emp = att.employee
            today_schedule = get_today_schedule(emp)

            if today_schedule:
                end_time_str = today_schedule.get('to', '18:00')
                end_time = datetime.strptime(end_time_str, "%H:%M").time()
            else:
                end_time = now

            att.departure_time  = end_time
            att.departure_type  = 'auto'
            att.status          = att.status + " | Avto-chiqish (tizim)"
            att.save()

            # Xodimga xabar yuborish
            if emp.user:
                send_push_notification(
                    user=emp.user,
                    title="🔔 Avto-chiqish amalga oshirildi",
                    body=f"{emp.full_name}, siz 'KETDIM' tugmasini bosmadingiz. Tizim sizni avtomatik chiqardi. Ertaga unutmang!",
                    notif_type='attendance'
                )

            auto_count += 1
        except Exception as e:
            logger.error(f"Auto checkout xatosi (att_id={att.id}): {e}")
            continue

    logger.info(f"auto_checkout_employees: {auto_count} ta yozuv avtomatik yopildi.")
    return f"{auto_count} ta xodim avto-chiqarildi."


# ─────────────────────────────────────────────
#  3. OYLIK MAOSH HISOBLASH (Payroll Engine)
# ─────────────────────────────────────────────
@shared_task(name='app_texnikum.tasks.calculate_monthly_payroll')
def calculate_monthly_payroll():
    """
    Har oyning 1-sanasida ishlaydi.
    O'tgan oyning maosh hisob-kitobini avtomatik yaratadi:
      Net maosh = Asosiy maosh - Kechikish jarimasi - Boshqa chegirmalar + Bonus
    """
    from .models import Employee, EmployeeAttendance, EmployeeStatus, Payroll
    from app_talaba.models import Notification

    today      = date.today()
    # O'tgan oy
    first_day_this_month = today.replace(day=1)
    last_day_prev_month  = first_day_this_month - timedelta(days=1)
    year  = last_day_prev_month.year
    month = last_day_prev_month.month
    first_day = last_day_prev_month.replace(day=1)
    last_day  = last_day_prev_month

    logger.info(f"Oylik hisoblash boshlandi: {year}/{month:02d}")

    # Ish kunlari soni (dushanba-juma = 5 kun * hafta soni)
    total_working_days = sum(
        1 for d in range((last_day - first_day).days + 1)
        if (first_day + timedelta(days=d)).weekday() < 5  # 0=Dushanba, 4=Juma
    )

    employees  = Employee.objects.filter(is_active=True).select_related('texnikum')
    created    = 0
    skipped    = 0

    for emp in employees:
        try:
            # Allaqachon hisoblangan bo'lsa o'tkazib yuborish
            if Payroll.objects.filter(employee=emp, year=year, month=month).exists():
                skipped += 1
                continue

            # Bu oy davomatlari
            attendances = EmployeeAttendance.objects.filter(
                employee=emp,
                date__range=[first_day, last_day]
            )

            present_days  = attendances.filter(arrival_time__isnull=False).count()
            total_late_min = attendances.aggregate(total=Sum('late_minutes'))['total'] or 0

            # Kechikish jarimasi hisoblash
            # Qoida: har 1 daqiqa kechikish = soatlik stavkaning 1/60 i
            # Soatlik stavka = Oylik maosh / (ish kunlari * 8 soat)
            base_salary     = emp.base_salary
            hourly_rate     = base_salary / (total_working_days * 8) if total_working_days > 0 else 0
            minute_rate     = hourly_rate / 60
            late_penalty    = round(float(minute_rate) * total_late_min, 2)

            # Ta'til kunlari (ularga jarima yo'q)
            vacation_days = EmployeeStatus.objects.filter(
                employee=emp,
                from_date__lte=last_day,
                to_date__gte=first_day
            ).count()

            # Net maosh
            net_salary = float(base_salary) - late_penalty
            if net_salary < 0:
                net_salary = 0

            payroll = Payroll.objects.create(
                employee=emp,
                texnikum=emp.texnikum,
                year=year,
                month=month,
                base_salary=base_salary,
                working_days=total_working_days,
                present_days=present_days,
                late_minutes=total_late_min,
                late_penalty=late_penalty,
                bonus=0,
                deductions=0,
                net_salary=net_salary,
                status='draft',
                note=f"Avtomatik hisoblandi. Ta'til kunlari: {vacation_days}."
            )

            # Direktorga xabar: tasdiqlanishi kerak
            from users.models import CustomUser
            directors = CustomUser.objects.filter(
                texnikum=emp.texnikum, role='director', is_active=True
            )
            for director in directors:
                send_push_notification(
                    user=director,
                    title="💰 Oylik hisob-kitob tayyor",
                    body=f"{emp.full_name} uchun {year}/{month:02d} oylik hisoboti tayyor. "
                         f"Net maosh: {net_salary:,.0f} so'm. Tasdiqlashni unutmang!",
                    notif_type='system'
                )

            created += 1

        except Exception as e:
            logger.error(f"Payroll hisoblashda xato (emp_id={emp.id}): {e}")
            continue

    logger.info(f"calculate_monthly_payroll: {created} ta yaratildi, {skipped} ta o'tkazildi.")
    return f"{year}/{month:02d} oy: {created} ta oylik yaratildi, {skipped} ta allaqachon mavjud edi."


# ─────────────────────────────────────────────
#  4. HAFTALIK DAVOMAT HISOBOTI
# ─────────────────────────────────────────────
@shared_task(name='app_texnikum.tasks.send_weekly_attendance_report')
def send_weekly_attendance_report():
    """
    Har dushanba kuni 08:00 da o'tgan hafta hisobotini
    Director va Founder ga yuboradi.
    """
    from .models import Employee, EmployeeAttendance, Texnikum
    from users.models import CustomUser

    today      = date.today()
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_sunday = last_monday + timedelta(days=6)

    texnikumlar = Texnikum.objects.filter(is_active=True)

    for texnikum in texnikumlar:
        try:
            total_emp   = Employee.objects.filter(texnikum=texnikum, is_active=True).count()
            total_att   = EmployeeAttendance.objects.filter(
                texnikum=texnikum,
                date__range=[last_monday, last_sunday],
                arrival_time__isnull=False
            ).count()
            late_count  = EmployeeAttendance.objects.filter(
                texnikum=texnikum,
                date__range=[last_monday, last_sunday],
                late_minutes__gt=0
            ).count()
            total_late_min = EmployeeAttendance.objects.filter(
                texnikum=texnikum,
                date__range=[last_monday, last_sunday]
            ).aggregate(total=Sum('late_minutes'))['total'] or 0

            # Ish kunlari (dush-juma = 5 kun)
            working_days = 5
            expected     = total_emp * working_days
            percent      = round(total_att / expected * 100, 1) if expected else 0

            report_text = (
                f"📊 Haftalik davomat hisoboti\n"
                f"Sana: {last_monday} — {last_sunday}\n"
                f"Jami xodimlar: {total_emp}\n"
                f"Kutilgan davomat: {expected}\n"
                f"Haqiqiy davomat: {total_att} ({percent}%)\n"
                f"Kechikganlar: {late_count} ta\n"
                f"Jami kechikish: {total_late_min} daqiqa"
            )

            # Director va Founderlarga yuborish
            managers = CustomUser.objects.filter(
                texnikum=texnikum,
                role__in=['director', 'founder'],
                is_active=True
            )
            for manager in managers:
                send_push_notification(
                    user=manager,
                    title=f"📊 {texnikum.name} — Haftalik hisobot",
                    body=report_text,
                    notif_type='system'
                )

        except Exception as e:
            logger.error(f"Haftalik hisobot xatosi (texnikum_id={texnikum.id}): {e}")
            continue

    return "Haftalik hisobotlar yuborildi."


# ─────────────────────────────────────────────
#  5. KECHIKISH JARIMA TRIGGER (Real-time)
# ─────────────────────────────────────────────
@shared_task(name='app_texnikum.tasks.process_late_penalty')
def process_late_penalty(attendance_id):
    """
    Xodim 'KELDIM' bosganda darhol chaqiriladi.
    Kechikish daqiqalarini va jarimani Payroll ga yozadi.
    """
    from .models import EmployeeAttendance, Payroll

    try:
        att = EmployeeAttendance.objects.select_related('employee', 'texnikum').get(pk=attendance_id)
    except EmployeeAttendance.DoesNotExist:
        logger.error(f"process_late_penalty: att_id={attendance_id} topilmadi.")
        return

    if att.late_minutes <= 0:
        return  # Kechikish yo'q — jarima yo'q

    today = date.today()
    emp   = att.employee

    # Bu oyning payroll yozuvini topish yoki yaratish
    payroll, created = Payroll.objects.get_or_create(
        employee=emp,
        texnikum=emp.texnikum,
        year=today.year,
        month=today.month,
        defaults={
            'base_salary': emp.base_salary,
            'status': 'draft',
            'note': 'Joriy oy (hisoblanmoqda...)'
        }
    )

    # Kechikish daqiqalarini qo'shish
    payroll.late_minutes += att.late_minutes

    # Jarima hisoblash
    working_days = 22  # O'rtacha oy ish kunlari
    hourly_rate  = float(emp.base_salary) / (working_days * 8)
    minute_rate  = hourly_rate / 60
    new_penalty  = round(minute_rate * att.late_minutes, 2)

    payroll.late_penalty = float(payroll.late_penalty) + new_penalty
    payroll.net_salary   = float(payroll.base_salary) - float(payroll.late_penalty) + float(payroll.bonus) - float(payroll.deductions)
    if payroll.net_salary < 0:
        payroll.net_salary = 0
    payroll.save()

    logger.info(
        f"process_late_penalty: {emp.full_name} — {att.late_minutes} daqiqa kechikish, "
        f"{new_penalty:.2f} so'm jarima."
    )

    # Xodimga xabar
    if emp.user:
        send_push_notification(
            user=emp.user,
            title="⚠️ Kechikish qayd etildi",
            body=f"Siz bugun {att.late_minutes} daqiqa kechikdingiz. "
                 f"Oylik maoshingizdan {new_penalty:,.0f} so'm minus qilinadi.",
            notif_type='attendance'
        )

    return f"Jarima hisoblandi: {new_penalty:.2f} so'm"