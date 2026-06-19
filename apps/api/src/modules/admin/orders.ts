// Admin order management: filterable list, detail, status updates, CSV export.
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { AppError } from '../../utils/AppError.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';
import { getOrderDetail } from '../../services/orderService.ts';

const router = Router();

const filterSchema = z.object({
  fulfillmentStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  search: z.string().max(120).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Shared WHERE builder so the list and the CSV export apply identical filters.
function buildWhere(q: z.infer<typeof filterSchema>) {
  const where: string[] = ['o.deleted_at IS NULL'];
  const params: unknown[] = [];
  if (q.fulfillmentStatus) {
    params.push(q.fulfillmentStatus);
    where.push(`o.fulfillment_status = $${params.length}`);
  }
  if (q.paymentStatus) {
    params.push(q.paymentStatus);
    where.push(`o.payment_status = $${params.length}`);
  }
  if (q.search) {
    params.push(`%${q.search}%`);
    where.push(`(o.order_number ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  if (q.from) {
    params.push(q.from);
    where.push(`o.created_at >= $${params.length}`);
  }
  if (q.to) {
    params.push(q.to);
    where.push(`o.created_at <= $${params.length}`);
  }
  return { whereSql: where.join(' AND '), params };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parseOrThrow(filterSchema, req.query);
    const { whereSql, params } = buildWhere(q);

    const { rows: countRows } = await query<{ total: string }>(
      `SELECT count(*) total FROM orders o JOIN users u ON u.id = o.user_id WHERE ${whereSql}`,
      params,
    );
    params.push(q.limit, (q.page - 1) * q.limit);
    const { rows } = await query(
      `SELECT o.id, o.order_number, o.total, o.payment_status, o.fulfillment_status, o.created_at,
              u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE ${whereSql} ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({
      orders: rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        total: Number(r.total),
        paymentStatus: r.payment_status,
        fulfillmentStatus: r.fulfillment_status,
        customerEmail: r.customer_email,
        createdAt: r.created_at,
      })),
      pagination: {
        page: q.page,
        limit: q.limit,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(Number(countRows[0].total) / q.limit),
      },
    });
  }),
);

// CSV export of the current filter set (no paging). Streamed as a download.
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const q = parseOrThrow(filterSchema.omit({ page: true, limit: true }), req.query);
    const { whereSql, params } = buildWhere({ ...q, page: 1, limit: 1 });
    const { rows } = await query(
      `SELECT o.order_number, u.email, o.payment_status, o.fulfillment_status, o.subtotal,
              o.discount_amount, o.total, o.created_at
       FROM orders o JOIN users u ON u.id = o.user_id WHERE ${whereSql} ORDER BY o.created_at DESC`,
      params,
    );

    const header = ['Order', 'Email', 'Payment', 'Fulfillment', 'Subtotal', 'Discount', 'Total', 'Date'];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      header.join(','),
      ...rows.map((r) =>
        [r.order_number, r.email, r.payment_status, r.fulfillment_status, r.subtotal, r.discount_amount, r.total, r.created_at]
          .map(escape)
          .join(','),
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json({ order: await getOrderDetail(req.params.id) });
  }),
);

const updateSchema = z.object({
  fulfillmentStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  notes: z.string().max(1000).optional(),
});

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(updateSchema, req.body);
    const sets: string[] = [];
    const params: unknown[] = [];
    if (b.fulfillmentStatus) {
      params.push(b.fulfillmentStatus);
      sets.push(`fulfillment_status = $${params.length}`);
    }
    if (b.paymentStatus) {
      params.push(b.paymentStatus);
      sets.push(`payment_status = $${params.length}`);
    }
    if (b.notes !== undefined) {
      params.push(b.notes);
      sets.push(`notes = $${params.length}`);
    }
    if (sets.length === 0) throw AppError.badRequest('Nothing to update');
    params.push(req.params.id);
    const { rowCount } = await query(
      `UPDATE orders SET ${sets.join(', ')} WHERE id = $${params.length} AND deleted_at IS NULL`,
      params,
    );
    if (rowCount === 0) throw AppError.notFound('Order not found');
    res.json({ ok: true });
  }),
);

export default router;
