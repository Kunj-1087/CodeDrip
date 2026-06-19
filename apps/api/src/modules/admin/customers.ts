// Admin customer management: list, detail (with order history), role change.
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { AppError } from '../../utils/AppError.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parseOrThrow(
      z.object({
        search: z.string().max(120).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }),
      req.query,
    );
    const where: string[] = ['1=1'];
    const params: unknown[] = [];
    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(`(u.email ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`);
    }
    const whereSql = where.join(' AND ');
    const { rows: countRows } = await query<{ total: string }>(`SELECT count(*) total FROM users u WHERE ${whereSql}`, params);
    params.push(q.limit, (q.page - 1) * q.limit);
    const { rows } = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
              (SELECT count(*) FROM orders o WHERE o.user_id = u.id AND o.deleted_at IS NULL) AS order_count,
              (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.user_id = u.id AND o.payment_status = 'paid') AS lifetime_value
       FROM users u WHERE ${whereSql} ORDER BY u.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    res.json({
      customers: rows.map((r) => ({
        id: r.id,
        email: r.email,
        firstName: r.first_name,
        lastName: r.last_name,
        role: r.role,
        orderCount: Number(r.order_count),
        lifetimeValue: Number(r.lifetime_value),
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

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'SELECT id, email, first_name, last_name, role, is_verified, created_at FROM users WHERE id = $1',
      [req.params.id],
    );
    if (rows.length === 0) throw AppError.notFound('Customer not found');
    const { rows: orders } = await query(
      `SELECT id, order_number, total, payment_status, fulfillment_status, created_at
       FROM orders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [req.params.id],
    );
    res.json({ customer: rows[0], orders });
  }),
);

const roleSchema = z.object({ role: z.enum(['customer', 'admin']) });

router.patch(
  '/:id/role',
  asyncHandler(async (req, res) => {
    const { role } = parseOrThrow(roleSchema, req.body);
    // Guard: never let the last admin demote themselves into a store with no admin.
    if (role === 'customer') {
      const { rows } = await query<{ count: string }>("SELECT count(*) FROM users WHERE role = 'admin'");
      if (Number(rows[0].count) <= 1) {
        const { rows: target } = await query('SELECT role FROM users WHERE id = $1', [req.params.id]);
        if (target[0]?.role === 'admin') throw AppError.conflict('Cannot remove the last remaining admin');
      }
    }
    const { rowCount } = await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    if (rowCount === 0) throw AppError.notFound('Customer not found');
    res.json({ ok: true });
  }),
);

export default router;
