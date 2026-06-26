// =============================================================================
// Order service. Creating an order is a single transaction that:
//   1. reads the user's cart joined to LIVE product prices (never client prices)
//   2. verifies stock for every line
//   3. computes subtotal/discount/shipping/tax/total SERVER-SIDE
//   4. snapshots each line into order_items.product_snapshot
//   5. clears the cart
// Stock is decremented later by the DB trigger when payment_status -> 'paid'.
// =============================================================================
import { query, withTransaction } from '../config/database.ts';
import { AppError } from '../utils/AppError.ts';

// Simple, transparent commercial rules. Centralized so the storefront can show
// the same numbers the server will charge.
const FREE_SHIPPING_THRESHOLD = 5000; // INR
const FLAT_SHIPPING_FEE = 199; // INR
const TAX_RATE = 0.18; // 18% GST

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

export interface CreateOrderInput {
  shippingAddress: ShippingAddress;
  couponCode?: string;
  notes?: string;
  shippingMethod?: string;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  paymentStatus: string;
}

function round2(n: number) {
  return Number(n.toFixed(2));
}

export async function createOrderFromCart(userId: string, input: CreateOrderInput): Promise<CreatedOrder> {
  return withTransaction(async (client) => {
    // 1. Authoritative cart read with row locks on the products being purchased.
    const { rows: lines } = await client.query<{
      product_id: string;
      variant_id: string | null;
      name: string;
      sku: string | null;
      slug: string;
      unit_price: string;
      quantity: number;
      stock_quantity: number;
      variant_name: string | null;
    }>(
      `SELECT ci.product_id, ci.variant_id, p.name, p.sku, p.slug,
              (p.base_price + COALESCE(v.price_modifier, 0)) AS unit_price,
              ci.quantity,
              COALESCE(v.stock_quantity, p.stock_quantity) AS stock_quantity,
              v.name AS variant_name
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id AND p.deleted_at IS NULL AND p.is_active = true
       LEFT JOIN product_variants v ON v.id = ci.variant_id
       WHERE ci.user_id = $1
       FOR UPDATE OF p`,
      [userId],
    );

    if (lines.length === 0) throw AppError.badRequest('Your cart is empty');

    // 2. Stock check + 3. server-side subtotal.
    let subtotal = 0;
    for (const line of lines) {
      if (line.quantity > line.stock_quantity) {
        throw AppError.conflict(`Only ${line.stock_quantity} of "${line.name}" left in stock`);
      }
      subtotal += Number(line.unit_price) * line.quantity;
    }
    subtotal = round2(subtotal);

    // Coupon discount via the DB function (single source of truth for coupon math).
    // NOTE: used_count is NOT incremented here — it's incremented AFTER payment
    // succeeds in paymentService.mockCheckout. This prevents a failed payment from
    // consuming a limited-use coupon (the coupon can be retried).
    let discountAmount = 0;
    let couponId: string | null = null;
    if (input.couponCode) {
      const { rows: disc } = await client.query<{ discount: string }>('SELECT validate_coupon($1, $2) AS discount', [
        input.couponCode,
        subtotal,
      ]);
      discountAmount = round2(Number(disc[0].discount));
      // Validate-only: fetch the coupon id without incrementing used_count.
      const { rows: c } = await client.query<{ id: string }>(
        'SELECT id FROM coupons WHERE code = $1',
        [input.couponCode],
      );
      couponId = c[0]?.id ?? null;
    }

    const taxable = Math.max(subtotal - discountAmount, 0);
    const selectedMethod = input.shippingMethod || 'Standard';
    let shippingFee = 0;
    if (selectedMethod === 'Express') {
      shippingFee = 250;
    } else if (selectedMethod === 'Next-Day') {
      shippingFee = 500;
    } else {
      shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
    }
    const taxAmount = round2(taxable * TAX_RATE);
    const total = round2(taxable + shippingFee + taxAmount);

    // Fetch user email for order record
    const { rows: userRows } = await client.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [userId]);
    const email = userRows[0]?.email ?? null;

    // 4. Create the order + snapshotted line items.
    const { rows: orderRows } = await client.query<{ id: string; order_number: string; payment_status: string }>(
      `INSERT INTO orders (order_number, user_id, email, shipping_address, subtotal, discount_amount,
                           shipping_fee, shipping_cost, tax_amount, total, coupon_id, notes, shipping_method)
       VALUES (generate_order_number(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, order_number, payment_status`,
      [
        userId,
        email,
        JSON.stringify(input.shippingAddress),
        subtotal,
        discountAmount,
        shippingFee,
        shippingFee, // shipping_cost
        taxAmount,
        total,
        couponId,
        input.notes ?? null,
        selectedMethod, // shipping_method
      ],
    );
    const order = orderRows[0];

    // Log placement timeline event
    await client.query(
      `INSERT INTO order_timeline (order_id, status, note, created_by)
       VALUES ($1, 'placed', 'Order staged and pending payment confirmation.', $2)`,
      [order.id, userId],
    );

    for (const line of lines) {
      const unitPrice = round2(Number(line.unit_price));
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_snapshot, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          line.product_id,
          line.variant_id,
          JSON.stringify({
            name: line.name,
            sku: line.sku,
            slug: line.slug,
            variant: line.variant_name,
            unitPrice,
          }),
          line.quantity,
          unitPrice,
          round2(unitPrice * line.quantity),
        ],
      );
    }

    // 5. Empty the cart now that it is captured in the order.
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    return {
      id: order.id,
      orderNumber: order.order_number,
      subtotal,
      discountAmount,
      shippingFee,
      taxAmount,
      total,
      paymentStatus: order.payment_status,
    };
  });
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

export async function listOrdersForUser(userId: string): Promise<OrderListItem[]> {
  const { rows } = await query(
    `SELECT o.id, o.order_number, o.total, o.payment_status, o.fulfillment_status, o.created_at,
            (SELECT COALESCE(SUM(quantity),0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
     FROM orders o
     WHERE o.user_id = $1 AND o.deleted_at IS NULL
     ORDER BY o.created_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    total: Number(r.total),
    paymentStatus: r.payment_status,
    fulfillmentStatus: r.fulfillment_status,
    createdAt: r.created_at,
    itemCount: Number(r.item_count),
  }));
}

/** Full order detail. If `userId` is provided, ownership is enforced. */
export async function getOrderDetail(orderId: string, userId?: string) {
  const params: unknown[] = [orderId];
  let ownership = '';
  if (userId) {
    ownership = ' AND o.user_id = $2';
    params.push(userId);
  }

  const { rows } = await query(
    `SELECT o.*, u.email AS customer_email,
            COALESCE(json_agg(json_build_object(
              'id', oi.id, 'productId', oi.product_id, 'snapshot', oi.product_snapshot,
              'quantity', oi.quantity, 'unitPrice', oi.unit_price, 'totalPrice', oi.total_price
            ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = $1 AND o.deleted_at IS NULL${ownership}
     GROUP BY o.id, u.email`,
    params,
  );
  if (rows.length === 0) throw AppError.notFound('Order not found');
  return rows[0];
}
