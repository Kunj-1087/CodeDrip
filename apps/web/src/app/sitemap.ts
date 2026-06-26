import type { MetadataRoute } from 'next';
import { fetchJSON } from '@/lib/server-api';
import { starterPosts } from '@/lib/blog-seed';
import type { Product, Category } from '@/types';

export const revalidate = 86400; // Revalidate sitemap every 24 hours (86400 seconds)

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function fetchAllProducts(): Promise<Product[]> {
  const allProducts: Product[] = [];
  let page = 1;
  const limit = 60; // Max limit supported by public API controller validation

  try {
    while (true) {
      // Fetch active, non-deleted catalog items in chunks of 60
      const res = await fetchJSON<{ products: Product[] }>(`/products?limit=${limit}&page=${page}`);
      if (!res || !res.products || res.products.length === 0) {
        break;
      }
      allProducts.push(...res.products);
      if (res.products.length < limit) {
        break;
      }
      page++;
    }
  } catch (err) {
    console.error('Error paginating sitemap products:', err);
  }

  return allProducts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    fetchAllProducts(),
    fetchJSON<{ categories: Category[] }>('/categories'),
  ]);

  const now = new Date();

  // 1. Static Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${SITE}/shop`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${SITE}/about`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${SITE}/faq`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${SITE}/contact`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${SITE}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
    { url: `${SITE}/terms-of-service`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
    { url: `${SITE}/refund-policy`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
    { url: `${SITE}/shipping-policy`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
  ];

  // 2. Dynamic Categories
  const categoryRoutes: MetadataRoute.Sitemap = (categories?.categories ?? []).map((c) => ({
    url: `${SITE}/shop?category=${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
    lastModified: now,
  }));

  // 3. Dynamic Products
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}/shop/${p.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
    lastModified: now, // Fallback since updatedAt is not exposed on mapProduct controller
  }));

  // 4. Dynamic Blog Posts
  const blogRoutes: MetadataRoute.Sitemap = starterPosts.map((post) => ({
    url: `${SITE}/blog/${post.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
    lastModified: new Date(post.date),
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
