// Mock payment endpoint. The client sends ONLY { orderId }. See paymentService
// for the server-authoritative flow (HARD INVARIANT #2).
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { mockCheckout } from '../services/paymentService.ts';
import {
  sendEmail,
  orderConfirmationEmail,
  adminNewOrderAlertEmail,
} from '../services/emailService.ts';
import { query } from '../config/database.ts';
import { env } from '../config/env.ts';

const router = Router();
router.use(authenticate);

const checkoutSchema = z.object({ orderId: z.string().uuid() });

router.post(
  '/mock-checkout',
  asyncHandler(async (req, res) => {
    const { orderId } = parseOrThrow(checkoutSchema, req.body);
    const result = await mockCheckout(req.user!.id, orderId);

    if (result.success) {
      // Fetch order details for emails
      const { rows } = await query<{
        total: string;
        currency: string;
        order_number: string;
      }>(
        `SELECT o.total, o.order_number, (SELECT currency FROM store_settings LIMIT 1) AS currency
         FROM orders o
         WHERE o.id = $1`,
        [orderId],
      );
      const orderRow = rows[0];
      if (orderRow) {
        // 1. Order confirmation email
        const confirmMail = orderConfirmationEmail(result.orderNumber, orderRow.total, orderRow.currency);
        void sendEmail(req.user!.email, confirmMail.subject, confirmMail.html, confirmMail.text);

        // 2. Admin notification (non-blocking)
        const adminMail = adminNewOrderAlertEmail(
          result.orderNumber,
          req.user!.email,
          orderRow.total,
          orderRow.currency,
          env.siteUrl,
        );
        void sendEmail(env.notificationEmail || req.user!.email, adminMail.subject, adminMail.html, adminMail.text);
      }
    }

    // 200 with success=true on approval; 402 Payment Required on a declined card.
    res.status(result.success ? 200 : 402).json(result);
  }),
);

export default router;
