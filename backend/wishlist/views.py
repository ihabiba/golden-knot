from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related("product")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        product_id = request.data.get("product")
        existing = WishlistItem.objects.filter(user=request.user, product_id=product_id).first()
        if existing:
            return Response(WishlistItemSerializer(existing).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)
