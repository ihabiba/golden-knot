# Golden Knot — Progress & Reference

Multi-vendor e-commerce marketplace connecting Afghan women weavers (sellers) with global buyers (customers). Three user roles: **customer**, **seller**, **admin**.

> This is a living document. will Update it whenever a new feature is built, a model changes, or a new file is added.

---

## Monorepo Structure

```
golden-knot/
├── backend/              Django REST Framework API
│   ├── goldenknot/       Project config (settings, root urls)
│   ├── users/
│   ├── products/
│   ├── orders/
│   ├── cart/
│   ├── reviews/
│   ├── store/
│   ├── promotions/
│   ├── notifications/
│   ├── requirements.txt
│   └── .env.example
├── frontend/             React + TypeScript + Vite SPA
│   └── src/
│       ├── api/
│       ├── context/
│       ├── pages/
│       ├── components/   (empty — to be built)
│       └── types/
├── PROGRESS.md           ← this file
├── CLAUDE.md             ← AI context file (gitignored)
├── README.md
└── .gitignore
```

---

## Backend

### Project Config — `goldenknot/`

| File | Purpose |
|------|---------|
| `settings.py` | Reads all config from `.env` via `python-decouple`. Registers all 8 apps + `corsheaders`, `rest_framework`, `rest_framework_simplejwt`. Sets `AUTH_USER_MODEL = "users.User"`. Configures DRF with JWT auth + page-number pagination (20/page). CORS from `CORS_ALLOWED_ORIGINS` env var. |
| `urls.py` | JWT token endpoints at `/api/auth/token/` and `/api/auth/token/refresh/`. Includes each app's `urls.py` under `/api/<appname>/`. |

### JWT Auth Endpoints (root urls)

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/token/` | Obtain access + refresh tokens |
| POST | `/api/auth/token/refresh/` | Get new access token using refresh |

---

### App: `users/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `User` | Extends `AbstractUser`. `email` (unique, used as `USERNAME_FIELD`). `role` (choices: `customer` / `seller` / `admin`, default `customer`). `phone`, `avatar` (ImageField), `created_at`. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `UserSerializer` | Exposes `id, email, username, role, phone, avatar, created_at`. `id` and `created_at` read-only. |
| `RegisterSerializer` | Accepts `email, username, password` (write-only, min 8 chars), `role, phone`. Calls `create_user()`. |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `RegisterView` | `CreateAPIView` | `AllowAny` | Public registration |
| `UserViewSet` | `ModelViewSet` | `IsAuthenticated` | Admin sees all users, others see only themselves |

**URLs**

| Method | URL | View |
|--------|-----|------|
| POST | `/api/users/register/` | `RegisterView` |
| GET | `/api/users/` | `UserViewSet.list` (admin only) |
| GET | `/api/users/<id>/` | `UserViewSet.retrieve` |
| PATCH | `/api/users/<id>/` | `UserViewSet.partial_update` |

**Admin:** `UserAdmin` — extends `BaseUserAdmin`, adds role/phone/avatar fieldset.

---

### App: `products/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `Category` | `name`, `slug` (unique), `description`, `parent` (self-FK, nullable — supports subcategories) |
| `Product` | FK → `User` (seller), FK → `Category`. `name`, `slug` (unique), `description`, `price` (decimal 10,2), `stock`, `is_active`, `is_approved`, `location`, `created_at`, `updated_at` |
| `ProductImage` | FK → `Product`. `image` (uploads to `products/`), `is_primary`, `order`. Ordered by `order`. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `CategorySerializer` | All category fields |
| `ProductImageSerializer` | `id, image, is_primary, order` |
| `ProductSerializer` | All product fields + nested `images` (read-only) + `category_name` + `seller_name`. `seller`, `is_approved`, timestamps are read-only. |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `CategoryViewSet` | `ReadOnlyModelViewSet` | `AllowAny` | Public |
| `ProductViewSet` | `ModelViewSet` | `IsAuthenticatedOrReadOnly` | Filters `is_active=True, is_approved=True`. Search: `name, description, location`. Order by: `price, created_at`. Sets `seller` to `request.user` on create. |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/products/` | List approved active products |
| POST | `/api/products/` | Create product (seller) |
| GET | `/api/products/<id>/` | Product detail |
| PATCH/PUT | `/api/products/<id>/` | Update product |
| DELETE | `/api/products/<id>/` | Delete product |
| GET | `/api/products/categories/` | Category list |
| GET | `/api/products/categories/<id>/` | Category detail |

**Admin:** `CategoryAdmin` (prepopulated slug), `ProductAdmin` (with `ProductImageInline`).

---

### App: `orders/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `Order` | FK → `User` (customer). `status` (choices: `pending / confirmed / processing / shipped / delivered / cancelled / refunded`). `total_price`, `shipping_address` (JSONField), FK → `PromoCode` (nullable), `discount_amount`, `payment_id`, `payment_status`, timestamps. |
| `OrderItem` | FK → `Order`, FK → `Product`, FK → `User` (seller). `quantity`, `unit_price`. `subtotal` computed property. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `OrderItemSerializer` | All fields + `subtotal` (read-only) |
| `OrderSerializer` | All order fields + nested `items` (read-only). `customer` and timestamps read-only. |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `OrderViewSet` | `ModelViewSet` | `IsAuthenticated` | Admin → all orders. Seller → orders containing their items. Customer → own orders. |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/orders/` | List orders (role-filtered) |
| POST | `/api/orders/` | Create order |
| GET | `/api/orders/<id>/` | Order detail |
| PATCH | `/api/orders/<id>/` | Update status |

**Admin:** `OrderAdmin` with `OrderItemInline`.

---

### App: `cart/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `Cart` | OneToOne → `User`. `created_at`. |
| `CartItem` | FK → `Cart`, FK → `Product`. `quantity` (default 1). Unique together: `(cart, product)`. `subtotal` computed property. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `CartItemSerializer` | `id, product, product_name, quantity, subtotal` |
| `CartSerializer` | `id, items (nested), created_at` |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `CartView` | `RetrieveAPIView` | `IsAuthenticated` | GET returns cart (auto-creates if missing). POST adds item — increments qty if product already in cart. |
| `CartItemView` | `DestroyAPIView` | `IsAuthenticated` | Scoped to current user's cart. |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/cart/` | Get cart with all items |
| POST | `/api/cart/` | Add item `{ product, quantity }` |
| DELETE | `/api/cart/items/<id>/` | Remove item |

**Admin:** `CartAdmin` with `CartItemInline`.

---

### App: `reviews/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `Review` | FK → `Product`, FK → `User` (customer). `rating` (1–5, validated). `comment`, timestamps. Unique together: `(product, customer)` — one review per product per user. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `ReviewSerializer` | All fields + `customer_name`. `customer` and `created_at` read-only. |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `ReviewViewSet` | `ModelViewSet` | `IsAuthenticatedOrReadOnly` | Filter by `?product=<id>`. Sets `customer` to `request.user` on create. |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/reviews/?product=<id>` | List reviews for a product |
| POST | `/api/reviews/` | Create review |
| PATCH | `/api/reviews/<id>/` | Update own review |
| DELETE | `/api/reviews/<id>/` | Delete review |

**Admin:** `ReviewAdmin` — filter by rating.

---

### App: `store/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `SellerProfile` | OneToOne → `User`. `store_name`, `bio`, `banner` (ImageField), `location`, `status` (choices: `pending / approved / suspended`), `bank_account_details` (JSONField), `created_at`. |
| `Payout` | FK → `User` (seller). `amount`, `status` (choices: `requested / processing / completed / failed`), `reference`, `requested_at`, `processed_at`. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `SellerProfileSerializer` | All fields. `user`, `status`, `created_at` read-only. |
| `PayoutSerializer` | All fields. `seller`, `status`, `requested_at`, `processed_at` read-only. |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `SellerProfileViewSet` | `ModelViewSet` | `IsAuthenticatedOrReadOnly` | Only returns `status=approved` profiles publicly. Sets `user` to `request.user` on create. |
| `PayoutViewSet` | `ModelViewSet` | `IsAuthenticated` | Admin sees all payouts, sellers see own only. |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/store/sellers/` | List approved seller profiles |
| POST | `/api/store/sellers/` | Create seller profile |
| GET | `/api/store/sellers/<id>/` | Seller profile detail |
| GET | `/api/store/payouts/` | List payouts (own or all if admin) |
| POST | `/api/store/payouts/` | Request a payout |

**Admin:** `SellerProfileAdmin`, `PayoutAdmin` — both with status list filter.

---

### App: `promotions/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `PromoCode` | `code` (unique), `discount_type` (choices: `percentage / fixed`), `discount_value`, `minimum_order`, `max_uses` (nullable), `uses_count`, `valid_from`, `valid_until` (nullable), `is_active`. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `PromoCodeSerializer` | All fields. `uses_count` read-only. |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `PromoCodeViewSet` | `ModelViewSet` | `IsAdminOrReadOnly` (custom) | Safe methods require auth; write methods require `role=admin`. Returns active codes only. |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/promotions/` | List active promo codes |
| POST | `/api/promotions/` | Create promo code (admin only) |
| PATCH | `/api/promotions/<id>/` | Update promo code (admin only) |
| DELETE | `/api/promotions/<id>/` | Delete promo code (admin only) |

**Admin:** `PromoCodeAdmin` — shows uses count and validity.

---

### App: `notifications/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `Notification` | FK → `User` (recipient). `notif_type` (choices: `order / message / payout / announcement / system`). `title`, `body`, `is_read` (default False), `data` (JSONField for extra payload), `created_at`. Ordered by `-created_at`. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `NotificationSerializer` | All fields except `recipient`. `id` and `created_at` read-only. |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `NotificationViewSet` | `ModelViewSet` (GET/PATCH/DELETE only — no POST from API) | `IsAuthenticated` | Scoped to `request.user`. Custom action `mark_all_read`. |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/notifications/` | List own notifications |
| PATCH | `/api/notifications/<id>/` | Mark one as read |
| PATCH | `/api/notifications/mark_all_read/` | Bulk mark all as read |
| DELETE | `/api/notifications/<id>/` | Delete a notification |

**Admin:** `NotificationAdmin` — filter by type and read status.

---

### Backend Config Files

| File | Contents |
|------|----------|
| `requirements.txt` | `Django==5.0.4`, `djangorestframework==3.15.1`, `djangorestframework-simplejwt==5.3.1`, `django-cors-headers==4.3.1`, `dj-database-url==2.1.0`, `psycopg2-binary==2.9.9`, `python-decouple==3.8`, `Pillow==10.3.0`, `django-storages==1.14.3`, `boto3==1.34.84` |
| `.env.example` | `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`, `JWT_REFRESH_TOKEN_LIFETIME_DAYS`, `USE_S3`, S3 vars |

---

## Frontend

### `src/types/index.ts`

All TypeScript interfaces in one file:

| Interface / Type | Fields |
|-----------------|--------|
| `UserRole` | `'customer' \| 'seller' \| 'admin'` |
| `User` | id, email, username, role, phone, avatar, created_at |
| `AuthTokens` | access, refresh |
| `Category` | id, name, slug, description, parent |
| `ProductImage` | id, image, is_primary, order |
| `Product` | id, seller, seller_name, category, category_name, name, slug, description, price, stock, is_active, is_approved, location, images, timestamps |
| `OrderStatus` | union of 7 status strings |
| `ShippingAddress` | full_name, address_line1, address_line2?, city, country, postal_code, phone |
| `OrderItem` | id, product, seller, quantity, unit_price, subtotal |
| `Order` | id, customer, status, total_price, shipping_address, promo_code, discount_amount, payment_id, payment_status, items, timestamps |
| `CartItem` | id, product, product_name, quantity, subtotal |
| `Cart` | id, items, created_at |
| `Review` | id, product, customer, customer_name, rating (1–5), comment, created_at |
| `SellerStatus` | `'pending' \| 'approved' \| 'suspended'` |
| `SellerProfile` | id, user, store_name, bio, banner, location, status, bank_account_details, created_at |
| `PayoutStatus` | `'requested' \| 'processing' \| 'completed' \| 'failed'` |
| `Payout` | id, seller, amount, status, reference, requested_at, processed_at |
| `DiscountType` | `'percentage' \| 'fixed'` |
| `PromoCode` | id, code, discount_type, discount_value, minimum_order, max_uses, uses_count, valid_from, valid_until, is_active |
| `NotifType` | `'order' \| 'message' \| 'payout' \| 'announcement' \| 'system'` |
| `Notification` | id, notif_type, title, body, is_read, data, created_at |
| `PaginatedResponse<T>` | count, next, previous, results |

---

### `src/api/`

| File | Functions |
|------|-----------|
| `client.ts` | Default export: Axios instance pointed at `VITE_API_URL`. Request interceptor injects `Authorization: Bearer <token>` from localStorage. Response interceptor silently refreshes expired token on 401 then retries the original request. |
| `auth.ts` | `login(email, password)`, `register(data)`, `refreshToken(refresh)` |
| `products.ts` | `getProducts(params?)`, `getProduct(idOrSlug)`, `getCategories()`, `createProduct(FormData)`, `updateProduct(id, data)`, `deleteProduct(id)` |
| `orders.ts` | `getOrders()`, `getOrder(id)`, `createOrder(data)`, `updateOrderStatus(id, status)` |
| `cart.ts` | `getCart()`, `addToCart(product, quantity)`, `removeCartItem(itemId)` |
| `reviews.ts` | `getReviews(productId)`, `createReview(data)` |
| `notifications.ts` | `getNotifications()`, `markAllRead()`, `deleteNotification(id)` |

---

### `src/context/`

| File | Exports |
|------|---------|
| `AuthContext.tsx` | `AuthProvider` — stores `user` and `accessToken` in state, persists tokens to localStorage, provides `login()` and `logout()`. `useAuth()` — hook to consume the context, throws if used outside provider. |
| `CartContext.tsx` | `CartProvider` — tracks `itemCount` (cart badge count), provides `setItemCount`, `incrementCount`, `decrementCount`. `useCart()` hook. |

---

### `src/components/`

| File | What it does |
|------|-------------|
| `Navbar.tsx` | Fixed black navbar. Logo (gold, left), nav links with animated underline (center, hidden on mobile), right side: search icon, cart icon with count badge, Login/Register buttons or user avatar dropdown (role-aware: links to admin panel / seller dashboard / account). Mobile: hamburger → slide-down menu with auth buttons. Expandable search bar overlay. Click-outside closes user dropdown. |
| `Footer.tsx` | Black footer. Brand column (description, email, location, social icons), Quick Links column, Sell With Us column (CTA to register as seller). Bottom bar: copyright + "Developed by Habiba Hassan" linking to `https://github.com/ihabiba` in gold on hover. |
| `ProductCard.tsx` | Product card with textile-inspired gradient placeholder image (built from product color palette + woven SVG overlay), category badge, wishlist toggle (heart), "Add to Cart" button that slides up on hover, gold star rating, seller name, gold price. Calls `useCart().incrementCount()` on add. |
| `CategoryCard.tsx` | Dark card (`#1C1C1C`) with gold-tinted icon, category name in Playfair Display, item count, arrow on hover. Hover: gold border glow + subtle lift. Links to `/products?category=<slug>`. |

---

### `src/pages/`

| File | Route | Status |
|------|-------|--------|
| `HomePage.tsx` | `/` | **Complete** — Hero, Categories grid, Products grid, Why Us, Mission banner, Newsletter |
| `ProductsPage.tsx` | `/products` | Stub |
| `ProductDetailPage.tsx` | `/products/:slug` | Stub |
| `CartPage.tsx` | `/cart` | Stub |
| `CheckoutPage.tsx` | `/checkout` | Stub |
| `LoginPage.tsx` | `/login` | **Functional** — email/password form, calls `useAuth().login()`, redirects on success |
| `RegisterPage.tsx` | `/register` | Stub |
| `AccountPage.tsx` | `/account` | Stub |
| `OrdersPage.tsx` | `/orders` | Stub |
| `SellerDashboardPage.tsx` | `/seller/dashboard` | Stub |
| `AdminDashboardPage.tsx` | `/admin` | Stub |

---

### Root Frontend Files

| File | Purpose |
|------|---------|
| `App.tsx` | `BrowserRouter` with layout wrapper (Navbar + `pt-16` content area + Footer). All 11 routes. |
| `main.tsx` | Mounts app; wraps `<App>` in `<AuthProvider>` + `<CartProvider>` |
| `src/index.css` | Tailwind v4 import + Google Fonts (Playfair Display + Inter) + CSS vars (`--gold`, `--charcoal`, `--off-white`) + `.font-display` class |
| `vite.config.ts` | Registers `@vitejs/plugin-react` and `@tailwindcss/vite` |
| `.env.example` | `VITE_API_URL=http://localhost:8000/api` |

### HomePage sections (mock data, ready to swap for API)

| Section | Content |
|---------|---------|
| **Hero** | Dark full-screen, Playfair Display headline, gold italic accent, textile mosaic SVG grid (right), Shop Now + Become a Seller CTAs, 4 stat counters |
| **Categories** | 6 cards: Hand-Knotted Rugs, Kilim Rugs, Cushion Covers, Wall Hangings, Prayer Rugs, Table Runners — each with lucide icon + item count |
| **Featured Products** | 8 mock products with textile gradient placeholders, ratings, prices, wishlist + add-to-cart |
| **Why Golden Knot** | 3 cards: Authenticity Guaranteed, Global Delivery, Direct from Artisans |
| **Mission Banner** | Dark section with mission copy, two CTAs |
| **Newsletter** | Email subscribe form (frontend-only for now) |

---

## What's Done vs. What's Next

### Done
- [x] Full monorepo structure (`backend/` + `frontend/`)
- [x] All 8 Django apps with models, serializers, views, urls, admin
- [x] Custom User model with role-based access
- [x] JWT authentication (obtain + refresh)
- [x] PostgreSQL via `DATABASE_URL` (Supabase-ready)
- [x] CORS configured
- [x] All TypeScript interfaces matching backend models
- [x] Axios client with JWT interceptors + silent token refresh
- [x] API modules for every domain
- [x] Auth context with login/logout
- [x] Cart context with item count badge
- [x] React Router with all 11 routes
- [x] Tailwind CSS v4 + Google Fonts (Playfair Display + Inter)
- [x] Navbar — responsive, auth-aware, search overlay, user dropdown
- [x] Footer — brand, links, social icons, developer credit
- [x] ProductCard component
- [x] CategoryCard component
- [x] HomePage — complete with 6 sections, mock data
- [x] `tsc --noEmit` → 0 errors

### To Build Next
- [ ] `ProductsPage` — product grid with search + category filter + sort
- [ ] `ProductDetailPage` — images, description, add to cart, reviews section
- [ ] `CartPage` — item list, quantity controls, totals, promo code input
- [ ] `CheckoutPage` — shipping form + HesabPay payment integration
- [ ] `RegisterPage` — form calling `/api/users/register/`
- [ ] `AccountPage` — profile info, order history
- [ ] `SellerDashboardPage` — product management, order list, earnings
- [ ] `AdminDashboardPage` — analytics, seller approval, product moderation
- [ ] Backend: Approve/reject product endpoint (admin action)
- [ ] Backend: Approve/suspend seller endpoint (admin action)
- [ ] Backend: Apply promo code logic at checkout
- [ ] Backend: HesabPay payment gateway integration
- [ ] Migrations: run `python manage.py makemigrations && migrate` against Supabase
- [ ] Notification bell in Navbar (live count from API)
- [ ] Wishlist page
- [ ] About, Contact, FAQ static pages
- [ ] `ProductDetailPage` — images, description, add to cart, reviews
- [ ] `CartPage` — item list, quantity controls, totals
- [ ] `CheckoutPage` — shipping form + HesabPay payment integration
- [ ] `RegisterPage` — form calling `/api/users/register/`
- [ ] `AccountPage` — profile info, order history
- [ ] `SellerDashboardPage` — product management, order list, earnings
- [ ] `AdminDashboardPage` — analytics, seller approval, product moderation
- [ ] Backend: Approve/reject product endpoint (admin action)
- [ ] Backend: Approve/suspend seller endpoint (admin action)
- [ ] Backend: Apply promo code logic at checkout
- [ ] Backend: HesabPay payment gateway integration
- [ ] Migrations: run `python manage.py makemigrations && migrate` against Supabase

### Phase 2
- [ ] Product reviews displayed on detail page
- [ ] Order tracking timeline
- [ ] Advanced search and filters (price range, location, rating)
- [ ] Payout request flow for sellers
- [ ] Notification bell component

### Phase 3
- [ ] Multi-language (English, Dari, Pashto)
- [ ] Multi-currency display
- [ ] SEO meta tags + sitemap
- [ ] Performance tuning + image optimization
- [ ] Additional payment gateways
