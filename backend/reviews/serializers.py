from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product", "customer", "customer_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "customer", "created_at"]
