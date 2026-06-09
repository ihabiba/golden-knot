from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import SellerProfile, Payout
from .serializers import SellerProfileSerializer, PayoutSerializer


class SellerProfileViewSet(viewsets.ModelViewSet):
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == "admin":
                qs = SellerProfile.objects.select_related("user")
                status_filter = self.request.query_params.get("status")
                if status_filter:
                    qs = qs.filter(status=status_filter)
                return qs
            if user.role == "seller":
                return SellerProfile.objects.select_related("user").filter(
                    Q(status="approved") | Q(user=user)
                )
        return SellerProfile.objects.select_related("user").filter(status="approved")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="my-profile")
    def my_profile(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        profile, _ = SellerProfile.objects.select_related("user").get_or_create(
            user=request.user,
            defaults={"store_name": request.user.username, "status": "pending"},
        )
        return Response(SellerProfileSerializer(profile).data)

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        if not request.user.is_authenticated or request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        profile = self.get_object()
        profile.status = "approved"
        profile.save()
        from notifications.models import Notification
        Notification.objects.create(
            recipient=profile.user,
            notif_type="announcement",
            title="Your seller account is approved! 🎉",
            body=f"Welcome to Golden Knot, {profile.store_name}. You can now list products and start selling.",
            data={"seller_profile_id": profile.id},
        )
        return Response({"detail": "Seller approved.", "id": profile.id, "status": "approved"})

    @action(detail=True, methods=["patch"])
    def reject(self, request, pk=None):
        if not request.user.is_authenticated or request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        profile = self.get_object()
        profile.status = "suspended"
        profile.save()
        from notifications.models import Notification
        Notification.objects.create(
            recipient=profile.user,
            notif_type="announcement",
            title="Seller account update",
            body=f"Your seller account for {profile.store_name} has been suspended. Contact support for more information.",
            data={"seller_profile_id": profile.id},
        )
        return Response({"detail": "Seller rejected.", "id": profile.id, "status": "suspended"})


class PayoutViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Payout.objects.select_related("seller").all()
        return Payout.objects.filter(seller=user)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def update(self, request, *args, **kwargs):
        old_status = self.get_object().status
        response = super().update(request, *args, **kwargs)
        new_status = response.data.get("status")
        if new_status and new_status != old_status:
            payout = self.get_object()
            from notifications.models import Notification
            if new_status == "completed":
                Notification.objects.create(
                    recipient=payout.seller,
                    notif_type="payout",
                    title=f"Payout of ${payout.amount} completed 💰",
                    body="Your payout has been processed and sent to your bank account. Please allow 1–3 business days to reflect.",
                    data={"payout_id": payout.id},
                )
            elif new_status == "failed":
                Notification.objects.create(
                    recipient=payout.seller,
                    notif_type="payout",
                    title=f"Payout failed",
                    body=f"Your payout of ${payout.amount} could not be processed. Please check your bank details and contact support.",
                    data={"payout_id": payout.id},
                )
        return response
