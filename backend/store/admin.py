from django.contrib import admin
from .models import SellerProfile, Payout


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ["store_name", "user", "status", "location", "created_at"]
    list_filter = ["status"]


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ["seller", "amount", "status", "requested_at", "processed_at"]
    list_filter = ["status"]
