import type { Product, StoreSettings } from '@/types';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'CodeDrip';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// JSON-LD structured data components rendered as <script> tags by the root and
// product page layouts. These make the store eligible for Google's rich result
// carousels, product snippets, breadcrumbs, and the knowledge panel.

export function OrganizationJsonLd({ settings }: { settings: StoreSettings | null }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings?.storeName ?? STORE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    contactPoint: settings?.supportEmail
      ? {
          '@type': 'ContactPoint',
          email: settings.supportEmail,
          contactType: 'customer support',
        }
      : undefined,
    sameAs: settings?.socialLinks ? Object.values(settings.socialLinks).filter(Boolean) : undefined,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: STORE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function HomeJsonLd({ settings }: { settings: StoreSettings | null }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: settings?.storeName ?? STORE_NAME,
    description:
      settings?.metaDescription ??
      'Developer apparel for coders, sysadmins, and tech enthusiasts who wear their stack with pride.',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    currencyAccepted: settings?.currency ?? 'INR',
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function ProductJsonLd({ product, currency }: { product: Product; currency: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description ?? '',
    sku: product.sku ?? undefined,
    brand: product.brand
      ? { '@type': 'Brand', name: product.brand }
      : { '@type': 'Brand', name: STORE_NAME },
    image: product.imageUrl ?? undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: product.basePrice,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/shop/${product.slug}`,
    },
    aggregateRating: product.reviewCount > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.avgRating,
          reviewCount: product.reviewCount,
        }
      : undefined,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
