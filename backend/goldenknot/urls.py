from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import google_auth, RateLimitedTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Django-allauth (browser-based OAuth flow — not used by frontend directly)
    path("accounts/", include("allauth.urls")),
    # JWT auth
    path("api/auth/token/", RateLimitedTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/google/", google_auth, name="google_auth"),
    # Apps
    path("api/users/", include("users.urls")),
    path("api/products/", include("products.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/store/", include("store.urls")),
    path("api/promotions/", include("promotions.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/wishlist/", include("wishlist.urls")),
    path("api/addresses/", include("addresses.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
