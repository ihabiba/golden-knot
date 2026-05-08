# Golden Knot — Progress & Reference

Multi-vendor e-commerce marketplace connecting Afghan women weavers (sellers) with global buyers (customers). Three user roles: **customer**, **seller**, **admin**.

> This is a living document. Update it whenever a new feature is built, a model changes, or a new file is added.

---

## Monorepo Structure

```
golden-knot/
├── backend/              Django REST Framework API
│   ├── goldenknot/       Project config (settings, root urls)
│   ├── core/             Management commands (seed_db)
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
│   ├── index.html        Google Fonts loaded here (Playfair Display + Inter)
│   └── src/
│       ├── api/          Axios call modules per domain
│       ├── context/      AuthContext, CartContext
│       ├── components/   Navbar, Footer, ProductCard, CategoryCard, + shared dashboard components
│       ├── pages/        All route-level pages
│       ├── utils/        apiError.ts — DRF error parsing
│       └── types/        All TypeScript interfaces
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
| `User` | Extends `AbstractUser`. `email` (unique, `USERNAME_FIELD`). `role` (customer/seller/admin, default customer). `phone`, `avatar`, `is_active`, `created_at`. |

**Serializers**

| Serializer | Purpose |
|-----------|---------|
| `UserSerializer` | Exposes `id, email, username, role, phone, avatar, is_active, created_at`. `id`, `is_active`, `created_at` read-only. |
| `RegisterSerializer` | Accepts `email, username, password` (min 8 chars), `role, phone`. |

**Views**

| View | Type | Permission | Notes |
|------|------|-----------|-------|
| `RegisterView` | `CreateAPIView` | `AllowAny` | Public registration |
| `UserViewSet` | `ModelViewSet` | `IsAuthenticated` | Admin sees all, others see themselves. Custom actions: `me`, `change_password`, `deactivate`, `activate`. |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| POST | `/api/users/register/` | Public registration |
| GET | `/api/users/me/` | Get current authenticated user |
| GET | `/api/users/` | List users (admin only) |
| PATCH | `/api/users/<id>/` | Update user |
| PATCH | `/api/users/<id>/change-password/` | Change password (requires old_password for non-admin) |
| PATCH | `/api/users/<id>/deactivate/` | Deactivate user (admin only) |
| PATCH | `/api/users/<id>/activate/` | Activate user (admin only) |

---

### App: `products/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `Category` | `name`, `slug` (unique), `description`, `parent` (self-FK) |
| `Product` | FK seller, FK category, `name`, `slug`, `description`, `price`, `stock`, `is_active`, `is_approved`, `location`, timestamps |
| `ProductImage` | FK product, `image`, `is_primary`, `order` |

**Views**

| View | Notes |
|------|-------|
| `CategoryViewSet` | `ReadOnlyModelViewSet`, AllowAny |
| `ProductViewSet` | Admin → all products. Seller → own + public (use `?seller_only=true` for own only). Public → approved+active. Search: `name, description, location`. Custom actions: `approve`, `reject` (admin only). |

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/products/` | List (role-filtered) |
| POST | `/api/products/` | Create (seller) |
| GET | `/api/products/<slug>/` | Detail |
| PATCH | `/api/products/<slug>/` | Update |
| DELETE | `/api/products/<slug>/` | Delete |
| PATCH | `/api/products/<slug>/approve/` | Admin approve |
| PATCH | `/api/products/<slug>/reject/` | Admin reject |
| GET | `/api/products/categories/` | Category list |

---

### App: `orders/`

**Models**

| Model | Key Fields |
|-------|-----------|
| `Order` | FK customer, `status` (7 choices), `total_price`, `shipping_address` (JSONField), FK promo_code, `discount_amount`, `payment_id`, `payment_status`, timestamps |
| `OrderItem` | FK order, product, seller, `quantity`, `unit_price`, `subtotal` (computed) |

**Views**

`OrderViewSet` — Admin → all. Seller → orders containing their items. Customer → own. Supports `?status=<status>` filter. Custom action: `from_cart` (atomic order creation).

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/orders/` | List (role-filtered, `?status=` filter) |
| POST | `/api/orders/from-cart/` | Create order from cart (atomic) |
| GET | `/api/orders/<id>/` | Order detail |
| PATCH | `/api/orders/<id>/` | Update status |

---

### App: `cart/`

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/cart/` | Get cart (auto-creates if missing) |
| POST | `/api/cart/` | Add item `{ product, quantity }` |
| PATCH | `/api/cart/items/<id>/` | Update quantity (returns full Cart) |
| DELETE | `/api/cart/items/<id>/` | Remove item (returns full Cart) |

CartSerializer: `total` and `item_count` computed fields. CartItemSerializer: `product_slug`, `product_price`, `product_stock`, `seller_name`, `product_image`.

---

### App: `reviews/`

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/reviews/?product=<id>` | List reviews |
| POST | `/api/reviews/` | Create review |
| PATCH | `/api/reviews/<id>/` | Update |
| DELETE | `/api/reviews/<id>/` | Delete |

---

### App: `store/`

**Models:** `SellerProfile` (OneToOne User, store_name, bio, banner, location, status, bank_account_details JSONField), `Payout` (FK seller, amount, status, reference, timestamps)

**Serializers:** `SellerProfileSerializer` includes `user_email`, `user_username` (read-only from user FK).

**Views**

`SellerProfileViewSet` — Admin → all profiles (filter with `?status=`). Seller → own + approved. Public → approved only. Custom actions: `my_profile` (seller gets own), `approve`, `reject` (admin only).

`PayoutViewSet` — Admin → all. Seller → own.

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/store/sellers/` | List (role-filtered) |
| GET | `/api/store/sellers/my-profile/` | Get own seller profile |
| PATCH | `/api/store/sellers/<id>/` | Update profile |
| PATCH | `/api/store/sellers/<id>/approve/` | Admin approve |
| PATCH | `/api/store/sellers/<id>/reject/` | Admin reject/suspend |
| GET | `/api/store/payouts/` | List payouts |
| POST | `/api/store/payouts/` | Request payout |

---

### App: `promotions/`

`PromoCodeViewSet` — Admin sees all codes. Others see only `is_active=True`. Write requires admin. `validate` action validates code + subtotal.

**URLs**

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/promotions/` | List (admin: all; others: active only) |
| POST | `/api/promotions/` | Create (admin only) |
| PATCH | `/api/promotions/<id>/` | Update (admin only) |
| DELETE | `/api/promotions/<id>/` | Delete (admin only) |
| POST | `/api/promotions/validate/` | Validate code + return discount |

---

### App: `notifications/`

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/notifications/` | Own notifications |
| PATCH | `/api/notifications/<id>/` | Mark one read |
| PATCH | `/api/notifications/mark_all_read/` | Bulk mark read |
| DELETE | `/api/notifications/<id>/` | Delete |

---

### App: `wishlist/`

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/wishlist/` | List own wishlist items (includes full product_detail) |
| POST | `/api/wishlist/` | Add product `{ product: id }` — idempotent (returns existing if already wishlisted) |
| DELETE | `/api/wishlist/<id>/` | Remove item |

---

### App: `addresses/`

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/addresses/` | List own addresses |
| POST | `/api/addresses/` | Create address |
| PATCH | `/api/addresses/<id>/` | Update address |
| DELETE | `/api/addresses/<id>/` | Delete address |
| PATCH | `/api/addresses/<id>/set-default/` | Set as default (unsets others automatically) |

Fields: `full_name`, `address_line1`, `address_line2`, `city`, `country`, `postal_code`, `phone`, `is_default`.

---

### App: `core/`

`seed_db` management command — idempotent seeder.

**What seed_db creates:** 1 admin, 3 sellers (approved), 5 customers, 6 categories, 20 products (all approved+active), 10 reviews, 2 promo codes (WELCOME10, GOLDEN20).

---

### Backend Config

| File | Contents |
|------|----------|
| `requirements.txt` | Django 5, DRF 3.15, simplejwt, cors-headers, dj-database-url, psycopg2-binary, python-decouple, Pillow, django-storages, boto3 |

---

## Frontend

### `src/types/index.ts`

All TypeScript interfaces in one file:

| Interface / Type | Fields |
|-----------------|--------|
| `UserRole` | `'customer' \| 'seller' \| 'admin'` |
| `User` | id, email, username, role, phone, avatar, **is_active**, created_at |
| `AuthTokens` | access, refresh |
| `Category` | id, name, slug, description, parent |
| `ProductImage` | id, image, is_primary, order |
| `Product` | id, seller, seller_name, category, category_name, category_slug, name, slug, description, price, stock, is_active, is_approved, location, images, avg_rating, review_count, timestamps |
| `OrderStatus` | union of 7 status strings |
| `ShippingAddress` | full_name, address_line1, address_line2?, city, country, postal_code, phone |
| `OrderItem` | id, product, product_name, product_slug, seller, seller_name, quantity, unit_price, subtotal |
| `Order` | id, customer, status, total_price, shipping_address, promo_code, discount_amount, payment_id, payment_status, items, timestamps |
| `CartItem` | id, product, product_name, product_slug, product_price, product_stock, seller_name, product_image, quantity, subtotal |
| `Cart` | id, items, total, item_count, created_at |
| `Review` | id, product, customer, customer_name, rating (1–5), comment, created_at |
| `SellerStatus` | `'pending' \| 'approved' \| 'suspended'` |
| `SellerProfile` | id, user, **user_email**, **user_username**, store_name, bio, banner, location, status, bank_account_details, created_at |
| `PayoutStatus` | `'requested' \| 'processing' \| 'completed' \| 'failed'` |
| `Payout` | id, seller, amount, status, reference, requested_at, processed_at |
| `DiscountType` | `'percentage' \| 'fixed'` |
| `PromoCode` | id, code, discount_type, discount_value, minimum_order, max_uses, uses_count, valid_from, valid_until, is_active |
| `PromoValidation` | id, code, discount_type, discount_value, discount_amount, minimum_order |
| `Notification` | id, notif_type, title, body, is_read, data, created_at |
| `PaginatedResponse<T>` | count, next, previous, results |

---

### `src/api/`

| File | Functions |
|------|-----------|
| `client.ts` | Axios instance. Request interceptor reads token from localStorage **or sessionStorage**. Response interceptor: 401 → silent refresh, stores back to original storage. |
| `auth.ts` | `login()`, `register()`, `refreshToken()`, `fetchCurrentUser()` |
| `users.ts` | `getUsers()`, `updateUser()`, `changePassword()`, `deactivateUser()`, `activateUser()` |
| `products.ts` | `getProducts(params?)`, `getProduct()`, `getCategories()`, `createProduct()`, `updateProduct(slug)`, `deleteProduct(slug)`, `approveProduct(slug)`, `rejectProduct(slug)` |
| `orders.ts` | `getOrders(params?)`, `getOrder(id)`, `createOrderFromCart()`, `updateOrderStatus()` |
| `cart.ts` | `getCart()`, `addToCart()`, `updateCartItem()`, `removeCartItem()` |
| `reviews.ts` | `getReviews()`, `createReview()` |
| `store.ts` | `getMySellerProfile()`, `getAllSellers()`, `createSellerProfile()`, `updateSellerProfile()`, `approveSellerProfile()`, `rejectSellerProfile()`, `getPayouts()`, `requestPayout()` |
| `promotions.ts` | `validatePromoCode()`, `getPromoCodes()`, `createPromoCode()`, `updatePromoCode()`, `deletePromoCode()` |
| `notifications.ts` | `getNotifications()`, `markAllRead()`, `deleteNotification()` |
| `wishlist.ts` | `getWishlist()`, `addToWishlist(productId)`, `removeFromWishlist(id)` |
| `addresses.ts` | `getAddresses()`, `createAddress()`, `updateAddress()`, `deleteAddress()`, `setDefaultAddress()` |

---

### `src/context/`

| File | Exports |
|------|---------|
| `AuthContext.tsx` | `user: User \| null` — populated from `/api/users/me/` on login AND on app mount. `login()`, `logout()`, `refreshUser()`, `isAuthenticated`. `useAuth()` hook. |
| `CartContext.tsx` | `itemCount`, `setItemCount`, `incrementCount`, `decrementCount`. `useCart()` hook. |
| `WishlistContext.tsx` | `wishlistIds: Set<number>`, `itemIdMap: Map<number, number>`, `toggle(productId)`, `refresh()`, `loading`. Fetched on mount when authenticated. `useWishlist()` hook. |

---

### `src/utils/`

| File | Exports |
|------|---------|
| `apiError.ts` | `parseApiError(err)`, `parseFieldErrors(err)` |

---

### `src/components/`

| File | What it does |
|------|-------------|
| `Navbar.tsx` | Fixed black navbar, auth-aware, role-aware dropdown, search overlay, mobile hamburger. **Notification bell** with unread count badge, dropdown listing recent notifications, mark-all-read button. |
| `Footer.tsx` | Black footer, brand column, inline SVG social icons, dev credit. **Google Translate** widget (dark-styled, auto-initialized). |
| `ProductCard.tsx` | Textile gradient placeholder, **wishlist toggle wired to API** (WishlistContext), add to cart, real Product type |
| `CategoryCard.tsx` | Dark card, gold icon, links to /products?category= |
| `DashboardLayout.tsx` | **NEW** Dark sidebar + main content. Mobile: hamburger drawer. Props: `title`, `subtitle`, `navItems[]`, `activeSection`, `onSectionChange` |
| `StatCard.tsx` | **NEW** Icon + value + label + optional trend badge |
| `StatusBadge.tsx` | **NEW** Colored pill for all order/seller/payout/product statuses. Props: `status`, `size`, `showDot` |
| `ConfirmModal.tsx` | **NEW** Reusable confirmation dialog. Props: `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel`, `loading`, `variant` |

---

### `src/pages/`

| File | Route | Status |
|------|-------|--------|
| `HomePage.tsx` | `/` | ✅ Complete |
| `LoginPage.tsx` | `/login` | ✅ Complete |
| `RegisterPage.tsx` | `/register` | ✅ Complete |
| `ProductsPage.tsx` | `/products` | ✅ Complete |
| `ProductDetailPage.tsx` | `/products/:slug` | ✅ Complete |
| `CartPage.tsx` | `/cart` | ✅ Complete |
| `CheckoutPage.tsx` | `/checkout` | ✅ Complete |
| `OrderConfirmationPage.tsx` | `/orders/:orderId/confirmation` | ✅ Complete |
| `OrdersPage.tsx` | `/orders` | ✅ **New** — tab-filtered list with item previews, count badges |
| `OrderDetailPage.tsx` | `/orders/:id` | ✅ **New** — status timeline, items, address, totals, reorder + print |
| `AccountPage.tsx` | `/account` | ✅ Complete — Profile edit, My Orders, **Wishlist** (product cards + add-to-cart + remove), **Addresses** (CRUD modal + set-default), Settings |
| `SellerDashboardPage.tsx` | `/seller/dashboard` | ✅ **New** — Overview, Products (CRUD modal), Orders (status update), Earnings + payouts, Store profile |
| `AdminDashboardPage.tsx` | `/admin` | ✅ Complete — Overview, Users (suspend/activate), Sellers (approve/reject), Products (approve/reject), Orders (status), Promo Codes (full CRUD) |
| `AboutPage.tsx` | `/about` | ✅ Complete — Hero, stats, mission, values, team, CTA |
| `ContactPage.tsx` | `/contact` | ✅ Complete — Contact form with validation, contact info cards |
| `FAQPage.tsx` | `/faq` | ✅ Complete — Accordion layout, 5 sections, 24 questions |
| `PrivacyPage.tsx` | `/privacy` | ✅ Complete — 10-section privacy policy |
| `TermsPage.tsx` | `/terms` | ✅ Complete — 11-section terms & conditions |

---

### Toast Notifications

`react-hot-toast` installed. `<Toaster />` mounted in `main.tsx` with dark golden theme. All API mutations across all dashboard pages show `toast.success()` / `toast.error()`.

---

### Root Frontend Files

| File | Purpose |
|------|---------|
| `App.tsx` | All 19 routes — core pages + about/contact/faq/privacy/terms |
| `main.tsx` | Mounts app with `AuthProvider` + `CartProvider` + `WishlistProvider` + `<Toaster />` |
| `src/index.css` | Tailwind v4 import + CSS vars + `.font-display` |
| `index.html` | Google Fonts via `<link>` (Playfair Display + Inter) |
| `vite.config.ts` | `@vitejs/plugin-react` + `@tailwindcss/vite` |

---

## What's Done vs. What's Next

### Done ✅
- [x] Full monorepo structure
- [x] All 8 Django apps with models, serializers, views, urls, admin
- [x] JWT auth (login, register, token refresh interceptor)
- [x] PostgreSQL via DATABASE_URL (Supabase-ready)
- [x] CORS configured
- [x] All TypeScript interfaces (including `is_active`, `user_email`, `user_username`)
- [x] Axios client: both localStorage + sessionStorage token handling, silent refresh
- [x] API modules for every domain (auth, users, products, orders, cart, reviews, store, promotions, notifications)
- [x] AuthContext: **user now fetched on login AND on app mount** — always populated when authenticated
- [x] Cart context with item count badge
- [x] `react-hot-toast` installed and configured globally
- [x] React Router with all 13 routes
- [x] Tailwind CSS v4 + Google Fonts (Playfair Display + Inter)
- [x] Navbar, Footer, ProductCard, CategoryCard components
- [x] Shared dashboard components: DashboardLayout, StatCard, StatusBadge, ConfirmModal
- [x] HomePage — complete with 6 sections
- [x] LoginPage — fully functional, live API
- [x] RegisterPage — fully functional, live API, auto-login
- [x] ProductsPage — real API, filters, search, pagination
- [x] ProductDetailPage — gallery, cart, reviews
- [x] CartPage — real cart API, promo code, optimistic updates
- [x] CheckoutPage — 3-step flow, address validation
- [x] OrderConfirmationPage — success animation, print support
- [x] **OrdersPage** — tab-filtered list, item thumbnails, count badges
- [x] **OrderDetailPage** — visual status timeline, items, reorder, print invoice
- [x] **AccountPage** — profile edit, orders list, settings (change password), delete account confirm
- [x] **SellerDashboardPage** — overview stats, product CRUD modal, order status updates, earnings + payout request, store profile edit
- [x] **AdminDashboardPage** — overview, user management (suspend/activate), seller approval, product approval, order management, promo code CRUD
- [x] Backend: `GET /api/users/me/` — returns authenticated user
- [x] Backend: `PATCH /api/users/<id>/change-password/` — with old_password verification
- [x] Backend: `PATCH /api/users/<id>/deactivate/` + `activate/` — admin only
- [x] Backend: `PATCH /api/store/sellers/<id>/approve/` + `reject/` — admin only
- [x] Backend: `GET /api/store/sellers/my-profile/` — own seller profile
- [x] Backend: `PATCH /api/products/<slug>/approve/` + `reject/` — admin only
- [x] Backend: ProductViewSet queryset — admin sees all; seller sees own + public; `?seller_only=true` for own only
- [x] Backend: SellerProfileViewSet queryset — admin sees all (filter `?status=`); seller sees own + approved
- [x] Backend: PromoCodeViewSet — admin sees all codes; others see active only
- [x] Backend: OrderViewSet — `?status=` filter param added
- [x] Backend: UserSerializer — `is_active` field added
- [x] Backend: SellerProfileSerializer — `user_email`, `user_username` added
- [x] `tsc --noEmit` → 0 errors
- [x] `manage.py check` → 0 issues

### Done ✅ (this batch)
- [x] Backend: `wishlist` app — WishlistItem model, GET/POST/DELETE endpoints, idempotent add
- [x] Backend: `addresses` app — Address model, full CRUD + set-default action
- [x] Backend: migrations applied for both new apps
- [x] Frontend: `WishlistContext` — fetches on mount, optimistic toggle, Set<number> for O(1) lookup
- [x] Frontend: `ProductCard` heart icon wired to wishlist API (redirect to login if unauthenticated)
- [x] Frontend: `AccountPage` Wishlist section — product cards, add-to-cart, remove
- [x] Frontend: `AccountPage` Addresses section — add/edit/delete modal, set default, empty state
- [x] Frontend: `CheckoutPage` Step 1 — saved address selector cards + "Enter new address" toggle
- [x] Frontend: Navbar notification bell — unread badge, dropdown, mark-all-read, polls every 60s
- [x] Frontend: `AboutPage` — hero, stats strip, mission, values, team, CTA
- [x] Frontend: `ContactPage` — form with validation + success state, contact info cards
- [x] Frontend: `FAQPage` — accordion, 5 sections, 24 questions
- [x] Frontend: `PrivacyPage` + `TermsPage` — elegantly styled, bullet-point sections
- [x] Frontend: Google Translate widget in Footer (dark-styled, loads async)
- [x] App.tsx: 19 routes total (was 13)
- [x] `tsc --noEmit` → 0 errors

### To Build Next
- [ ] Backend: HesabPay payment gateway integration
- [ ] Seller dashboard: image upload for products
- [ ] Admin dashboard: pagination for large tables
- [ ] OrdersPage / AccountPage: paginate large order lists
- [ ] Lengthen `SECRET_KEY` in `.env` to 50+ chars before production

### Later
- [ ] Multi-currency display
- [ ] SEO meta tags + sitemap
- [ ] Performance tuning + image optimization
- [ ] Additional payment gateways
