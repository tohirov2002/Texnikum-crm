from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import CustomUser, AdminLog
from .serializers import (
    MetTexnikumTokenSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    AdminLogSerializer,
)
from .permissions import (
    IsSuperAdmin,
    IsSuperAdminOrFounder,
    IsSuperAdminOrFounderOrDirector,
    IsFounder,
    IsDirector,
)

User = get_user_model()


def get_client_ip(request):
    """Request'dan IP manzilni olish."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


# ─────────────────────────────────────────────
#  1. LOGIN VIEW
# ─────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Barcha rollar uchun bitta login endpoint.
    Response: access, refresh, role, full_name, texnikum_id
    """
    serializer_class = MetTexnikumTokenSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(
            {"error": "Login yoki parol noto'g'ri!"},
            status=status.HTTP_401_UNAUTHORIZED
        )


# ─────────────────────────────────────────────
#  2. LOGOUT VIEW
# ─────────────────────────────────────────────
class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Refresh tokenni blacklist'ga qo'shadi.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token kiritilmagan!"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            AdminLog.objects.create(
                user=request.user,
                action_type='logout',
                action=f"{request.user.username} tizimdan chiqdi",
                texnikum=request.user.texnikum,
                ip_address=get_client_ip(request)
            )
            return Response({"success": "Tizimdan muvaffaqiyatli chiqdingiz!"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Token noto'g'ri yoki muddati o'tgan!"}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  3. MENING MA'LUMOTLARIM (ME)
# ─────────────────────────────────────────────
class MeView(APIView):
    """
    GET  /api/auth/me/         — profilni ko'rish
    PUT  /api/auth/me/         — profilni yangilash
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserUpdateSerializer(
            request.user, data=request.data,
            partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  4. PAROL O'ZGARTIRISH
# ─────────────────────────────────────────────
class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            AdminLog.objects.create(
                user=request.user,
                action_type='update',
                action=f"{request.user.username} parolini o'zgartirdi",
                texnikum=request.user.texnikum
            )
            return Response({"success": "Parol muvaffaqiyatli o'zgartirildi!"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  5. FOYDALANUVCHILAR RO'YXATI VA YARATISH
# ─────────────────────────────────────────────
class UserListCreateView(APIView):
    """
    GET  /api/users/           — foydalanuvchilar ro'yxati
    POST /api/users/           — yangi foydalanuvchi yaratish

    SuperAdmin  → barcha foydalanuvchilarni ko'radi
    Founder     → o'z texnikumidagi userlarni ko'radi + yarata oladi
    Director    → o'z texnikumidagi teacher, center_admin ko'radi + yarata oladi
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.role == 'superadmin':
            # SuperAdmin barcha foydalanuvchilarni ko'radi
            queryset = CustomUser.objects.all().order_by('-created_at')
        elif user.role == 'founder':
            # Founder o'z texnikumidagi barcha userlarni ko'radi
            queryset = CustomUser.objects.filter(
                texnikum=user.texnikum
            ).order_by('-created_at')
        elif user.role == 'director':
            # Direktor faqat teacher va center_admin ko'radi
            queryset = CustomUser.objects.filter(
                texnikum=user.texnikum,
                role__in=['center_admin', 'teacher', 'student']
            ).order_by('-created_at')
        else:
            return Response({"error": "Ruxsat yo'q!"}, status=status.HTTP_403_FORBIDDEN)

        # Filterlash
        role_filter = request.query_params.get('role')
        is_active_filter = request.query_params.get('is_active')
        search = request.query_params.get('search')

        if role_filter:
            queryset = queryset.filter(role=role_filter)
        if is_active_filter is not None:
            queryset = queryset.filter(is_active=is_active_filter == 'true')
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
            )

        serializer = UserSerializer(queryset, many=True)
        return Response({
            "count": queryset.count(),
            "results": serializer.data
        })

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  6. FOYDALANUVCHI DETAIL, UPDATE, DELETE
# ─────────────────────────────────────────────
class UserDetailView(APIView):
    """
    GET    /api/users/<id>/    — ko'rish
    PUT    /api/users/<id>/    — yangilash
    DELETE /api/users/<id>/    — o'chirish
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounderOrDirector]

    def get_object(self, pk, request_user):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return None, Response({"error": "Foydalanuvchi topilmadi!"}, status=status.HTTP_404_NOT_FOUND)

        # Texnikum cheklovlari
        if not (request_user.is_superuser or request_user.role == 'superadmin'):
            if user.texnikum != request_user.texnikum:
                return None, Response({"error": "Siz bu foydalanuvchini ko'ra olmaysiz!"}, status=status.HTTP_403_FORBIDDEN)

        return user, None

    def get(self, request, pk):
        user, error = self.get_object(pk, request.user)
        if error:
            return error
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def put(self, request, pk):
        user, error = self.get_object(pk, request.user)
        if error:
            return error

        # SuperAdmin rolini hech kim o'zgartira olmaydi
        if user.role == 'superadmin' and not request.user.is_superuser:
            return Response({"error": "SuperAdmin ma'lumotlarini o'zgartira olmaysiz!"}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserUpdateSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user, error = self.get_object(pk, request.user)
        if error:
            return error

        if user.role == 'superadmin':
            return Response({"error": "SuperAdminni o'chirish mumkin emas!"}, status=status.HTTP_403_FORBIDDEN)

        username = user.username
        user_texnikum = user.texnikum
        user.delete()

        AdminLog.objects.create(
            user=request.user,
            action_type='delete',
            action=f"Foydalanuvchi o'chirildi: {username}",
            texnikum=user_texnikum
        )
        return Response({"success": f"{username} o'chirildi!"}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────
#  7. ADMIN LOG (AUDIT)
# ─────────────────────────────────────────────
class AdminLogListView(APIView):
    """
    GET /api/logs/
    SuperAdmin → barcha loglar
    Founder    → o'z texnikumidagi loglar
    Director   → o'z texnikumidagi loglar (cheklangan)

    Query params:
      ?action_type=login|create|update|delete
      ?from_date=2024-01-01
      ?to_date=2024-12-31
      ?user_id=5
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdminOrFounder]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.role == 'superadmin':
            queryset = AdminLog.objects.all()
        else:
            queryset = AdminLog.objects.filter(texnikum=user.texnikum)

        # Filterlash
        action_type = request.query_params.get('action_type')
        from_date   = request.query_params.get('from_date')
        to_date     = request.query_params.get('to_date')
        user_id     = request.query_params.get('user_id')

        if action_type:
            queryset = queryset.filter(action_type=action_type)
        if from_date:
            queryset = queryset.filter(timestamp__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(timestamp__date__lte=to_date)
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        serializer = AdminLogSerializer(queryset[:500], many=True)  # Max 500 ta
        return Response({
            "count": queryset.count(),
            "results": serializer.data
        })