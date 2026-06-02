import json
import urllib.request
import urllib.error

from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes as drf_permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()


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
        )

    if not user.is_active:
        return Response(
            {"detail": "This account has been deactivated. Contact support."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # ── Issue JWT tokens ──────────────────────────────────────────────────────
    refresh = RefreshToken.for_user(user)
    return Response({"access": str(refresh.access_token), "refresh": str(refresh)})


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return User.objects.all()
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
        if request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(UserSerializer(user, context={"request": request}).data)

    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        if request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response(UserSerializer(user, context={"request": request}).data)
