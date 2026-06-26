// Mirrors the server-side order math (apps/api orders module) so the cart and checkout
// can preview totals before the order is created. The API stays authoritative — these
// numbers are a faithful preview, never the source of truth.

const FREE_SHIPPING_THRESHOLD = 5000; // INR
const SHIPPING_FEE = 199; // INR
const GST_RATE = 0.18;

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export function computeTotals(subtotal: number, discount = 0): OrderTotals {
  const cappedDiscount = Math.min(discount, subtotal);
  const taxable = Math.max(0, subtotal - cappedDiscount);
  const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  const tax = Math.round(taxable * GST_RATE * 100) / 100;
  const total = taxable + shipping + tax;
  return { subtotal, discount: cappedDiscount, shipping, tax, total };
}

export { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, GST_RATE };
