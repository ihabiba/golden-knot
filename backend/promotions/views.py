from rest_framework import viewsets, permissions
from .models import PromoCode
from .serializers import PromoCodeSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.role == "admin"


class PromoCodeViewSet(viewsets.ModelViewSet):
    queryset = PromoCode.objects.filter(is_active=True)
    serializer_class = PromoCodeSerializer
    permission_classes = [IsAdminOrReadOnly]
