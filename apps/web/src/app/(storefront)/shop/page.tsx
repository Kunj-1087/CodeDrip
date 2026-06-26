import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';

interface Props {
  searchParams: {
    category?: string;
    q?: string;
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const category = searchParams.category;
  const q = searchParams.q;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  let title = 'Shop Developer Apparel | CodeDrip';
  let description = 'Browse t-shirts, hoodies, and limited drops for developers who wear their stack with pride.';
  let canonicalUrl = `${siteUrl}/shop`;

  if (q) {
    title = `Search results for '${q}' | CodeDrip`;
    description = `Browse search results for '${q}' at CodeDrip. Developer t-shirts, hoodies, and apparel for the tech-obsessed.`;
    canonicalUrl = `${siteUrl}/shop?q=${encodeURIComponent(q)}`;
  } else if (category) {
    const formattedCategory = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    title = `Shop ${formattedCategory} Online — Best Price | CodeDrip`;
    description = `Browse ${formattedCategory} at CodeDrip. Developer-focused apparel, t-shirts, and hoodies for coders and tech enthusiasts.`;
    canonicalUrl = `${siteUrl}/shop?category=${encodeURIComponent(category)}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: `${siteUrl}/og-default.svg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/og-default.svg`],
    },
  };
}

// useSearchParams (in ShopClient) requires a Suspense boundary.
export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-px py-16 text-muted">Loading products…</div>}>
      <ShopClient />
    </Suspense>
  );
}
