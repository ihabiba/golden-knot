from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status as http_status
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer


def _get_cart(user):
    """Return cart with all related data prefetched."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return (
        Cart.objects.prefetch_related(
            "items__product__images",
            "items__product__seller",
        ).get(pk=cart.pk)
    )


class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return _get_cart(self.request.user)

    def post(self, request):
        """Add item to cart."""
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]
        qty = serializer.validated_data.get("quantity", 1)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += qty
        else:
            item.quantity = qty
        item.save()
        return Response(CartSerializer(_get_cart(request.user), context={"request": request}).data)


class CartItemView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    def patch(self, request, pk):
        """Update cart item quantity. Returns updated cart."""
        item = self.get_object()
        try:
            qty = int(request.data.get("quantity", item.quantity))
        except (ValueError, TypeError):
            return Response({"detail": "Invalid quantity."}, status=http_status.HTTP_400_BAD_REQUEST)

        if qty <= 0:
            item.delete()
        else:
            item.quantity = qty
            item.save()

        cart = _get_cart(request.user)
        return Response(CartSerializer(cart, context={"request": request}).data)

    def delete(self, request, pk):
        """Remove item from cart. Returns updated cart."""
        item = self.get_object()
        item.delete()
        cart = _get_cart(request.user)
        return Response(CartSerializer(cart, context={"request": request}).data)
