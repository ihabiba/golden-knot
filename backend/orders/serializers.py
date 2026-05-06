from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    seller_name = serializers.CharField(source="seller.username", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "product_name", "product_slug",
            "seller", "seller_name", "quantity", "unit_price", "subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "customer", "status", "total_price", "shipping_address",
            "promo_code", "discount_amount", "payment_id", "payment_status",
            "items", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "customer", "created_at", "updated_at"]
