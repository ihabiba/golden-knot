from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    seller_name = serializers.CharField(source="seller.username", read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "product_name", "product_slug",
            "seller", "seller_name", "quantity", "unit_price", "subtotal",
            "product_image",
        ]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value

    def get_product_image(self, obj) -> str | None:
        primary = (
            obj.product.images.filter(is_primary=True).first()
            or obj.product.images.first()
        )
        if not primary:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(primary.image.url) if request else primary.image.url


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_username = serializers.CharField(source="customer.username", read_only=True)
    customer_email    = serializers.CharField(source="customer.email",    read_only=True)
    customer_avatar   = serializers.SerializerMethodField()
    customer_joined   = serializers.DateTimeField(source="customer.created_at", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "customer", "customer_username", "customer_email",
            "customer_avatar", "customer_joined",
            "status", "total_price", "shipping_address",
            "promo_code", "discount_amount", "payment_id", "payment_status",
            "tracking_number", "shipping_carrier",
            "items", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "customer", "created_at", "updated_at"]

    def get_customer_avatar(self, obj) -> str | None:
        if not obj.customer.avatar:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.customer.avatar.url) if request else obj.customer.avatar.url
