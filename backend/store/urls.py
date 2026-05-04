from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SellerProfileViewSet, PayoutViewSet

router = DefaultRouter()
router.register("sellers", SellerProfileViewSet, basename="seller-profile")
router.register("payouts", PayoutViewSet, basename="payout")

urlpatterns = [path("", include(router.urls))]
