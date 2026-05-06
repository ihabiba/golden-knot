from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2, read_only=True
    )
    product_stock = serializers.IntegerField(source="product.stock", read_only=True)
    seller_name = serializers.CharField(source="product.seller.username", read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id", "product", "product_name", "product_slug",
            "product_price", "product_stock", "seller_name",
            "product_image", "quantity", "subtotal",
        ]

    def get_product_image(self, obj) -> str | None:
        images = obj.product.images.all()
        primary = next((img for img in images if img.is_primary), None)
        if primary is None and images:
            primary = images[0]
        if primary is None:
            return None
        request = self.context.get("request")
        url = primary.image.url if primary.image else None
        if url and request:
            return request.build_absolute_uri(url)
        return url


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total", "item_count", "created_at"]

    def get_total(self, obj) -> str:
        total = sum(item.subtotal for item in obj.items.all())
        return str(total)

    def get_item_count(self, obj) -> int:
        return sum(item.quantity for item in obj.items.all())
