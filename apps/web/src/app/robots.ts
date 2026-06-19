import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Crawlers may index the storefront but not private/account/admin areas.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/checkout', '/cart', '/orders', '/profile', '/wishlist', '/auth/'],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
