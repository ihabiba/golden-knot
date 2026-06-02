from rest_framework import serializers
from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "parent"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "is_primary", "order"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True, allow_null=True)
    seller_name = serializers.CharField(source="seller.username", read_only=True)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "seller", "seller_name",
            "category", "category_name", "category_slug",
            "name", "slug", "description", "price", "stock",
            "is_active", "is_approved", "rejection_reason", "location", "images",
            "avg_rating", "review_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "seller", "is_approved", "rejection_reason", "created_at", "updated_at"]

    def get_avg_rating(self, obj) -> float:
        val = getattr(obj, "avg_rating", None)
        return round(float(val), 1) if val is not None else 0.0

    def get_review_count(self, obj) -> int:
        val = getattr(obj, "review_count", None)
        return int(val) if val is not None else 0
