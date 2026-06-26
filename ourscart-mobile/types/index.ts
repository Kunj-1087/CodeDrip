// =============================================================================
// Shared TypeScript contracts. Shapes mirror the FocusKit Express API exactly
// (camelCase JSON bodies). Prices arrive as JS numbers from the API's JSON
// serializer; the formatters layer is the only place that turns them into ₹ text.
// =============================================================================

// --- Catalog ----------------------------------------------------------------

/** JSONB spec bag, e.g. { capacity: "16GB", speed: "DDR5-5600", warranty: "Lifetime" }. */
export type ProductSpecs = Record<string, string>;

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  skuSuffix: string;
  priceModifier: number;
  stockQuantity: number;
  attributes: Record<string, string>;
}

/** Shape returned by list/featured/trending endpoints (card-level data). */
export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  sku: string;
  brand: string;
  basePrice: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  inStock: boolean;
  isFeatured: boolean;
  specs: ProductSpecs;
  avgRating: number;
  reviewCount: number;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
}

/** GET /products/:slug — list shape plus full gallery and variants. */
export interface ProductDetail extends Product {
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  productCount?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  products: Product[];
  pagination: Pagination;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'name';

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: ProductSort;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// --- Reviews -----------------------------------------------------------------

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  author: string;
  createdAt: string;
}

// --- Cart (server-authoritative) --------------------------------------------

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// --- Coupons -----------------------------------------------------------------

export interface CouponResult {
  valid: boolean;
  code: string;
  discount: number;
}

// --- Orders ------------------------------------------------------------------

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface ShippingAddressInput {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

/** Row in GET /orders (history list). */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  snapshot: {
    name: string;
    sku: string;
    slug: string;
    variant: string | null;
    unitPrice: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** GET /orders/:id — note this endpoint returns snake_case for the order envelope. */
export interface OrderDetail {
  id: string;
  order_number: string;
  user_id: string;
  shipping_address: ShippingAddressInput;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  tax_amount: number;
  total: number;
  coupon_id: string | null;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

/** POST /orders — created order receipt. */
export interface CreatedOrder {
  id: string;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  paymentStatus: PaymentStatus;
}

export interface CreateOrderInput {
  shippingAddress: ShippingAddressInput;
  couponCode?: string;
  notes?: string;
}

export interface MockCheckoutResult {
  success: boolean;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  message: string;
  transactionId?: string;
}

// --- Users & addresses -------------------------------------------------------

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Address {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

// --- Wishlist ----------------------------------------------------------------

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  basePrice: number;
  inStock: boolean;
  imageUrl: string | null;
}

// --- Store branding ----------------------------------------------------------

export interface StoreSettings {
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currency: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  metaDescription: string;
  socialLinks: Record<string, string>;
}

// --- Admin -------------------------------------------------------------------

export interface AdminKpis {
  revenueMtd: number;
  ordersToday: number;
  totalCustomers: number;
  lowStock: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customerEmail?: string;
  customerName?: string;
  total: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
}

export interface AdminProductRow extends Product {
  isActive: boolean;
  categoryId?: string;
}

// --- API error ---------------------------------------------------------------

export interface APIErrorShape {
  status: number;
  message: string;
  code?: string;
}
