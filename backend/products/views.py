from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from .models import Category, Product, ProductImage
from .serializers import CategorySerializer, ProductSerializer, ProductImageSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "location"]
    ordering_fields = ["price", "created_at"]
    ordering = ["-created_at"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def _annotate(self, qs):
        return (
            qs.annotate(
                avg_rating=Avg("reviews__rating"),
                review_count=Count("reviews"),
            )
            .select_related("seller", "category")
            .prefetch_related("images")
        )

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and user.role == "admin":
            qs = Product.objects.all()
            is_approved = self.request.query_params.get("is_approved")
            if is_approved is not None:
                qs = qs.filter(is_approved=(is_approved.lower() == "true"))
            return self._annotate(qs)

        if user.is_authenticated and user.role == "seller":
            seller_only = self.request.query_params.get("seller_only") == "true"
            if seller_only:
                return self._annotate(Product.objects.filter(seller=user))
            qs = Product.objects.filter(
                Q(seller=user) | Q(is_active=True, is_approved=True)
            ).distinct()
            return self._annotate(qs)

        qs = Product.objects.filter(is_active=True, is_approved=True)

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)

        min_price = self.request.query_params.get("min_price")
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except ValueError:
                pass

        max_price = self.request.query_params.get("max_price")
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except ValueError:
                pass

        return self._annotate(qs)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=True, methods=["post"], url_path="upload-image")
    def upload_image(self, request, slug=None):
        product = self.get_object()
        if request.user != product.seller and request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"detail": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)

        is_primary = request.data.get("is_primary", "false").lower() == "true"
        if is_primary:
            product.images.filter(is_primary=True).update(is_primary=False)

        img = ProductImage.objects.create(
            product=product,
            image=image_file,
            is_primary=is_primary or not product.images.exists(),
            order=product.images.count(),
        )
        return Response(ProductImageSerializer(img, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>[0-9]+)")
    def delete_image(self, request, slug=None, image_id=None):
        product = self.get_object()
        if request.user != product.seller and request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        try:
            img = product.images.get(pk=image_id)
        except ProductImage.DoesNotExist:
            return Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)
        img.delete()
        # If primary was deleted, promote first remaining image
        remaining = product.images.order_by("order").first()
        if remaining and not product.images.filter(is_primary=True).exists():
            remaining.is_primary = True
            remaining.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"])
    def approve(self, request, slug=None):
        if not request.user.is_authenticated or request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        product = self.get_object()
        product.is_approved = True
        product.save()
        return Response({"detail": "Product approved.", "slug": product.slug, "is_approved": True})

    @action(detail=True, methods=["patch"])
    def reject(self, request, slug=None):
        if not request.user.is_authenticated or request.user.role != "admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        product = self.get_object()
        product.is_approved = False
        product.save()
        return Response({"detail": "Product rejected.", "slug": product.slug, "is_approved": False})
