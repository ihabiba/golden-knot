from rest_framework import viewsets, permissions
from .models import SellerProfile, Payout
from .serializers import SellerProfileSerializer, PayoutSerializer


class SellerProfileViewSet(viewsets.ModelViewSet):
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return SellerProfile.objects.select_related("user").filter(status="approved")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PayoutViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Payout.objects.all()
        return Payout.objects.filter(seller=user)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
