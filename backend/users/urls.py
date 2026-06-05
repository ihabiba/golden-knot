from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, RegisterView,
    password_reset_request, password_reset_confirm,
    contact_form, test_email,
    verify_email, resend_verification,
)

router = DefaultRouter()
router.register("", UserViewSet, basename="user")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("password-reset/", password_reset_request, name="password-reset"),
    path("password-reset/confirm/", password_reset_confirm, name="password-reset-confirm"),
    path("contact/", contact_form, name="contact"),
    path("test-email/", test_email, name="test-email"),
    path("verify-email/<str:token>/", verify_email, name="verify-email"),
    path("resend-verification/", resend_verification, name="resend-verification"),
    path("", include(router.urls)),
]
