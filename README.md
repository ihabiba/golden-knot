# Golden Knot

Multi-vendor marketplace connecting Afghan women weavers with global buyers. Three user roles: **customer**, **seller**, **admin**.

**Stack:** Django 5 · DRF · PostgreSQL (Supabase) · React 19 · TypeScript · Vite · Tailwind CSS v4

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and DEBUG=True

python manage.py migrate
python manage.py seed_db       # populate with test data
python manage.py runserver     # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# .env already contains VITE_API_URL=http://localhost:8000/api

npm run dev                    # http://localhost:5173
```

### Test Credentials (from seed_db)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@goldenknot.com | admin123 |
| Seller 1 | seller1@test.com | test1234 |
| Seller 2 | seller2@test.com | test1234 |
| Customer | customer1@test.com | test1234 |

Promo codes: `WELCOME10` (10% off) · `GOLDEN20` (20% off, min $100)

---

## Production Deployment

### Prerequisites

- **Supabase** PostgreSQL database (free tier works)
- **Cloudinary** account for image storage (free tier works)
- **Render** account for the backend
- **Vercel** account for the frontend

---

### 1 — Deploy Backend to Render

#### Create a Web Service

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `golden-knot-api`
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn goldenknot.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 60`
   - **Plan:** Free

> Alternatively, push `render.yaml` to your repo and use Render's Blueprint deploy.

#### Environment Variables to Set on Render

| Variable | Value | Notes |
|----------|-------|-------|
| `SECRET_KEY` | *(generate)* | Run: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` | Required |
| `DATABASE_URL` | `postgresql://...` | Your Supabase connection string |
| `ALLOWED_HOSTS` | `.onrender.com` | Or your custom domain |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Set after deploying frontend |
| `USE_CLOUDINARY` | `True` | For production image storage |
| `CLOUDINARY_CLOUD_NAME` | *(your value)* | From cloudinary.com dashboard |
| `CLOUDINARY_API_KEY` | *(your value)* | From cloudinary.com dashboard |
| `CLOUDINARY_API_SECRET` | *(your value)* | From cloudinary.com dashboard |

> **Supabase password note:** Special characters must be URL-encoded in DATABASE_URL. `!` → `%21`, `*` → `%2A`, `?` → `%3F`, `@` → `%40`

#### After First Deploy

```bash
# SSH into Render shell (or use Render's Shell tab)
python manage.py createsuperuser
python manage.py seed_db   # optional — populates with sample data
```

---

### 2 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

#### Environment Variables to Set on Vercel

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://golden-knot-api.onrender.com/api` |

> Use your actual Render service URL (shown on the Render dashboard after deploy).

---

### 3 — Post-Deployment Steps

1. **Update `CORS_ALLOWED_ORIGINS`** on Render with your Vercel URL (e.g. `https://golden-knot.vercel.app`)
2. **Redeploy** the Render backend after updating CORS
3. **Test** the full flow: register → browse → add to cart → checkout → seller dashboard
4. **Create your admin user** via the Render shell: `python manage.py createsuperuser`

---

## Architecture

```
golden-knot/
├── backend/                   Django REST Framework API
│   ├── goldenknot/            Project config (settings, urls, wsgi)
│   ├── core/                  Management commands (seed_db)
│   ├── users/                 Custom User model (email login, roles)
│   ├── products/              Product, Category, ProductImage
│   ├── orders/                Order, OrderItem (with tracking fields)
│   ├── cart/                  Cart, CartItem (auto-created)
│   ├── reviews/               Review (unique per product+customer)
│   ├── store/                 SellerProfile, Payout
│   ├── promotions/            PromoCode (with validation endpoint)
│   ├── notifications/         Notification (programmatic only)
│   ├── wishlist/              WishlistItem (user × product)
│   ├── addresses/             Address (saved shipping addresses)
│   ├── build.sh               Render build script
│   ├── requirements.txt
│   └── .env.example
├── frontend/                  React + TypeScript SPA
│   ├── src/
│   │   ├── api/               Axios modules per domain
│   │   ├── context/           AuthContext, CartContext, WishlistContext
│   │   ├── components/        Navbar, Footer, shared dashboard components
│   │   ├── pages/             19 route-level pages
│   │   ├── types/             All TypeScript interfaces
│   │   └── utils/             apiError.ts, mediaUrl.ts
│   ├── vercel.json            SPA rewrite rules for React Router
│   ├── .env.example
│   └── vite.config.ts
├── render.yaml                Render IaC blueprint
├── PROGRESS.md                Living feature reference
└── README.md                  ← this file
```

---

## Key Design Decisions

- **Email is the login field** — `USERNAME_FIELD = "email"`. Username still required for display.
- **Products require admin approval** — `is_approved=False` by default.
- **Seller profiles require admin approval** — `status=pending` by default.
- **Cart auto-creates** — `get_or_create` on every access. No "create cart" call needed.
- **Cloudinary for media** — activated by `USE_CLOUDINARY=True`. Local `media/` folder used in development.
- **Notifications are programmatic** — created by the backend on key events (order placed, shipped, delivered, payout, seller approval). No POST endpoint.
- **Tailwind v4** — `@import "tailwindcss"` in CSS, `@tailwindcss/vite` plugin. No `tailwind.config.js`.
