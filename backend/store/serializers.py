from rest_framework import serializers
from .models import SellerProfile, Payout


class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = [
            "id", "user", "store_name", "bio", "banner",
            "location", "status", "bank_account_details", "created_at",
        ]
        read_only_fields = ["id", "user", "status", "created_at"]


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = [
            "id", "seller", "amount", "status", "reference",
            "requested_at", "processed_at",
        ]
        read_only_fields = ["id", "seller", "status", "requested_at", "processed_at"]
