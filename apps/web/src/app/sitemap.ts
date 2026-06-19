import type { MetadataRoute } from 'next';
import { fetchJSON } from '@/lib/server-api';
import type { Product, Category } from '@/types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Dynamic sitemap: static pages + every active product and category URL, pulled
// live from the API. (For very large catalogs, paginate /products here.)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    fetchJSON<{ products: Product[] }>('/products?limit=60'),
    fetchJSON<{ categories: Category[] }>('/categories'),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/shop`, changeFrequency: 'daily', priority: 0.9 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories?.categories ?? []).map((c) => ({
    url: `${SITE}/shop?category=${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = (products?.products ?? []).map((p) => ({
    url: `${SITE}/shop/${p.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
