# Golden Knot — User Flows & Test Reference

Multi-vendor marketplace connecting Afghan women weavers with global buyers.
Three roles: **customer**, **seller**, **admin**.

---

## Test Credentials

### Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@goldenknot.com | admin123 | Full platform access |
| Seller 1 | seller1@test.com | test1234 | Fatima's Afghan Rugs — Kabul |
| Seller 2 | seller2@test.com | test1234 | Kabul Weave House — Kabul |
| Seller 3 | seller3@test.com | test1234 | Herat Textile Arts — Herat |
| Customer 1 | customer1@test.com | test1234 | |
| Customer 2 | customer2@test.com | test1234 | |
| Customer 3 | customer3@test.com | test1234 | |
| Customer 4 | customer4@test.com | test1234 | |
| Customer 5 | customer5@test.com | test1234 | |

### Promo Codes

| Code | Discount | Minimum Order | Notes |
|------|----------|---------------|-------|
| `WELCOME10` | 10% off | None | No usage limit, valid 1 year |
| `GOLDEN20` | 20% off | $100.00 | Max 500 uses, valid 6 months |

---

## Seeded Products (20 items)

### Hand-Knotted Rugs

| # | Product | Price | Stock | Seller |
|---|---------|-------|-------|--------|
| 1 | Qashqai Hand-Knotted Wool Rug | $450.00 | 3 | Fatima's Afghan Rugs |
| 2 | Bokhara Tribal Carpet | $650.00 | 2 | Kabul Weave House |
| 3 | Mazar-i-Sharif Silk Blend Rug | $800.00 | 1 | Fatima's Afghan Rugs |
| 4 | Chobi Ziegler Hand-Knotted Rug | $520.00 | 4 | Kabul Weave House |

### Kilim Rugs

| # | Product | Price | Stock | Seller |
|---|---------|-------|-------|--------|
| 5 | Flat-Weave Tribal Kilim Runner | $189.00 | 8 | Herat Textile Arts |
| 6 | Geometric Afghan Kilim | $240.00 | 6 | Kabul Weave House |
| 7 | Vintage-Style Sumak Kilim | $210.00 | 5 | Fatima's Afghan Rugs |

### Cushion Covers

| # | Product | Price | Stock | Seller |
|---|---------|-------|-------|--------|
| 8 | Hand-Embroidered Silk Cushion Cover | $45.00 | 20 | Herat Textile Arts |
| 9 | Suzani Embroidered Pillow Cover | $55.00 | 15 | Kabul Weave House |
| 10 | Kilim Patchwork Cushion Set (2 pieces) | $65.00 | 12 | Herat Textile Arts |

### Wall Hangings

| # | Product | Price | Stock | Seller |
|---|---------|-------|-------|--------|
| 11 | Traditional Afghan War Rug Wall Hanging | $320.00 | 2 | Fatima's Afghan Rugs |
| 12 | Hazara Embroidered Silk Panel | $195.00 | 4 | Herat Textile Arts |
| 13 | Hand-Woven Silk Tapestry | $480.00 | 1 | Kabul Weave House |

### Prayer Rugs

| # | Product | Price | Stock | Seller |
|---|---------|-------|-------|--------|
| 14 | Bokhara Wool Prayer Mat | $89.00 | 10 | Fatima's Afghan Rugs |
| 15 | Floral Afghan Sajjada | $135.00 | 7 | Kabul Weave House |
| 16 | Geometric Prayer Rug with Kufic Border | $110.00 | 9 | Herat Textile Arts |

### Table Runners

| # | Product | Price | Stock | Seller |
|---|---------|-------|-------|--------|
| 17 | Ikat Hand-Loomed Table Runner | $75.00 | 14 | Kabul Weave House |
| 18 | Kilim Striped Table Runner | $85.00 | 18 | Fatima's Afghan Rugs |
| 19 | Suzani Embroidered Table Cover | $95.00 | 11 | Herat Textile Arts |
| 20 | Afghan Gabbeh Table Runner | $65.00 | 8 | Kabul Weave House |

---

## User Flows

---

## 1 — Visitor (Not Logged In)

Visitors can browse without an account. No cart, no wishlist, no checkout.

### What a visitor can do

| Action | Where |
|--------|-------|
| Browse the homepage | `/` — hero, featured products, categories, mission section |
| Browse all products | `/products` — search, filter by category, price range, sort |
| View product detail | `/products/:slug` — images, description, seller name, reviews |
| Read reviews | On product detail page |
| Browse About, Contact, FAQ | `/about`, `/contact`, `/faq` |
| Read legal pages | `/privacy`, `/terms` |
| Use Google Translate | Globe icon in the navbar |

### What a visitor cannot do

- Add to cart → redirected to login
- Heart/wishlist a product → redirected to login
- View orders, account, or any dashboard

### Conversion points

- **Register** button in navbar or "Become a Seller" in footer
- "Add to Cart" on a product card → triggers login redirect → returns to that flow after auth

---

## 2 — Customer Flow

### Step 1 — Registration

1. Click **Register** in the navbar
2. Choose role: **Shop & Buy** (customer)
3. Fill in username, email, phone, password
4. Or click **Continue with Google** to sign up instantly
5. Account is created and user is automatically signed in
6. Redirected to homepage

**Alt:** Existing customers click **Login**, enter email + password (or Google), and are redirected back.

---

### Step 2 — Browsing & Discovery

**Homepage** `/`
- Hero section with "Shop Now" CTA
- Category grid — click any category to filter products
- Featured product cards

**Products page** `/products`
- Search bar (searches name, description, location)
- Filter by category (dropdown)
- Filter by price range (min/max)
- Sort by: Newest, Price Low→High, Price High→Low
- Paginated results (20 per page)

**Product detail** `/products/:slug`
- Image gallery (real photos if seller uploaded them, gradient placeholder otherwise)
- Product description, location, seller name
- Star rating + review count
- **Add to Cart** button — adds 1 unit, cart badge in navbar updates
- **Heart icon** — adds/removes from wishlist (API-backed, persists across sessions)
- Customer reviews listed below

---

### Step 3 — Wishlist

Access via: Account → Wishlist tab, or `/account` → Wishlist

- All wishlisted products shown as cards with real images
- **Add to Cart** button on each wishlist card
- **Remove** (trash icon) to unwishlist
- Heart on product cards stays filled (state is global, from WishlistContext)
- Empty state: "Browse Products" CTA

---

### Step 4 — Cart

**Cart page** `/cart`
- Lists all items with product image, name, seller, quantity controls
- Increase/decrease quantity with +/− buttons
- Remove individual items
- Subtotal updates live
- **Promo code field** — enter `WELCOME10` or `GOLDEN20`, click Apply
  - `WELCOME10`: -10% off any order
  - `GOLDEN20`: -20% off orders over $100
- **Proceed to Checkout** button (passes applied promo to checkout)

---

### Step 5 — Checkout

**Checkout page** `/checkout` — 3-step flow

**Step 1: Shipping Address**
- If user has saved addresses: shown as selectable cards (default pre-selected)
- "Enter a new address" option opens the full form
- Fields: Full Name, Address Line 1, Address Line 2 (optional), City, Country, Postal Code, Phone
- Validation on all required fields

**Step 2: Review Order**
- Shows selected shipping address (Edit link to go back)
- Lists all cart items with quantities and subtotals
- Shows promo code savings if applied
- Subtotal, Shipping (Free), Total

**Step 3: Payment**
- Cash on Delivery (payment on receipt)
- "Place Order — Pay on Delivery ($X.XX)" button
- Order is created, cart is cleared, notification is sent

---

### Step 6 — Order Confirmation

**Confirmation page** `/orders/:id/confirmation`
- Success animation
- Order details: items, estimated delivery, shipping address
- Notification bell updates immediately with "Order confirmed — [product name]"

---

### Step 7 — Order Tracking

**My Orders** `/orders` (also accessible from avatar dropdown)

> Note: For sellers using this page, it shows their own purchases as buyers — not their shop's orders.

- Status tab bar: All / Pending / Confirmed / Processing / Shipped / Delivered / Cancelled
- Each card shows: product name (primary), seller, date, status badge, total
- Click any card → full order detail

**Order detail** `/orders/:id`
- Status timeline: Order Placed → Confirmed → Processing → Shipped → Delivered
- **Tracking Information card** (gold, appears when seller provides it) — carrier, tracking number, Copy button
- Shipping address + payment summary
- Items list with real product images
- **Reorder** button — adds all items back to cart
- **Cancel Order** button — visible only when status is Pending/Confirmed/Processing
  - Confirmation modal before cancelling
  - Once cancelled: timeline replaced with red "Order cancelled" banner
  - Seller is notified automatically

---

### Step 8 — Account Management

**Account page** `/account` — sidebar navigation

**Profile tab**
- Edit username, email, phone
- Upload profile photo (click "Change photo" → file picker → instant upload)
- Photo appears in the navbar avatar circle

**My Orders tab**
- Same orders list as `/orders` — filtered to own purchases

**Wishlist tab**
- All saved products with Add to Cart and Remove options

**Addresses tab**
- View saved shipping addresses
- Add new address (modal with full form + country select)
- Edit existing address
- Delete address (confirmation dialog)
- Set as Default — auto-unsets previous default, highlights with gold badge
- Default address is pre-selected on checkout

**Settings tab**
- Change password (requires current password)
- Delete Account — deactivates the account, logs out, redirects to homepage

---

## 3 — Seller Flow

### Step 1 — Registration & Approval

1. Click **Register** → choose **Sell & Earn**
2. Fill in username, email, password
3. Account created with `role: seller`
4. Seller profile is created automatically with `status: pending`
5. Log in → avatar dropdown shows **Seller Dashboard**
6. Dashboard shows a yellow **"Account under review"** banner until admin approves

> **Test shortcut:** seller1–3@test.com are already approved. Log in and skip directly to Step 3.

---

### Step 2 — Store Profile Setup

**Seller Dashboard** `/seller/dashboard` → **My Store** tab

- Store name, bio/description, location
- Bank account details (account holder, account number, bank name) — for payout processing
- Save Store Profile button

---

### Step 3 — Product Listing

**Seller Dashboard → Products tab**

**Add a product:**
1. Click **Add Product**
2. Fill in: Name, Description, Price (USD), Stock quantity, Category, Location (origin)
3. Toggle **Listed** switch to make it visible to buyers
4. **Product Images section:**
   - Click the **+** tile to open file picker (supports multiple files)
   - Preview thumbnails appear with overlays on hover
   - Click ★ star on any image to set it as the **Primary** image (shown in product cards and orders)
   - Click × to remove an image before saving
   - Blue "New" badge on unsaved images
5. Click **Create Product**
   - Product is created first, then each image is uploaded to Cloudinary/local storage
   - Success toast on completion

> **Approval required:** New products are `is_approved: False` by default. They won't appear in the public catalogue until an admin approves them. The seller can see them in their own Products tab.

**Edit a product:**
- Click the pencil icon → same modal with existing data pre-filled
- Existing images shown (with delete/primary controls)
- Add new images or remove existing ones
- Save updates product + applies image changes

**Delete a product:**
- Click the trash icon → confirmation modal → hard delete

---

### Step 4 — Order Fulfillment

**Seller Dashboard → Orders tab**

The orders table shows all customer orders containing the seller's products:

| Column | Description |
|--------|-------------|
| Order | Order number, date, tracking info (if shipped) |
| Customer | Avatar + username — **click to open Customer Profile modal** |
| Ship To | Customer's full name, city, country |
| Total | Order total |
| Status | Colored badge |
| Actions | Eye icon (view full order) + status dropdown |

**Customer Profile modal:**
- Customer avatar, username, email
- Member since date
- Total orders from this seller
- Total amount spent (delivered orders only)
- Shipping address for that specific order

**Update order status:**
1. Select new status from the dropdown on the right
2. If selecting **Shipped**: a modal appears asking for:
   - Shipping Carrier (e.g. DHL, FedEx, Afghan Post)
   - Tracking Number
   - Both optional but recommended
3. Click **Confirm Shipped**
4. Customer receives a notification automatically:
   - Confirmed: "Order confirmed — [product name]"
   - Processing: "Your order is being prepared"
   - Shipped: "Your order has shipped! 📦" (with tracking info in body)
   - Delivered: "Order delivered — enjoy your purchase! ✅"
   - Cancelled: "Order cancelled"

**View full order:**
- Click the eye icon → opens `/orders/:id` in seller fulfillment view
- Shows: product name header, "from [customer] · City, Country"
- Shipping address (what to ship to)
- Items list
- **Print Packing Slip** + **Back to Dashboard** buttons (no Reorder button)

---

### Step 5 — Earnings & Payouts

**Seller Dashboard → Earnings tab**

Three stat cards:
- **Total Earned** — sum of all delivered orders
- **Paid Out** — sum of completed payouts
- **Pending** — sum of requested/processing payouts

**Request a Payout:**
1. Click **Request Payout**
2. Enter amount
3. Click Submit
4. Payout appears in history with status: Requested → Processing → Completed/Failed
5. Admin processes payouts from the Admin Dashboard
6. When admin marks Completed → seller gets notification: "Payout of $X.XX completed 💰"

---

## 4 — Admin Flow

Log in as `admin@goldenknot.com` / `admin123`

Avatar dropdown shows **Admin Panel** → `/admin`

### Overview tab

- 5 stat cards: Total Users, Total Sellers, Total Products, Total Orders, Total Revenue
- Pending approvals warning box (sellers + products awaiting review)
- Recent orders table

---

### Users tab

- Full user list with role filter buttons (All / Customer / Seller / Admin)
- Table: username, email, role, status, joined date
- **Suspend** / **Activate** toggle buttons per user
  - Suspended users cannot log in
  - Confirmation not required (instant toggle)

---

### Sellers tab

- All seller profiles with status filter (All / Pending / Approved / Suspended)
- Table: store name, email, location, status, joined date
- **Approve** button → sets status to approved, seller receives notification "Your seller account is approved! 🎉"
- **Reject/Suspend** button → sets status to suspended, seller receives notification
- Re-approve a suspended seller with the Reinstate button

> Newly registered sellers appear here with `status: pending`. Approve them to let them list products.

---

### Products tab

- All products across all sellers, with approval filter (All / Pending / Approved)
- Table: product name, seller, category, price, stock, approval status
- **Approve** → product becomes visible to buyers
- **Revoke** → product is hidden from buyers (is_approved = False)

> Newly listed products appear here with `is_approved: False`. Approve them to make them visible.

---

### Orders tab

- All orders across all customers and sellers
- Status filter tabs: All / Pending / Confirmed / Processing / Shipped / Delivered / Cancelled
- Table: order summary (product name), customer, date, total, status
- Status update dropdown → change any order status
- Changing to Shipped opens the tracking modal (carrier + tracking number)

---

### Promo Codes tab

Full CRUD for promotional codes:

**Create a promo code:**
1. Click **Add Promo Code**
2. Fill in: Code (unique), Discount Type (Percentage / Fixed), Discount Value, Minimum Order, Max Uses (optional), Valid From/Until dates, Active toggle
3. Save

**Edit:** Click pencil icon → same modal pre-filled
**Delete:** Click trash icon → confirmation dialog → hard delete

**Active promo codes** are visible to customers on the cart page. Inactive codes are hidden.

---

## 5 — Notifications (All Roles)

The bell icon in the navbar shows a **red badge** with unread count.

| Event | Who receives it | Title format |
|-------|----------------|--------------|
| Order placed | Customer | "Order confirmed — [product name]" |
| Order placed | Seller(s) | "New order from [customer]" |
| Order confirmed | Customer | "Order confirmed — [product name]" |
| Order processing | Customer | "Your order is being prepared" |
| Order shipped | Customer | "Your order has shipped! 📦" |
| Order delivered | Customer | "Order delivered — enjoy your purchase! ✅" |
| Order cancelled | Customer | "Order cancelled" |
| Order refunded | Customer | "Refund processed" |
| Seller approved | Seller | "Your seller account is approved! 🎉" |
| Seller suspended | Seller | "Seller account update" |
| Payout completed | Seller | "Payout of $X.XX completed 💰" |
| Payout failed | Seller | "Payout failed" |

**Clicking a notification:**
- Order notifications → navigate to `/orders/:id`
- Payout notifications → navigate to `/seller/dashboard`
- Clicking marks the notification as read (unread count decrements immediately)
- "Mark all read" button clears all at once

---

## 6 — Google Sign-In (All Roles)

Available on both Login and Register pages.

1. Click **Continue with Google**
2. Google popup opens — select your Google account
3. On success: backend verifies the token with Google's API, finds or creates a user account (role: customer by default)
4. JWT tokens issued, user logged in, redirected to homepage
5. Returning Google users are recognised by email — no duplicate accounts created

> Google sign-in always creates a **customer** account. To test as a seller or admin, use email/password login with the seeded credentials above.

---

## 7 — Google Translate

- Globe icon in the navbar (visible to all users, logged in or not)
- Click → dropdown with language selector
- Select any language → page content translates in place
- **Restore Original (English)** button at the bottom of the dropdown clears the translation
