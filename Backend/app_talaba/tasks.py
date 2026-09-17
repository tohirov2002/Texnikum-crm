from celery import shared_task
from django.utils import timezone
from django.db.models import Count, Q
from datetime import date, datetime, timedelta
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
#  YORDAMCHI
# ─────────────────────────────────────────────
def send_push_notification(user, title, body, notif_type='system'):
    """Foydalanuvchiga push notification yozish (DB + keyinchalik FCM)."""
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
        logger.info(f"Notification: {user.username} → {title}")
        return True
    except Exception as e:
        logger.error(f"Notification xatosi: {e}")
        return False


def get_today_lesson(student):
    """Talabaning bugungi aktiv darsini topadi."""
    from .models import Lesson
    today = date.today()
    return Lesson.objects.filter(
        group=student.group,
        date=today,
        is_finished=False
    ).first()


def get_ongoing_lesson(student):
    """
    Hozir o'tib turgan (boshlangan, tugamagan) darsni topadi.
    """
    from .models import Lesson
    now   = timezone.localtime(timezone.now()).time()
    today = date.today()
    return Lesson.objects.filter(
        group=student.group,
        date=today,
        start_time__lte=now,
        is_finished=False
    ).first()


# ─────────────────────────────────────────────
#  1. DARSGA KELMAGAN TALABALARGA XABAR
# ─────────────────────────────────────────────
@shared_task(name='app_talaba.tasks.notify_absent_students')
def notify_absent_students():
    """
    Har 5 daqiqada ishlaydi.
    Dars boshlanishidan 5 daqiqa o'tib, hali davomatdan o'tmagan
    talabalarga 'Davomatdan o'ting!' push xabar yuboradi.
    """
    from .models import Student, Lesson, StudentAttendance

    now   = timezone.localtime(timezone.now())
    today = date.today()
    notified = 0

    # Hozir o'tib turgan darslarni topish
    ongoing_lessons = Lesson.objects.filter(
        date=today,
        is_finished=False,
        start_time__lte=now.time()
    ).select_related('group__texnikum')

    for lesson in ongoing_lessons:
        try:
            # Dars boshlanishidan necha daqiqa o'tdi?
            lesson_start_dt = datetime.combine(today, lesson.start_time)
            minutes_elapsed = (datetime.combine(today, now.time()) - lesson_start_dt).total_seconds() / 60

            # Faqat 5-10 daqiqa oralig'ida bir marta xabar yuboramiz
            if not (5 <= minutes_elapsed <= 10):
                continue

            # Bu guruhning kelmaganlari
            absent_students = Student.objects.filter(
                group=lesson.group,
                is_active=True,
                study_status='active'
            ).exclude(
                attendances__lesson=lesson,
                attendances__status__in=['present', 'late']
            )

            for student in absent_students:
                if student.user:
                    send_push_notification(
                        user=student.user,
                        title="📚 Davomat eslatmasi!",
                        body=f"Salom {student.full_name}! "
                             f"'{lesson.group.name}' guruhingizning darsi boshlandi. "
                             f"Iltimos, 'DARSGA KELDIM' tugmasini bosing!",
                        notif_type='attendance'
                    )
                    notified += 1

        except Exception as e:
            logger.error(f"notify_absent_students (lesson_id={lesson.id}): {e}")
            continue

    logger.info(f"notify_absent_students: {notified} ta talabaga xabar yuborildi.")
    return f"{notified} ta talabaga eslatma yuborildi."


# ─────────────────────────────────────────────
#  2. TALABALAR AVTO-CHIQISH (Auto Check-out)
# ─────────────────────────────────────────────
@shared_task(name='app_talaba.tasks.auto_checkout_students')
def auto_checkout_students():
    """
    Har kuni 23:00 da ishlaydi.
    Darsga keldi, lekin 'KETDIM' bosmagan talabalarni avtomatik chiqaradi.
    Admin panelida qizil belgi bilan ko'rinadi.
    """
    from .models import StudentAttendance, Lesson

    today  = date.today()
    auto_count = 0

    # Kelgan, lekin ketmagan talabalar
    pending = StudentAttendance.objects.filter(
        date=today,
        arrival_time__isnull=False,
        departure_time__isnull=True,
        status__in=['present', 'late']
    ).select_related('student__user', 'lesson', 'group')

    for att in pending:
        try:
            # Dars tugash vaqtini olish
            end_time = att.lesson.end_time if att.lesson.end_time else timezone.localtime(timezone.now()).time()

            att.departure_time = end_time
            att.note = (att.note + " | Avto-chiqish (tizim)").strip(" | ")
            att.save()

            # Talabaga xabar
            if att.student.user:
                send_push_notification(
                    user=att.student.user,
                    title="🔔 Avto-chiqish",
                    body=f"Siz 'DARSDAN KETDIM' tugmasini bosmadingiz. Tizim sizni avtomatik chiqardi. Ertaga unutmang!",
                    notif_type='attendance'
                )

            auto_count += 1
        except Exception as e:
            logger.error(f"auto_checkout_students (att_id={att.id}): {e}")
            continue

    logger.info(f"auto_checkout_students: {auto_count} ta talaba avto-chiqarildi.")
    return f"{auto_count} ta talaba avto-chiqarildi."


# ─────────────────────────────────────────────
#  3. OTA-ONALARGA KELMAGAN TALABALAR HAQIDA SMS
# ─────────────────────────────────────────────
@shared_task(name='app_talaba.tasks.notify_parents_about_absent_students')
def notify_parents_about_absent_students():
    """
    Har kuni 09:00 da ishlaydi.
    Bugun darsga kelmagan talabalarning ota-onasiga
    DB ga bildirishnoma yozadi (SMS integratsiyasi keyinchalik qo'shiladi).
    """
    from .models import Student, Lesson, StudentAttendance, Notification
    from app_texnikum.models import Texnikum

    today    = date.today()
    notified = 0

    texnikumlar = Texnikum.objects.filter(is_active=True)

    for texnikum in texnikumlar:
        try:
            # Bugun darsi bor guruhlarni topish
            today_lessons = Lesson.objects.filter(
                group__texnikum=texnikum,
                date=today
            ).values_list('group_id', flat=True).distinct()

            if not today_lessons:
                continue

            # Kelmagan talabalar
            absent_students = Student.objects.filter(
                group__in=today_lessons,
                texnikum=texnikum,
                is_active=True,
                study_status='active'
            ).exclude(
                attendances__date=today,
                attendances__status__in=['present', 'late']
            ).select_related('group')

            for student in absent_students:
                if not student.parent_phone:
                    continue

                # DB ga xabar yozish (SMS uchun placeholder)
                Notification.objects.create(
                    texnikum=texnikum,
                    title="Farzandingiz darsga kelmadi",
                    body=f"Hurmatli {student.parent_name or 'ota-ona'}! "
                         f"Farzandingiz {student.full_name} bugun ({today.strftime('%d.%m.%Y')}) "
                         f"'{student.group.name}' guruhida darsga kelmadi. "
                         f"Iltimos, bog'laning: {texnikum.phone}",
                    notif_type='attendance',
                    target_type='student',
                    target_student=student,
                    # sent_by=None  # Tizim tomonidan
                )

                # ─── SMS YUBORISH (keyinchalik integratsiya) ───
                # Eskiz: send_sms(student.parent_phone, message)
                # Hozircha faqat log yozamiz
                logger.info(
                    f"Ota-onaga xabar: {student.parent_name} ({student.parent_phone}) "
                    f"← {student.full_name} darsga kelmadi."
                )
                notified += 1

        except Exception as e:
            logger.error(f"notify_parents (texnikum_id={texnikum.id}): {e}")
            continue

    logger.info(f"notify_parents_about_absent_students: {notified} ta ota-onaga xabar yozildi.")
    return f"{notified} ta ota-onaga bildirishnoma yozildi."


# ─────────────────────────────────────────────
#  4. ERTANGI DARSLAR UCHUN ESLATMA
# ─────────────────────────────────────────────
@shared_task(name='app_talaba.tasks.send_lesson_reminders')
def send_lesson_reminders():
    """
    Har kuni 00:05 da ishlaydi.
    Ertaga darsi bor talabalarga oldindan eslatma yuboradi.
    """
    from .models import Student, Group, Notification
    from app_texnikum.models import Texnikum

    tomorrow = date.today() + timedelta(days=1)
    weekday_names = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]
    tomorrow_name = weekday_names[tomorrow.weekday()]
    sent = 0

    # Ertaga darsi bor guruhlar
    groups_with_lessons = Group.objects.filter(is_active=True)

    for group in groups_with_lessons:
        if not group.schedule:
            continue

        tomorrow_schedule = next(
            (item for item in group.schedule if item.get("day") == tomorrow_name), None
        )
        if not tomorrow_schedule:
            continue

        start_time = tomorrow_schedule.get('from', '??:??')
        room_name  = group.room.name if group.room else "belgilanmagan xona"

        students = Student.objects.filter(
            group=group, is_active=True, study_status='active'
        ).select_related('user')

        for student in students:
            if student.user:
                send_push_notification(
                    user=student.user,
                    title="📅 Ertangi dars eslatmasi",
                    body=f"Ertaga ({tomorrow.strftime('%d.%m.%Y')}) "
                         f"soat {start_time} da '{group.name}' guruhingiz darsi bor. "
                         f"Xona: {room_name}. Kechikmasdan keling!",
                    notif_type='announcement'
                )
                sent += 1

    logger.info(f"send_lesson_reminders: {sent} ta talabaga eslatma yuborildi.")
    return f"{sent} ta talabaga ertangi dars eslatmasi yuborildi."


# ─────────────────────────────────────────────
#  5. QARZDOR TALABALAR ESLATMASI
# ─────────────────────────────────────────────
@shared_task(name='app_talaba.tasks.send_debt_reminders')
def send_debt_reminders():
    """
    Har oyning 1-sanasida ishlaydi.
    Qarz summasi > 0 bo'lgan talabalarga va ota-onasiga xabar yuboradi.
    """
    from .models import Student, Notification
    from django.db.models import F

    today    = date.today()
    notified = 0

    # Qarzlilari
    debtors = Student.objects.filter(
        is_active=True,
        study_status='active',
        paid_amount__lt=F('contract_amount')
    ).select_related('user', 'texnikum', 'group')

    for student in debtors:
        try:
            debt = float(student.contract_amount) - float(student.paid_amount)
            if debt <= 0:
                continue

            # Talabaga xabar
            if student.user:
                send_push_notification(
                    user=student.user,
                    title="💳 To'lov eslatmasi",
                    body=f"Hurmatli {student.full_name}! "
                         f"Sizning qarz summanagiz: {debt:,.0f} so'm. "
                         f"Iltimos, to'lovni amalga oshiring.",
                    notif_type='payment'
                )

            # DB ga ota-ona uchun xabar
            if student.parent_phone:
                Notification.objects.create(
                    texnikum=student.texnikum,
                    title="To'lov eslatmasi",
                    body=f"Hurmatli {student.parent_name or 'ota-ona'}! "
                         f"Farzandingiz {student.full_name} uchun "
                         f"{debt:,.0f} so'm qarzdorlik mavjud. "
                         f"Iltimos, {student.texnikum.name} bilan bog'laning.",
                    notif_type='payment',
                    target_type='student',
                    target_student=student,
                )

            notified += 1

        except Exception as e:
            logger.error(f"send_debt_reminders (student_id={student.id}): {e}")
            continue

    logger.info(f"send_debt_reminders: {notified} ta qarzdorga xabar yuborildi.")
    return f"{notified} ta qarzdor talabaga eslatma yuborildi."


# ─────────────────────────────────────────────
#  6. DARS BOSHIDA TALABALAR DAVOMATINI YARATISH
# ─────────────────────────────────────────────
@shared_task(name='app_talaba.tasks.create_lesson_attendance_records')
def create_lesson_attendance_records(lesson_id):
    """
    Yangi Lesson yaratilganda darhol chaqiriladi.
    Guruhning barcha talabalari uchun 'absent' davomat yozuvi yaratadi.
    Keyinchalik GPS yoki o'qituvchi orqali 'present' ga o'zgartiriladi.
    """
    from .models import Lesson, Student, StudentAttendance

    try:
        lesson   = Lesson.objects.select_related('group').get(pk=lesson_id)
        students = Student.objects.filter(group=lesson.group, is_active=True, study_status='active')

        records = [
            StudentAttendance(
                lesson=lesson,
                student=s,
                group=lesson.group,
                date=lesson.date,
                status='absent',
                check_type='auto'
            )
            for s in students
        ]

        created_count = len(StudentAttendance.objects.bulk_create(records, ignore_conflicts=True))
        logger.info(f"create_lesson_attendance_records: lesson_id={lesson_id}, {len(records)} ta yozuv yaratildi.")
        return f"{len(records)} ta davomat yozuvi yaratildi."

    except Exception as e:
        logger.error(f"create_lesson_attendance_records xatosi: {e}")
        return f"Xato: {e}"


# ─────────────────────────────────────────────
#  7. DARS TUGASHI — o'qituvchiga eslatma
# ─────────────────────────────────────────────
@shared_task(name='app_talaba.tasks.notify_lesson_end')
def notify_lesson_end(lesson_id):
    """
    Dars tugash vaqtida (end_time) chaqiriladi.
    O'qituvchiga "Darsni yakunlang" deb xabar yuboradi.
    """
    from .models import Lesson

    try:
        lesson = Lesson.objects.select_related('teacher__user').get(pk=lesson_id)

        if lesson.teacher and lesson.teacher.user:
            send_push_notification(
                user=lesson.teacher.user,
                title="⏱ Dars vaqti tugadi",
                body=f"'{lesson.group.name}' guruhining darsi tugadi. "
                     f"Davomatni tekshirib, darsni yakunlang.",
                notif_type='system'
            )
        return f"O'qituvchiga dars tugash xabari yuborildi."

    except Exception as e:
        logger.error(f"notify_lesson_end xatosi: {e}")
        return f"Xato: {e}"


# ─────────────────────────────────────────────
#  8. HAFTALIK TALABALAR HISOBOTI
# ─────────────────────────────────────────────
@shared_task(name='app_talaba.tasks.send_weekly_student_report')
def send_weekly_student_report():
    """
    Har dushanba kuni 08:00 da ishlaydi.
    CenterAdmin va Directorga haftalik talabalar davomati hisobotini yuboradi.
    """
    from .models import StudentAttendance, Group
    from app_texnikum.models import Texnikum
    from users.models import CustomUser

    today       = date.today()
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_sunday = last_monday + timedelta(days=6)

    texnikumlar = Texnikum.objects.filter(is_active=True)

    for texnikum in texnikumlar:
        try:
            total_students = texnikum.students.filter(is_active=True, study_status='active').count()

            present = StudentAttendance.objects.filter(
                group__texnikum=texnikum,
                date__range=[last_monday, last_sunday],
                status__in=['present', 'late']
            ).count()

            absent = StudentAttendance.objects.filter(
                group__texnikum=texnikum,
                date__range=[last_monday, last_sunday],
                status='absent'
            ).count()

            total_records = present + absent
            percent = round(present / total_records * 100, 1) if total_records else 0

            body = (
                f"📚 Haftalik talabalar hisoboti\n"
                f"Sana: {last_monday.strftime('%d.%m')} — {last_sunday.strftime('%d.%m.%Y')}\n"
                f"Jami talabalar: {total_students}\n"
                f"Keldi: {present} ta\n"
                f"Kelmadi: {absent} ta\n"
                f"Davomat foizi: {percent}%"
            )

            # Administratorlarga yuborish
            admins = CustomUser.objects.filter(
                texnikum=texnikum,
                role__in=['director', 'founder', 'center_admin'],
                is_active=True
            )
            for admin in admins:
                send_push_notification(
                    user=admin,
                    title=f"📚 {texnikum.name} — Haftalik talabalar hisoboti",
                    body=body,
                    notif_type='system'
                )

        except Exception as e:
            logger.error(f"send_weekly_student_report (texnikum_id={texnikum.id}): {e}")
            continue

    return "Haftalik talabalar hisobotlari yuborildi."