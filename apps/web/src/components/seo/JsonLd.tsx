import type { Product, StoreSettings } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'OursCart';

// Serialize JSON-LD safely: JSON.stringify escapes quotes, and we additionally
// escape "<" so a product name containing "</script>" can never break out of
// the script tag. This is the XSS-safe way to embed structured data
// (INVARIANT #5 — no unescaped HTML injection).
function jsonLd(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}

export function HomeJsonLd({ settings }: { settings: StoreSettings | null }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: settings?.storeName ?? STORE_NAME,
    description: settings?.metaDescription ?? undefined,
    url: SITE_URL,
    email: settings?.supportEmail ?? undefined,
    telephone: settings?.supportPhone ?? undefined,
    address: settings?.address ?? undefined,
    sameAs: settings?.socialLinks ? Object.values(settings.socialLinks) : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />;
}

export function ProductJsonLd({ product, currency }: { product: Product; currency: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.sku ?? undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    image: product.imageUrl ? `${SITE_URL}${product.imageUrl}` : undefined,
    aggregateRating:
      product.reviewCount > 0
        ? { '@type': 'AggregateRating', ratingValue: product.avgRating, reviewCount: product.reviewCount }
        : undefined,
    offers: {
      '@type': 'Offer',
      price: product.basePrice,
      priceCurrency: currency,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/shop/${product.slug}`,
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />;
}
