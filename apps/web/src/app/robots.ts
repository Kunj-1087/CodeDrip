import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/about',
          '/faq',
          '/contact',
          '/privacy-policy',
          '/terms-of-service',
          '/refund-policy',
          '/shipping-policy',
          '/blog/',
        ],
        disallow: [
          '/cart',
          '/checkout',
          '/wishlist',
          '/orders/',
          '/order-confirmation/',
          '/profile',
          '/auth/',
          '/admin/',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
