'use client';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';
import { ProductCompareTable } from '@/components/compare/ProductCompareTable';

export default function ComparePage() {
  const { items, clear } = useCompare();

  return (
    <div className="container-px py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Compare products</h1>
          <p className="text-sm text-muted">
            Side by side — product type, format, delivery method, price, and more.
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="btn-secondary h-9 px-4 text-sm">
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold text-ink">Nothing to compare yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Tap "Compare" on any product card to add it here. Add two to four products to see them side by side.
          </p>
          <Link href="/shop" className="btn-primary mt-5 inline-flex">
            Browse products
          </Link>
        </div>
      ) : items.length === 1 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold text-ink">Add one more to compare</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            You've got one product flagged. Add at least one more and they'll line up here side by side.
          </p>
          <Link href="/shop" className="btn-primary mt-5 inline-flex">
            Find another product
          </Link>
        </div>
      ) : (
        <ProductCompareTable products={items} />
      )}
    </div>
  );
}
