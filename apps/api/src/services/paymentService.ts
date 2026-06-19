// =============================================================================
// Mock payment engine (Phase 3).
//
// HARD INVARIANT #2: payment status is set SERVER-SIDE ONLY. The client sends
// nothing but an order_id. The server re-reads the order's real total from the
// DB, runs the mock gateway, and only then writes payment_status. There is no
// code path by which a client can mark its own order paid or set the amount.
// =============================================================================
import crypto from 'node:crypto';
import { withTransaction } from '../config/database.ts';
import { AppError } from '../utils/AppError.ts';

export interface MockCheckoutResult {
  success: boolean;
  orderNumber: string;
  paymentStatus: 'paid' | 'failed';
  message: string;
  transactionId?: string;
}

// 95% success / 5% failure, for exercising both UI paths. crypto.randomInt is
// used purely so behavior is non-deterministic across attempts.
function gatewayApproves(): boolean {
  return crypto.randomInt(0, 100) < 95;
}

export async function mockCheckout(userId: string, orderId: string): Promise<MockCheckoutResult> {
  return withTransaction(async (client) => {
    // Re-read the order under a row lock. Ownership is enforced here too.
    const { rows } = await client.query<{
      id: string;
      order_number: string;
      total: string;
      currency: string;
      payment_status: string;
    }>(
      `SELECT o.id, o.order_number, o.total, o.payment_status, ss.currency
       FROM orders o, store_settings ss
       WHERE o.id = $1 AND o.user_id = $2 AND o.deleted_at IS NULL
       FOR UPDATE OF o`,
      [orderId, userId],
    );

    if (rows.length === 0) throw AppError.notFound('Order not found');
    const order = rows[0];

    // Idempotency / state guard.
    if (order.payment_status === 'paid') {
      return {
        success: true,
        orderNumber: order.order_number,
        paymentStatus: 'paid',
        message: 'This order has already been paid.',
      };
    }
    if (order.payment_status === 'refunded') {
      throw AppError.conflict('This order has been refunded and cannot be paid again.');
    }

    // The amount charged is ALWAYS the server-side order total — never a client value.
    const amount = Number(order.total);
    const approved = gatewayApproves();
    const transactionId = `MOCK-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;

    if (approved) {
      await client.query(
        `INSERT INTO payments (order_id, method, amount, currency, status, transaction_id, gateway_response)
         VALUES ($1, 'card', $2, $3, 'success', $4, $5)`,
        [order.id, amount, order.currency, transactionId, JSON.stringify({ mock: true, approved: true })],
      );
      // This UPDATE fires decrement_stock_on_paid() — stock is reduced atomically.
      await client.query("UPDATE orders SET payment_status = 'paid' WHERE id = $1", [order.id]);

      return {
        success: true,
        orderNumber: order.order_number,
        paymentStatus: 'paid',
        message: 'Payment approved. Your order is confirmed.',
        transactionId,
      };
    }

    // Failure path — persist the failed attempt so the order reflects reality.
    await client.query(
      `INSERT INTO payments (order_id, method, amount, currency, status, transaction_id, gateway_response)
       VALUES ($1, 'card', $2, $3, 'failed', $4, $5)`,
      [order.id, amount, order.currency, transactionId, JSON.stringify({ mock: true, approved: false })],
    );
    await client.query("UPDATE orders SET payment_status = 'failed' WHERE id = $1", [order.id]);

    return {
      success: false,
      orderNumber: order.order_number,
      paymentStatus: 'failed',
      message: 'Your payment was declined by the (mock) gateway. Please try again.',
    };
  });
}
