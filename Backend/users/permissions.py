from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """
    Faqat SuperAdmin (platforma egasi) uchun.
    Barcha texnikumlarni ko'ra va boshqara oladi.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.role == 'superadmin')
        )


class IsFounder(BasePermission):
    """
    Faqat Texnikum Ta'sibchisi uchun.
    Faqat o'z texnikumini ko'ra oladi (read + approve).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'founder'
        )


class IsDirector(BasePermission):
    """
    Faqat Direktor uchun.
    Operatsion boshqaruv: xodimlar, oylik, xarajatlar.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'director'
        )


class IsCenterAdmin(BasePermission):
    """
    Faqat Texnikum Admini uchun.
    Guruhlar, jadvallar, talabalar.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'center_admin'
        )


class IsTeacher(BasePermission):
    """
    Faqat O'qituvchi uchun.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'teacher'
        )


class IsStudent(BasePermission):
    """
    Faqat Talaba uchun.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'student'
        )


# --- Kombinatsiyali permissionlar ---

class IsSuperAdminOrFounder(BasePermission):
    """SuperAdmin yoki Founder."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ('superadmin', 'founder') or
            request.user.is_superuser
        )


class IsSuperAdminOrFounderOrDirector(BasePermission):
    """SuperAdmin, Founder yoki Direktor."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (
                request.user.is_superuser or
                request.user.role in ('superadmin', 'founder', 'director')
            )
        )


class IsDirectorOrCenterAdmin(BasePermission):
    """Direktor yoki Texnikum Admini."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ('director', 'center_admin')
        )


class IsStaff(BasePermission):
    """
    Xodimlar (Director, CenterAdmin, Teacher) — talabalar emas.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ('superadmin', 'founder', 'director', 'center_admin', 'teacher') or
            request.user.is_superuser
        )


class IsTeacherOrCenterAdmin(BasePermission):
    """O'qituvchi yoki Texnikum Admini."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ('teacher', 'center_admin', 'director')
        )


class SameTexnikumPermission(BasePermission):
    """
    Foydalanuvchi faqat o'zi tegishli texnikum ma'lumotlariga kira olishi.
    SuperAdmin va Founder barcha texnikumlarni ko'ra oladi.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.role == 'superadmin':
            return True
        # Obyektning texnikumini aniqlash
        obj_texnikum = getattr(obj, 'texnikum', None)
        if obj_texnikum is None:
            return False
        return obj_texnikum == user.texnikum