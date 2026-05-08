from rest_framework import serializers
from .models import Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id", "full_name", "address_line1", "address_line2",
            "city", "country", "postal_code", "phone", "is_default", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
