from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F
from .models import Order, OrderItem
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.prefetch_related("items__product", "items__seller")

        if user.role == "admin":
            qs = qs.select_related("customer")
        elif user.role == "seller":
            qs = qs.filter(items__seller=user).distinct()
        else:
            qs = qs.filter(customer=user)

        order_status = self.request.query_params.get("status")
        if order_status:
            qs = qs.filter(status=order_status)

        return qs

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=False, methods=["post"], url_path="from-cart")
    def from_cart(self, request):
        """Create an order from the current user's cart, then clear the cart."""
        from cart.models import Cart, CartItem
        from promotions.models import PromoCode

        try:
            cart = Cart.objects.prefetch_related(
                "items__product__seller"
            ).get(user=request.user)
        except Cart.DoesNotExist:
            return Response(
                {"detail": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_items = list(cart.items.all())
        if not cart_items:
            return Response(
                {"detail": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shipping_address = request.data.get("shipping_address")
        if not shipping_address or not isinstance(shipping_address, dict):
            return Response(
                {"detail": "A valid shipping address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        promo_code_id = request.data.get("promo_code")
        try:
            discount_amount = Decimal(str(request.data.get("discount_amount", "0.00")))
        except Exception:
            discount_amount = Decimal("0.00")

        subtotal = sum(item.quantity * item.product.price for item in cart_items)
        total = max(subtotal - discount_amount, Decimal("0.00"))

        with transaction.atomic():
            order = Order.objects.create(
                customer=request.user,
                shipping_address=shipping_address,
                total_price=total,
                promo_code_id=promo_code_id if promo_code_id else None,
                discount_amount=discount_amount,
                payment_status="pending",
                status="pending",
            )

            OrderItem.objects.bulk_create([
                OrderItem(
                    order=order,
                    product=item.product,
                    seller=item.product.seller,
                    quantity=item.quantity,
                    unit_price=item.product.price,
                )
                for item in cart_items
            ])

            if promo_code_id:
                PromoCode.objects.filter(pk=promo_code_id).update(
                    uses_count=F("uses_count") + 1
                )

            CartItem.objects.filter(cart=cart).delete()

        order = Order.objects.prefetch_related(
            "items__product", "items__seller"
        ).get(pk=order.pk)

        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
