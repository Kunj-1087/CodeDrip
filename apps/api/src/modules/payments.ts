// Mock payment endpoint. The client sends ONLY { orderId }. See paymentService
// for the server-authoritative flow (HARD INVARIANT #2).
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { mockCheckout } from '../services/paymentService.ts';

const router = Router();
router.use(authenticate);

// Note: orderId is the ONLY accepted field. No amount, no status — those are
// read from / written to the DB by the server.
const checkoutSchema = z.object({ orderId: z.string().uuid() });

router.post(
  '/mock-checkout',
  asyncHandler(async (req, res) => {
    const { orderId } = parseOrThrow(checkoutSchema, req.body);
    const result = await mockCheckout(req.user!.id, orderId);
    // 200 with success=true on approval; 402 Payment Required on a declined card.
    res.status(result.success ? 200 : 402).json(result);
  }),
);

export default router;
