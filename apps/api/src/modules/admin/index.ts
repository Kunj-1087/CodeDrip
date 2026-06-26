// Admin router. authenticate + requireAdmin are applied ONCE here, so every
// sub-router below is guaranteed to run only for verified admins.
import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.ts';
import { requireAdmin } from '../../middlewares/requireAdmin.ts';
import products from './products.ts';
import categories from './categories.ts';
import orders from './orders.ts';
import customers from './customers.ts';
import coupons from './coupons.ts';
import settings from './settings.ts';
import analytics from './analytics.ts';
import media from './media.ts';
import seo from './seo.ts';

const router = Router();

router.use(authenticate, requireAdmin);

router.use('/products', products);
router.use('/categories', categories);
router.use('/orders', orders);
router.use('/customers', customers);
router.use('/coupons', coupons);
router.use('/settings', settings);
router.use('/analytics', analytics);
router.use('/media', media);
router.use('/seo', seo);

export default router;
