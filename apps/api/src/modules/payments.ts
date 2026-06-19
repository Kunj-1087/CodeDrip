// Mock payment endpoint. The client sends ONLY { orderId }. See paymentService
// for the server-authoritative flow (HARD INVARIANT #2).
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { mockCheckout } from '../services/paymentService.ts';
import { sendEmail, orderConfirmationEmail } from '../services/emailService.ts';
import { query } from '../config/database.ts';

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

    // On approval, fire a confirmation email (non-blocking; mock transport logs
    // it in dev). The order total is re-read from the DB, never trusted from client.
    if (result.success) {
      const { rows } = await query<{ total: string; currency: string }>(
        `SELECT o.total, ss.currency FROM orders o, store_settings ss WHERE o.id = $1`,
        [orderId],
      );
      if (rows[0]) {
        const mail = orderConfirmationEmail(result.orderNumber, rows[0].total, rows[0].currency);
        void sendEmail(req.user!.email, mail.subject, mail.html, mail.text);
      }
    }

    // 200 with success=true on approval; 402 Payment Required on a declined card.
    res.status(result.success ? 200 : 402).json(result);
  }),
);

export default router;
