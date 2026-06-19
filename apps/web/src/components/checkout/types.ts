export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

// Mirror of the server-side commercial rules (orderService.ts) for an accurate
// pre-checkout preview. The SERVER total is always authoritative — this is only
// for display so the customer sees the same numbers before placing the order.
export const FREE_SHIPPING_THRESHOLD = 5000;
export const FLAT_SHIPPING_FEE = 199;
export const TAX_RATE = 0.18;

export function estimateTotals(subtotal: number, discount: number) {
  const taxable = Math.max(subtotal - discount, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const taxAmount = Math.round(taxable * TAX_RATE * 100) / 100;
  const total = Math.round((taxable + shippingFee + taxAmount) * 100) / 100;
  return { shippingFee, taxAmount, total };
}
