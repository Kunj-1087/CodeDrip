import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';

export const metadata: Metadata = {
  title: 'Shop all parts',
  description: 'Browse RAM, SSDs, hard drives and accessories. Filter by category and price, sorted your way.',
  alternates: { canonical: '/shop' },
};

// useSearchParams (in ShopClient) requires a Suspense boundary.
export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-px py-16 text-muted">Loading products…</div>}>
      <ShopClient />
    </Suspense>
  );
}
