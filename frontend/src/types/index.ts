// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  phone: string;
  avatar: string | null;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number | null;
}

export interface ProductImage {
  id: number;
  image: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: number;
  seller: number;
  seller_name: string;
  category: number | null;
  category_name: string;
  category_slug: string | null;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  is_active: boolean;
  is_approved: boolean;
  location: string;
  images: ProductImage[];
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  country: string;
  postal_code: string;
  phone: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  seller: number;
  seller_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Order {
  id: number;
  customer: number;
  status: OrderStatus;
  total_price: string;
  shipping_address: ShippingAddress;
  promo_code: number | null;
  discount_amount: string;
  payment_id: string;
  payment_status: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  product_price: string;
  product_stock: number;
  seller_name: string;
  product_image: string | null;
  quantity: number;
  subtotal: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
  item_count: number;
  created_at: string;
}

// ─── Promotions (validation) ──────────────────────────────────────────────────

export interface PromoValidation {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  discount_amount: string;
  minimum_order: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: number;
  product: number;
  customer: number;
  customer_name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  created_at: string;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export type SellerStatus = 'pending' | 'approved' | 'suspended';

export interface SellerProfile {
  id: number;
  user: number;
  store_name: string;
  bio: string;
  banner: string | null;
  location: string;
  status: SellerStatus;
  bank_account_details: Record<string, string>;
  created_at: string;
}

export type PayoutStatus = 'requested' | 'processing' | 'completed' | 'failed';

export interface Payout {
  id: number;
  seller: number;
  amount: string;
  status: PayoutStatus;
  reference: string;
  requested_at: string;
  processed_at: string | null;
}

// ─── Promotions ──────────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | 'fixed';

export interface PromoCode {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  minimum_order: string;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotifType = 'order' | 'message' | 'payout' | 'announcement' | 'system';

export interface Notification {
  id: number;
  notif_type: NotifType;
  title: string;
  body: string;
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

// ─── API Pagination ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
