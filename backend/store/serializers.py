from rest_framework import serializers
from .models import SellerProfile, Payout


class SellerProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = SellerProfile
        fields = [
            "id", "user", "user_email", "user_username", "store_name", "bio", "banner",
            "location", "status", "bank_account_details", "created_at",
        ]
        read_only_fields = ["id", "user", "user_email", "user_username", "status", "created_at"]


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = [
            "id", "seller", "amount", "status", "reference",
            "requested_at", "processed_at",
        ]
        read_only_fields = ["id", "seller", "status", "requested_at", "processed_at"]
