from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F
from .models import Order, OrderItem
from .serializers import OrderSerializer


def _item_summary(items):
    """Return a human-readable summary of a list of order items."""
    names = [i.product.name for i in items]
    if len(names) == 0:
        return "your items"
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} & {names[1]}"
    return f"{names[0]} +{len(names) - 1} more"


def _notify(recipient, notif_type, title, body, data=None):
    from notifications.models import Notification
    Notification.objects.create(
        recipient=recipient,
        notif_type=notif_type,
        title=title,
        body=body,
        data=data or {},
    )


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.prefetch_related("items__product", "items__seller")

        if user.role == "admin":
            qs = qs.select_related("customer")
        elif user.role == "seller":
            if self.request.query_params.get("as_customer") == "true":
                qs = qs.filter(customer=user)
            else:
                qs = qs.filter(items__seller=user).distinct()
        else:
            qs = qs.filter(customer=user)

        order_status = self.request.query_params.get("status")
        if order_status:
            qs = qs.filter(status=order_status)

        return qs

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    def update(self, request, *args, **kwargs):
        """Send status-change notifications whenever an order status is updated."""
        old_status = self.get_object().status
        response = super().update(request, *args, **kwargs)
        new_status = response.data.get("status")

        if new_status and new_status != old_status:
            order = self.get_object()
            all_items = list(order.items.select_related("product", "seller").all())
            summary = _item_summary(all_items)

            if new_status == "confirmed":
                _notify(
                    order.customer, "order",
                    f"Order confirmed — {summary}",
                    f"Order #{order.id} · ${order.total_price} · Your order has been confirmed and will be processed soon.",
                    {"order_id": order.id},
                )

            elif new_status == "processing":
                _notify(
                    order.customer, "order",
                    f"Your order is being prepared",
                    f"Order #{order.id} · {summary} · Your seller is getting your item(s) ready.",
                    {"order_id": order.id},
                )

            elif new_status == "shipped":
                tracking = order.tracking_number
                carrier = order.shipping_carrier
                tracking_info = f" via {carrier} · {tracking}" if tracking else ""
                _notify(
                    order.customer, "order",
                    f"Your order has shipped! 📦",
                    f"Order #{order.id} · {summary}{tracking_info} · Check your order for tracking details.",
                    {"order_id": order.id},
                )

            elif new_status == "delivered":
                _notify(
                    order.customer, "order",
                    f"Order delivered — enjoy your purchase! ✅",
                    f"Order #{order.id} · {summary} · We hope you love it. Leave a review to help other buyers.",
                    {"order_id": order.id},
                )

            elif new_status == "cancelled":
                _notify(
                    order.customer, "order",
                    f"Order cancelled",
                    f"Order #{order.id} · {summary} · Your order has been cancelled. Contact support if this was unexpected.",
                    {"order_id": order.id},
                )
                # Restore stock for each cancelled item
                from products.models import Product
                for item in all_items:
                    Product.objects.filter(pk=item.product_id).update(
                        stock=F("stock") + item.quantity
                    )
                seen_sellers: set = set()
                for item in all_items:
                    if item.seller_id not in seen_sellers:
                        seen_sellers.add(item.seller_id)
                        seller_items = [i for i in all_items if i.seller_id == item.seller_id]
                        seller_summary = _item_summary(seller_items)
                        _notify(
                            item.seller, "order",
                            f"Order #{order.id} cancelled by customer",
                            f"{seller_summary} — this order was cancelled by the customer. Please do not ship.",
                            {"order_id": order.id},
                        )

            elif new_status == "refunded":
                _notify(
                    order.customer, "order",
                    f"Refund processed",
                    f"Order #{order.id} · ${order.total_price} has been refunded. Please allow 5–10 business days.",
                    {"order_id": order.id},
                )

        return response

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

        # Optional: only checkout specific items (selective checkout)
        item_ids = request.data.get("item_ids")
        if item_ids and isinstance(item_ids, list):
            cart_items = list(cart.items.filter(id__in=item_ids))
            if not cart_items:
                return Response(
                    {"detail": "None of the selected items were found in your cart."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
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
            from products.models import Product

            # Lock product rows to prevent overselling under concurrent checkouts
            product_ids = [item.product_id for item in cart_items]
            products_locked = {
                p.pk: p
                for p in Product.objects.select_for_update().filter(pk__in=product_ids)
            }

            for item in cart_items:
                product = products_locked[item.product_id]
                if product.stock < item.quantity:
                    return Response(
                        {"detail": f"'{product.name}' only has {product.stock} unit(s) left in stock."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

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

            # Decrement stock atomically
            for item in cart_items:
                Product.objects.filter(pk=item.product_id).update(
                    stock=F("stock") - item.quantity
                )

            if promo_code_id:
                PromoCode.objects.filter(pk=promo_code_id).update(
                    uses_count=F("uses_count") + 1
                )

            # Only clear the items that were included in this order
            ordered_ids = [item.id for item in cart_items]
            CartItem.objects.filter(cart=cart, id__in=ordered_ids).delete()

        order = Order.objects.prefetch_related(
            "items__product", "items__seller"
        ).get(pk=order.pk)

        all_items = list(order.items.all())
        summary = _item_summary(all_items)

        # Notify customer — product name + total in title
        _notify(
            request.user, "order",
            f"Order confirmed — {summary}",
            f"Order #{order.id} · ${order.total_price} · Cash on delivery. We'll notify you when it ships.",
            {"order_id": order.id},
        )

        # Notify each unique seller — buyer name + product name
        seen_sellers = set()
        for item in order.items.all():
            if item.seller_id not in seen_sellers:
                seen_sellers.add(item.seller_id)
                seller_items = [i for i in order.items.all() if i.seller_id == item.seller_id]
                seller_summary = _item_summary(seller_items)
                seller_total = sum(i.quantity * i.unit_price for i in seller_items)
                _notify(
                    item.seller, "order",
                    f"New order from {request.user.username}",
                    f"Order #{order.id} · {seller_summary} · ${seller_total:.2f} · Please process and ship.",
                    {"order_id": order.id},
                )

        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
