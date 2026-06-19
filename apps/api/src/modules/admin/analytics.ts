// =============================================================================
// Admin analytics: KPI cards, revenue time series, top products, status mix.
// All revenue figures count only PAID orders. Series are returned as plain
// arrays the frontend renders with the raw Canvas charts (no chart library).
// =============================================================================
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';

const router = Router();

// KPI cards for the dashboard header.
router.get(
  '/kpis',
  asyncHandler(async (_req, res) => {
    const { rows } = await query<{
      revenue_mtd: string;
      orders_today: string;
      total_customers: string;
      low_stock: string;
    }>(
      `SELECT
        (SELECT COALESCE(SUM(total),0) FROM orders
          WHERE payment_status='paid' AND created_at >= date_trunc('month', now())) AS revenue_mtd,
        (SELECT count(*) FROM orders
          WHERE created_at >= date_trunc('day', now()) AND deleted_at IS NULL) AS orders_today,
        (SELECT count(*) FROM users WHERE role='customer') AS total_customers,
        (SELECT count(*) FROM products
          WHERE stock_quantity <= 5 AND is_active=true AND deleted_at IS NULL) AS low_stock`,
    );
    const k = rows[0];
    res.json({
      revenueMtd: Number(k.revenue_mtd),
      ordersToday: Number(k.orders_today),
      totalCustomers: Number(k.total_customers),
      lowStock: Number(k.low_stock),
    });
  }),
);

// Daily revenue + order count over the last N days (default 30). Gap-filled so
// the chart has a point for every day, even days with no sales.
router.get(
  '/revenue-series',
  asyncHandler(async (req, res) => {
    const { days } = parseOrThrow(z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }), req.query);
    const { rows } = await query(
      `WITH day_series AS (
         SELECT generate_series(date_trunc('day', now()) - ($1::int - 1) * interval '1 day',
                                date_trunc('day', now()), interval '1 day')::date AS day
       )
       SELECT d.day,
              COALESCE(SUM(o.total) FILTER (WHERE o.payment_status='paid'), 0) AS revenue,
              COUNT(o.id) FILTER (WHERE o.payment_status='paid') AS orders
       FROM day_series d
       LEFT JOIN orders o ON date_trunc('day', o.created_at)::date = d.day AND o.deleted_at IS NULL
       GROUP BY d.day ORDER BY d.day ASC`,
      [days],
    );
    res.json({
      series: rows.map((r) => ({ date: r.day, revenue: Number(r.revenue), orders: Number(r.orders) })),
    });
  }),
);

// Top products by paid revenue this month.
router.get(
  '/top-products',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT oi.product_id,
              oi.product_snapshot->>'name' AS name,
              SUM(oi.quantity) AS units,
              SUM(oi.total_price) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.payment_status='paid' AND o.created_at >= date_trunc('month', now())
       GROUP BY oi.product_id, oi.product_snapshot->>'name'
       ORDER BY revenue DESC LIMIT 5`,
    );
    res.json({
      products: rows.map((r) => ({
        productId: r.product_id,
        name: r.name,
        units: Number(r.units),
        revenue: Number(r.revenue),
      })),
    });
  }),
);

// Order count grouped by fulfillment status — feeds the doughnut chart.
router.get(
  '/status-breakdown',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT fulfillment_status AS status, count(*) AS count
       FROM orders WHERE deleted_at IS NULL GROUP BY fulfillment_status`,
    );
    res.json({ breakdown: rows.map((r) => ({ status: r.status, count: Number(r.count) })) });
  }),
);

// Recent orders table on the dashboard.
router.get(
  '/recent-orders',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT o.id, o.order_number, o.total, o.payment_status, o.fulfillment_status, o.created_at, u.email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.deleted_at IS NULL ORDER BY o.created_at DESC LIMIT 10`,
    );
    res.json({
      orders: rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        total: Number(r.total),
        paymentStatus: r.payment_status,
        fulfillmentStatus: r.fulfillment_status,
        email: r.email,
        createdAt: r.created_at,
      })),
    });
  }),
);

export default router;
