// Customer order routes: create (from cart), list my orders, view one.
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { createOrderFromCart, listOrdersForUser, getOrderDetail } from '../services/orderService.ts';
import { query } from '../config/database.ts';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1).max(120),
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(100).default('India'),
    phone: z.string().max(20).optional(),
  }),
  couponCode: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
  shippingMethod: z.string().max(60).optional(),
});

// Create an order from the signed-in user's cart. All money is computed
// server-side in orderService; the client cannot influence totals.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parseOrThrow(createSchema, req.body);
    const order = await createOrderFromCart(req.user!.id, body);
    res.status(201).json({ order });
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ orders: await listOrdersForUser(req.user!.id) });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await getOrderDetail(req.params.id, req.user!.id);
    res.json({ order });
  }),
);

router.get(
  '/:id/timeline',
  asyncHandler(async (req, res) => {
    // Enforce ownership by trying to fetch order detail first
    await getOrderDetail(req.params.id, req.user!.id);
    const { rows } = await query(
      'SELECT id, status, note, created_at AS "createdAt" FROM order_timeline WHERE order_id = $1 ORDER BY created_at ASC',
      [req.params.id],
    );
    res.json({ timeline: rows });
  }),
);

export default router;
