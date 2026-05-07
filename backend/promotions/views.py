from decimal import Decimal, InvalidOperation
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PromoCode
from .serializers import PromoCodeSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.role == "admin"


class PromoCodeViewSet(viewsets.ModelViewSet):
    serializer_class = PromoCodeSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == "admin":
            return PromoCode.objects.all()
        return PromoCode.objects.filter(is_active=True)

    @action(
        detail=False,
        methods=["post"],
        url_path="validate",
        permission_classes=[permissions.IsAuthenticated],
    )
    def validate(self, request):
        """Validate a promo code against a given subtotal and return discount."""
        code = str(request.data.get("code", "")).strip().upper()
        subtotal_raw = request.data.get("subtotal", "0")

        if not code:
            return Response(
                {"detail": "Promo code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            promo = PromoCode.objects.get(code__iexact=code, is_active=True)
        except PromoCode.DoesNotExist:
            return Response(
                {"detail": "Invalid promo code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        if promo.valid_from > now:
            return Response(
                {"detail": "This promo code is not yet active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if promo.valid_until and promo.valid_until < now:
            return Response(
                {"detail": "This promo code has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if promo.max_uses and promo.uses_count >= promo.max_uses:
            return Response(
                {"detail": "This promo code has reached its usage limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subtotal = Decimal(str(subtotal_raw))
        except InvalidOperation:
            return Response(
                {"detail": "Invalid subtotal."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if subtotal < promo.minimum_order:
            return Response(
                {
                    "detail": (
                        f"Minimum order of ${promo.minimum_order} required for this code."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if promo.discount_type == "percentage":
            discount = subtotal * promo.discount_value / Decimal("100")
        else:
            discount = min(promo.discount_value, subtotal)

        return Response({
            "id": promo.id,
            "code": promo.code,
            "discount_type": promo.discount_type,
            "discount_value": str(promo.discount_value),
            "discount_amount": str(discount.quantize(Decimal("0.01"))),
            "minimum_order": str(promo.minimum_order),
        })
