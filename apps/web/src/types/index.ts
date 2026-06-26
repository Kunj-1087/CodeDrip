// Shared frontend types. These mirror the API response shapes (camelCase).

export interface StoreSettings {
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currency: string;
  supportEmail: string | null;
  supportPhone: string | null;
  address: string | null;
  metaDescription: string | null;
  socialLinks: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'customer' | 'admin';
  avatarUrl?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount?: number;
}

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
  skuSuffix: string | null;
  priceModifier: number;
  stockQuantity: number;
  attributes: Record<string, unknown>;
}

export interface ProductTag {
  name: string;
  slug: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  sku: string | null;
  brand: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  inStock: boolean;
  isFeatured: boolean;
  specs: Record<string, string>;
  avgRating: number;
  reviewCount: number;
  categoryName: string | null;
  categorySlug: string | null;
  imageUrl: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  tags?: ProductTag[];
}

export interface CartLine {
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
  items: CartLine[];
  subtotal: number;
  itemCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  itemCount: number;
}

export interface OrderItemSnapshot {
  name: string;
  sku: string | null;
  slug: string;
  variant: string | null;
  unitPrice: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  snapshot: OrderItemSnapshot;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  customer_email?: string;
  shipping_address: Record<string, string>;
  subtotal: string;
  discount_amount: string;
  shipping_fee: string;
  tax_amount: string;
  total: string;
  payment_status: string;
  fulfillment_status: string;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  author: string;
  createdAt: string;
}
