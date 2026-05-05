from rest_framework import viewsets, filters, permissions
from django.db.models import Avg, Count
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

    def get_queryset(self):
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

        return (
            qs.annotate(
                avg_rating=Avg("reviews__rating"),
                review_count=Count("reviews"),
            )
            .select_related("seller", "category")
            .prefetch_related("images")
        )

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
