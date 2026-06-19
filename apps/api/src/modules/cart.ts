// =============================================================================
// Cart routes. Work for both guests (X-Session-Id header) and logged-in users
// (JWT cookie). optionalAuthenticate attaches req.user when present without
// blocking guests.
// =============================================================================
import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { optionalAuthenticate, authenticate } from '../middlewares/authenticate.ts';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeGuestCart,
  type CartOwner,
} from '../services/cartService.ts';

const router = Router();

// Resolve who owns this cart: the authenticated user wins; otherwise the guest
// session id from the X-Session-Id header.
function resolveOwner(req: Request): CartOwner {
  if (req.user) return { userId: req.user.id };
  const sessionId = req.header('x-session-id');
  if (sessionId) return { sessionId };
  throw AppError.badRequest('Provide an X-Session-Id header for guest carts, or sign in');
}

router.get(
  '/',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    // A guest with no session yet simply has an empty cart.
    if (!req.user && !req.header('x-session-id')) {
      res.json({ items: [], subtotal: 0, itemCount: 0 });
      return;
    }
    res.json(await getCart(resolveOwner(req)));
  }),
);

const addSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(99).default(1),
});

router.post(
  '/items',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const body = parseOrThrow(addSchema, req.body);
    const cart = await addItem(resolveOwner(req), body.productId, body.variantId ?? null, body.quantity);
    res.status(201).json(cart);
  }),
);

const qtySchema = z.object({ quantity: z.number().int().min(0).max(99) });

router.patch(
  '/items/:id',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const { quantity } = parseOrThrow(qtySchema, req.body);
    res.json(await updateItem(resolveOwner(req), req.params.id, quantity));
  }),
);

router.delete(
  '/items/:id',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    res.json(await removeItem(resolveOwner(req), req.params.id));
  }),
);

router.delete(
  '/',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    await clearCart(resolveOwner(req));
    res.json({ items: [], subtotal: 0, itemCount: 0 });
  }),
);

// Explicit merge endpoint (the auth routes also merge on login/register).
const mergeSchema = z.object({ guestSessionId: z.string().min(1).max(120) });
router.post(
  '/merge',
  authenticate,
  asyncHandler(async (req, res) => {
    const { guestSessionId } = parseOrThrow(mergeSchema, req.body);
    await mergeGuestCart(guestSessionId, req.user!.id);
    res.json(await getCart({ userId: req.user!.id }));
  }),
);

export default router;
