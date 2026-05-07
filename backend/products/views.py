from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


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
