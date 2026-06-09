import json
import logging
import secrets
import threading
import urllib.request
import urllib.error

import resend

logger = logging.getLogger(__name__)

from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes as drf_permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django_ratelimit.core import is_ratelimited
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.forms import SetPasswordForm
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings as django_settings
from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()


class RateLimitedTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        if is_ratelimited(request, group="login", key="ip", rate="5/m", increment=True):
            return Response(
                {"detail": "Too many login attempts. Please try again in a minute."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        return super().post(request, *args, **kwargs)


@api_view(["POST"])
@drf_permission_classes([AllowAny])
def google_auth(request):
    """
    Verify a Google OAuth2 access token, find or create a local User,
    and return JWT access + refresh tokens identical to the regular login endpoint.
    """
    access_token = request.data.get("access_token")
    if not access_token:
        return Response({"detail": "access_token is required."}, status=status.HTTP_400_BAD_REQUEST)

    # ── Verify with Google's userinfo API ────────────────────────────────────
    try:
        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            user_info = json.loads(resp.read().decode())
    except urllib.error.HTTPError:
        return Response({"detail": "Invalid or expired Google token."}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception:
        return Response({"detail": "Could not verify Google token."}, status=status.HTTP_400_BAD_REQUEST)

    email = user_info.get("email")
    if not email:
        return Response({"detail": "Google account has no email address."}, status=status.HTTP_400_BAD_REQUEST)
    if not user_info.get("email_verified", False):
        return Response({"detail": "Google account email is not verified."}, status=status.HTTP_400_BAD_REQUEST)

    # ── Find or create user ───────────────────────────────────────────────────
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Build a unique username from the Google display name
        raw = user_info.get("name", email.split("@")[0])
        base_username = "".join(c if (c.isalnum() or c in "_.@+-") else "_" for c in raw)[:140] or "user"
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        user = User.objects.create_user(
            email=email,
            username=username,
            password=None,   # unusable password — Google is the auth provider
            role="customer",
            is_email_verified=True,
        )

    if not user.is_active:
        return Response(
            {"detail": "This account has been deactivated. Contact support."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # ── Issue JWT tokens ──────────────────────────────────────────────────────
    refresh = RefreshToken.for_user(user)
    return Response({"access": str(refresh.access_token), "refresh": str(refresh)})


def _send_verification_email(user):
    token = secrets.token_urlsafe(32)
    user.email_verification_token = token
    user.save(update_fields=["email_verification_token"])
    verify_url = f"{django_settings.FRONTEND_URL}/verify-email/{token}"

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F5F5F3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F3;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#0A0A0A;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
            <p style="margin:0;color:#C9A84C;font-size:13px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;">Golden Knot</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:48px 40px 40px;border-left:1px solid #E8E8E4;border-right:1px solid #E8E8E4;">
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1C1C1C;line-height:1.3;">Verify your email address</h1>
            <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.6;">Hi {user.username},</p>
            <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
              Thanks for joining Golden Knot! Please verify your email address to ensure you can receive order updates and password reset emails.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td style="background:#C9A84C;border-radius:8px;">
                  <a href="{verify_url}" style="display:inline-block;padding:14px 36px;color:#0A0A0A;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.03em;">
                    Verify My Email
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:#999;line-height:1.6;">Or copy and paste this link into your browser:</p>
            <p style="margin:0;font-size:12px;color:#C9A84C;word-break:break-all;line-height:1.6;">{verify_url}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:0 40px;border-left:1px solid #E8E8E4;border-right:1px solid #E8E8E4;">
            <hr style="border:none;border-top:1px solid #F0EFEC;margin:0;" />
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:24px 40px 32px;border-left:1px solid #E8E8E4;border-right:1px solid #E8E8E4;border-bottom:1px solid #E8E8E4;border-radius:0 0 12px 12px;">
            <p style="margin:0;font-size:12px;color:#BBBAB5;line-height:1.6;">
              If you didn't create a Golden Knot account, you can safely ignore this email.
              &mdash; Golden Knot &copy; {__import__('datetime').date.today().year}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    text_body = (
        f"Hi {user.username},\n\n"
        f"Please verify your Golden Knot email address:\n{verify_url}\n\n"
        f"If you didn't create this account, ignore this email."
    )

    def _send():
        try:
            resend.api_key = django_settings.RESEND_API_KEY
            result = resend.Emails.send({
                "from":    django_settings.DEFAULT_FROM_EMAIL,
                "to":      [user.email],
                "subject": "Verify your Golden Knot email address",
                "html":    html_body,
                "text":    text_body,
            })
            logger.info("Verification email sent to %s | id=%s", user.email, result.get("id"))
        except Exception as exc:
            logger.error("Verification email FAILED for %s: %s", user.email, exc)

    threading.Thread(target=_send, daemon=True).start()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        _send_verification_email(user)
        if user.role == "seller":
            from store.models import SellerProfile
            from notifications.models import Notification
            SellerProfile.objects.get_or_create(
                user=user,
                defaults={"store_name": user.username, "status": "pending"},
            )
            for admin in User.objects.filter(role="admin"):
                Notification.objects.create(
                    recipient=admin,
                    notif_type="announcement",
                    title=f"New seller registration: {user.username}",
                    body=f"{user.username} ({user.email}) has registered as a seller and is awaiting your approval.",
                    data={"seller_user_id": user.id},
                )


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["email", "username"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.request.user.role == "admin":
            qs = User.objects.all()
            role = self.request.query_params.get("role")
            if role in ("customer", "seller", "admin"):
                qs = qs.filter(role=role)
            return qs
        return User.objects.filter(pk=self.request.user.pk)

    def update(self, request, *args, **kwargs):
        if "role" in request.data and request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def me(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    @action(detail=True, methods=["patch"], url_path="change-password")
    def change_password(self, request, pk=None):
        user = self.get_object()
        if user != request.user and request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        old_password = request.data.get("old_password")
        new_password = request.data.get("password")

        if not new_password or len(new_password) < 8:
            return Response(
                {"password": ["Password must be at least 8 characters."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user == request.user and request.user.role != "admin":
            if not old_password:
                return Response(
                    {"old_password": ["Current password is required."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not user.check_password(old_password):
                return Response(
                    {"old_password": ["Current password is incorrect."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password updated successfully."})

    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        # Admins can deactivate any account without a password
        if request.user.role == "admin":
            user.is_active = False
            user.save()
            return Response(UserSerializer(user, context={"request": request}).data)
        # Users may only deactivate their own account, and must confirm with password
        if request.user.pk != user.pk:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        password = request.data.get("password", "").strip()
        if not password:
            return Response(
                {"password": ["Your password is required to deactivate your account."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.check_password(password):
            return Response(
                {"password": ["Incorrect password."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response({"detail": "Account deleted."})

    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        if request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response(UserSerializer(user, context={"request": request}).data)


def _build_reset_email_html(reset_url: str, username: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your Golden Knot password</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F3;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0A0A0A;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
            <p style="margin:0;color:#C9A84C;font-size:13px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;">
              Golden Knot
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:48px 40px 40px;border-left:1px solid #E8E8E4;border-right:1px solid #E8E8E4;">
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1C1C1C;line-height:1.3;">
              Reset your password
            </h1>
            <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.6;">
              Hi {username},
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
              We received a request to reset the password for your Golden Knot account.
              Click the button below to choose a new password. This link expires in
              <strong style="color:#1C1C1C;">24 hours</strong>.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td style="background:#C9A84C;border-radius:8px;">
                  <a href="{reset_url}"
                     style="display:inline-block;padding:14px 36px;color:#0A0A0A;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.03em;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#999;line-height:1.6;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0;font-size:12px;color:#C9A84C;word-break:break-all;line-height:1.6;">
              {reset_url}
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="background:#ffffff;padding:0 40px;border-left:1px solid #E8E8E4;border-right:1px solid #E8E8E4;">
            <hr style="border:none;border-top:1px solid #F0EFEC;margin:0;" />
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#ffffff;padding:24px 40px 32px;border-left:1px solid #E8E8E4;border-right:1px solid #E8E8E4;border-bottom:1px solid #E8E8E4;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 6px;font-size:12px;color:#999;line-height:1.6;">
              If you didn't request a password reset, you can safely ignore this email.
              Your password will not change.
            </p>
            <p style="margin:0;font-size:12px;color:#BBBAB5;line-height:1.6;">
              &mdash; Golden Knot &copy; {__import__('datetime').date.today().year}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


@api_view(["POST"])
@drf_permission_classes([AllowAny])
def password_reset_request(request):
    if is_ratelimited(request, group="password_reset", key="ip", rate="3/m", increment=True):
        return Response(
            {"detail": "Too many requests. Please wait before trying again."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    email = request.data.get("email", "").strip().lower()
    if not email:
        return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    # Always return 200 — don't reveal whether email exists
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "If this email is registered you'll receive a reset link shortly."})

    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = f"{django_settings.FRONTEND_URL}/reset-password/{uid}/{token}"

    html_body = _build_reset_email_html(reset_url, user.username)
    text_body  = f"Hi {user.username},\n\nReset your Golden Knot password here:\n{reset_url}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, ignore this email."

    # NOTE: Requires goldenknot.store verified on Resend and DEFAULT_FROM_EMAIL
    # set to "Golden Knot <noreply@goldenknot.store>" for delivery to any recipient.
    def _send():
        try:
            resend.api_key = django_settings.RESEND_API_KEY
            result = resend.Emails.send({
                "from":    django_settings.DEFAULT_FROM_EMAIL,
                "to":      [user.email],
                "subject": "Reset your Golden Knot password",
                "html":    html_body,
                "text":    text_body,
            })
            logger.info("Password reset email sent to %s | id=%s", user.email, result.get("id"))
        except Exception as exc:
            logger.error("Password reset email FAILED for %s: %s", user.email, exc)

    threading.Thread(target=_send, daemon=True).start()

    return Response({"detail": "If this email is registered you'll receive a reset link shortly."})


@api_view(["GET"])
@drf_permission_classes([AllowAny])
def verify_email(request, token):
    try:
        user = User.objects.get(email_verification_token=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid or expired verification link."}, status=status.HTTP_400_BAD_REQUEST)
    user.is_email_verified = True
    user.email_verification_token = ""
    user.save(update_fields=["is_email_verified", "email_verification_token"])
    return Response({"detail": "Email verified successfully."})


@api_view(["POST"])
@drf_permission_classes([permissions.IsAuthenticated])
def resend_verification(request):
    if is_ratelimited(request, group="resend_verification", key="user", rate="3/h", increment=True):
        return Response(
            {"detail": "Too many requests. Please wait before trying again."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    user = request.user
    if user.is_email_verified:
        return Response({"detail": "Your email is already verified."})
    _send_verification_email(user)
    return Response({"detail": "Verification email sent."})


@api_view(["GET"])
@drf_permission_classes([permissions.IsAuthenticated])
def admin_stats(request):
    if request.user.role != "admin":
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DecimalField
    from django.db.models.functions import TruncDay
    from django.utils import timezone
    from datetime import timedelta
    from orders.models import Order, OrderItem
    from store.models import SellerProfile

    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (this_month_start - timedelta(days=1)).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    item_revenue = ExpressionWrapper(F("quantity") * F("unit_price"), output_field=DecimalField())

    delivered = Order.objects.filter(status="delivered")
    revenue_total = float(delivered.aggregate(t=Sum("total_price"))["t"] or 0)
    revenue_this_month = float(
        delivered.filter(created_at__gte=this_month_start).aggregate(t=Sum("total_price"))["t"] or 0
    )
    revenue_last_month = float(
        delivered.filter(created_at__gte=last_month_start, created_at__lt=this_month_start)
        .aggregate(t=Sum("total_price"))["t"] or 0
    )

    orders_by_status = {
        row["status"]: row["c"]
        for row in Order.objects.values("status").annotate(c=Count("id"))
    }

    revenue_daily = list(
        delivered.filter(created_at__gte=thirty_days_ago)
        .annotate(date=TruncDay("created_at"))
        .values("date")
        .annotate(revenue=Sum("total_price"))
        .order_by("date")
    )

    orders_daily = list(
        Order.objects.filter(created_at__gte=thirty_days_ago)
        .annotate(date=TruncDay("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    users_daily = list(
        User.objects.filter(created_at__gte=thirty_days_ago)
        .annotate(date=TruncDay("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    top_products_raw = list(
        OrderItem.objects
        .values("product__name")
        .annotate(units_sold=Sum("quantity"), revenue=Sum(item_revenue))
        .order_by("-units_sold")[:5]
    )

    top_sellers_raw = list(
        OrderItem.objects
        .filter(order__status="delivered")
        .values("seller_id", "seller__username")
        .annotate(orders=Count("order", distinct=True), revenue=Sum(item_revenue))
        .order_by("-revenue")[:5]
    )
    seller_ids = [s["seller_id"] for s in top_sellers_raw]
    store_name_map = {
        sp.user_id: sp.store_name
        for sp in SellerProfile.objects.filter(user_id__in=seller_ids)
    }

    avg_order_value = float(Order.objects.aggregate(avg=Avg("total_price"))["avg"] or 0)
    total_users = User.objects.count()
    seller_count = User.objects.filter(role="seller").count()
    verified_users = User.objects.filter(is_email_verified=True).count()
    email_verification_rate = round(verified_users / total_users * 100, 1) if total_users else 0.0

    return Response({
        "revenue_total": revenue_total,
        "revenue_this_month": revenue_this_month,
        "revenue_last_month": revenue_last_month,
        "orders_by_status": orders_by_status,
        "revenue_last_30_days": [
            {"date": item["date"].strftime("%Y-%m-%d"), "revenue": float(item["revenue"])}
            for item in revenue_daily
        ],
        "orders_last_30_days": [
            {"date": item["date"].strftime("%Y-%m-%d"), "count": item["count"]}
            for item in orders_daily
        ],
        "users_last_30_days": [
            {"date": item["date"].strftime("%Y-%m-%d"), "count": item["count"]}
            for item in users_daily
        ],
        "top_products": [
            {
                "name": item["product__name"],
                "units_sold": item["units_sold"],
                "revenue": float(item["revenue"] or 0),
            }
            for item in top_products_raw
        ],
        "top_sellers": [
            {
                "store_name": store_name_map.get(s["seller_id"]) or s["seller__username"],
                "orders": s["orders"],
                "revenue": float(s["revenue"] or 0),
            }
            for s in top_sellers_raw
        ],
        "avg_order_value": avg_order_value,
        "email_verification_rate": email_verification_rate,
        "seller_count": seller_count,
    })


@api_view(["POST"])
@drf_permission_classes([AllowAny])
def contact_form(request):
    if is_ratelimited(request, group="contact", key="ip", rate="5/m", increment=True):
        return Response(
            {"detail": "Too many requests. Please wait before trying again."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    name    = request.data.get("name", "").strip()
    email   = request.data.get("email", "").strip()
    subject = request.data.get("subject", "").strip()
    message = request.data.get("message", "").strip()

    if not all([name, email, subject, message]):
        return Response({"detail": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)
    if len(message) < 20:
        return Response({"detail": "Message must be at least 20 characters."}, status=status.HTTP_400_BAD_REQUEST)

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#F5F5F3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F3;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#0A0A0A;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
            <p style="margin:0;color:#C9A84C;font-size:13px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;">Golden Knot — Contact Form</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #E8E8E4;border-right:1px solid #E8E8E4;">
            <h2 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#1C1C1C;">New Contact Form Submission</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:10px 0;border-bottom:1px solid #F0EFEC;">
                <span style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">From</span><br/>
                <span style="font-size:15px;color:#1C1C1C;font-weight:600;">{name} &lt;{email}&gt;</span>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #F0EFEC;">
                <span style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Subject</span><br/>
                <span style="font-size:15px;color:#1C1C1C;font-weight:600;">{subject}</span>
              </td></tr>
              <tr><td style="padding:16px 0 0;">
                <span style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Message</span><br/>
                <p style="font-size:15px;color:#555;line-height:1.7;margin:8px 0 0;white-space:pre-wrap;">{message}</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:16px 40px 32px;border-left:1px solid #E8E8E4;border-right:1px solid #E8E8E4;border-bottom:1px solid #E8E8E4;border-radius:0 0 12px 12px;">
            <p style="margin:0;font-size:12px;color:#BBBAB5;">Golden Knot Contact Form &mdash; You can reply directly to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    text_body = (
        f"New contact form submission\n\n"
        f"From: {name} <{email}>\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{message}"
    )

    def _send():
        try:
            resend.api_key = django_settings.RESEND_API_KEY
            result = resend.Emails.send({
                "from":     django_settings.DEFAULT_FROM_EMAIL,
                "to":       ["zahidisok@gmail.com"],
                "reply_to": [email],
                "subject":  f"[Golden Knot Contact] {subject}",
                "html":     html_body,
                "text":     text_body,
            })
            logger.info("Contact form email sent from %s | id=%s", email, result.get("id"))
        except Exception as exc:
            logger.error("Contact form email FAILED from %s: %s", email, exc)

    threading.Thread(target=_send, daemon=True).start()
    return Response({"detail": "Message sent successfully."})


@api_view(["GET"])
@drf_permission_classes([AllowAny])
def test_email(request):
    """Diagnostic: send a test email via Resend SDK and return the response."""
    from_addr = getattr(django_settings, "DEFAULT_FROM_EMAIL", "MISSING")
    api_key   = getattr(django_settings, "RESEND_API_KEY", "MISSING")
    to_addr   = "itshabibahassan@gmail.com"
    info = {
        "from_addr":      from_addr,
        "to_addr":        to_addr,
        "api_key_prefix": api_key[:8] if api_key and api_key != "MISSING" else "MISSING",
    }
    try:
        resend.api_key = api_key
        result = resend.Emails.send({
            "from":    from_addr,
            "to":      [to_addr],
            "subject": "Golden Knot — test email",
            "text":    "This is a diagnostic test email from Golden Knot.",
        })
        return Response({"status": "ok", "resend_id": result.get("id"), **info})
    except Exception as exc:
        return Response({"status": "error", "exception": str(exc), **info}, status=status.HTTP_200_OK)


@api_view(["POST"])
@drf_permission_classes([AllowAny])
def password_reset_confirm(request):
    uid_b64      = request.data.get("uid", "")
    token        = request.data.get("token", "")
    new_password = request.data.get("new_password", "")

    if not all([uid_b64, token, new_password]):
        return Response({"detail": "uid, token, and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid  = force_str(urlsafe_base64_decode(uid_b64))
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, OverflowError):
        return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({"detail": "This reset link is invalid or has expired."}, status=status.HTTP_400_BAD_REQUEST)

    form = SetPasswordForm(user, {"new_password1": new_password, "new_password2": new_password})
    if not form.is_valid():
        errors = [e for field_errors in form.errors.values() for e in field_errors]
        return Response({"detail": " ".join(errors)}, status=status.HTTP_400_BAD_REQUEST)

    form.save()
    return Response({"detail": "Password reset successfully."})
