from pathlib import Path
from decouple import config
import dj_database_url
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="change-me-before-production-use-a-50-char-random-string")

# Default False — must be explicitly set True in local .env
DEBUG = config("DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config(
    "ALLOWED_HOSTS",
    default="localhost,127.0.0.1,.onrender.com",
).split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",          # required by allauth
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    # Local
    "core",
    "users",
    "products",
    "orders",
    "cart",
    "reviews",
    "store",
    "promotions",
    "notifications",
    "wishlist",
    "addresses",
]

# ── Cloudinary (optional) ────────────────────────────────────────────────────
USE_CLOUDINARY = config("USE_CLOUDINARY", default=False, cast=bool)

if USE_CLOUDINARY:
    INSTALLED_APPS += ["cloudinary_storage", "cloudinary"]
    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": config("CLOUDINARY_CLOUD_NAME", default=""),
        "API_KEY":    config("CLOUDINARY_API_KEY",    default=""),
        "API_SECRET": config("CLOUDINARY_API_SECRET", default=""),
    }
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",          # must be first
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",     # static file serving
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "goldenknot.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "goldenknot.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL", default="sqlite:///db.sqlite3"),
        conn_max_age=600,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# WhiteNoise — serve static files from STATICFILES_DIRS during development too
WHITENOISE_USE_FINDERS = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "users.User"

SITE_ID = 1

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID     = config("GOOGLE_CLIENT_ID",     default="")
GOOGLE_CLIENT_SECRET = config("GOOGLE_CLIENT_SECRET", default="")

SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {"access_type": "online"},
        "APP": {
            "client_id": GOOGLE_CLIENT_ID,
            "secret":    GOOGLE_CLIENT_SECRET,
            "key":       "",
        },
    }
}
SOCIALACCOUNT_AUTO_SIGNUP       = True
SOCIALACCOUNT_EMAIL_VERIFICATION = "none"

# allauth account settings (email is the primary identifier in our project)
ACCOUNT_AUTHENTICATION_METHOD  = "email"
ACCOUNT_EMAIL_REQUIRED          = True
ACCOUNT_USERNAME_REQUIRED       = True
ACCOUNT_USER_MODEL_USERNAME_FIELD = "username"
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173",
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ── Security (HTTPS / Render proxy) ──────────────────────────────────────────
# Render terminates TLS at the load balancer and forwards X-Forwarded-Proto
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = not DEBUG          # force HTTPS in production
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 0 if DEBUG else 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

# ── DRF ──────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND  = config("EMAIL_BACKEND",  default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST     = config("EMAIL_HOST",     default="smtp.gmail.com")
EMAIL_PORT     = config("EMAIL_PORT",     default=587, cast=int)
EMAIL_USE_TLS  = config("EMAIL_USE_TLS",  default=True, cast=bool)
EMAIL_HOST_USER     = config("EMAIL_HOST_USER",     default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL  = config("DEFAULT_FROM_EMAIL",  default="Golden Knot <hello@goldenknot.com>")
EMAIL_TIMEOUT  = 5   # seconds — prevents SMTP hangs from blocking gunicorn workers
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")

# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=config("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", default=60, cast=int)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)
    ),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
}
