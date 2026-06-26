// Top-level API router. Mounts every domain under /api/<resource>.
import { Router } from 'express';
import auth from '../modules/auth.ts';
import store from '../modules/store.ts';
import categories from '../modules/categories.ts';
import products from '../modules/products.ts';
import reviews from '../modules/reviews.ts';
import cart from '../modules/cart.ts';
import wishlist from '../modules/wishlist.ts';
import coupons from '../modules/coupons.ts';
import addresses from '../modules/addresses.ts';
import profile from '../modules/profile.ts';
import orders from '../modules/orders.ts';
import payments from '../modules/payments.ts';
import newsletter from '../modules/newsletter.ts';
import admin from '../modules/admin/index.ts';

const router = Router();

router.use('/auth', auth);
router.use('/store-settings', store);
router.use('/categories', categories);
router.use('/products', products);
router.use('/reviews', reviews);
router.use('/cart', cart);
router.use('/wishlist', wishlist);
router.use('/coupons', coupons);
router.use('/addresses', addresses);
router.use('/profile', profile);
router.use('/orders', orders);
router.use('/payments', payments);
router.use('/newsletter', newsletter);
router.use('/admin', admin);

export default router;
