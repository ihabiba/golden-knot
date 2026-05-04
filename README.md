# Golden Knot — E-Commerce Platform

Multi-vendor marketplace connecting Afghan women weavers with global buyers.

## Monorepo Structure

```
golden-knot/
├── backend/    Django REST Framework API
└── frontend/   React + TypeScript + Vite SPA
```

---

## Backend

**Stack:** Django 5 · DRF · PostgreSQL (Supabase) · SimpleJWT · django-cors-headers

### Apps & Models

| App | Models |
|-----|--------|
| `users` | `User` (custom, role: customer/seller/admin) |
| `products` | `Product`, `Category`, `ProductImage` |
| `orders` | `Order`, `OrderItem` |
| `cart` | `Cart`, `CartItem` |
| `reviews` | `Review` |
| `store` | `SellerProfile`, `Payout` |
| `promotions` | `PromoCode` |
| `notifications` | `Notification` |

### Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env — set DATABASE_URL to your Supabase connection string

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Key API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/token/` | Obtain JWT (email + password) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/users/register/` | Register new user |
| GET/POST | `/api/products/` | List / create products |
| GET | `/api/products/categories/` | List categories |
| GET/POST | `/api/orders/` | Orders |
| GET/POST | `/api/cart/` | Cart |
| GET/POST | `/api/reviews/` | Reviews |
| GET | `/api/store/sellers/` | Seller profiles |
| GET/POST | `/api/store/payouts/` | Payouts |
| GET/POST | `/api/promotions/` | Promo codes |
| GET | `/api/notifications/` | Notifications |

---

## Frontend

**Stack:** React 19 · TypeScript · Vite · React Router v7 · Axios · Tailwind CSS v4

### Folder Structure

```
src/
├── api/          Axios API calls per domain
│   ├── client.ts       Axios instance + JWT interceptors
│   ├── auth.ts
│   ├── products.ts
│   ├── orders.ts
│   ├── cart.ts
│   ├── reviews.ts
│   └── notifications.ts
├── context/      React contexts
│   └── AuthContext.tsx
├── pages/        Route-level page components
├── components/   Reusable UI components
└── types/        TypeScript interfaces for all models
    └── index.ts
```

### Setup

```bash
cd frontend
npm install

cp .env.example .env
# Set VITE_API_URL=http://localhost:8000/api

npm run dev
```

Visit `http://localhost:5173`.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the Django API |

---

## Running Both Together

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && venv\Scripts\activate && python manage.py runserver

# Terminal 2 — frontend
cd frontend && npm run dev
```
