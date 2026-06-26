'use client';
import Link from 'next/link';
import type { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { useCompare } from '@/context/CompareContext';
import { formatCurrency } from '@/lib/format';
import { StarRating } from '@/components/ui/StarRating';
import { StockBadge } from '@/components/ui/StockBadge';
import { ProductImage } from '@/components/ui/ProductImage';

// Side-by-side spec comparison. Products are columns; the left column is the
// attribute label. Spec rows are the UNION of every product's spec keys, so a
// missing spec on one part shows "—" rather than silently dropping the row —
// the gaps are exactly what a builder is comparing. Horizontally scrollable on
// small screens (the table never collapses below ~150px columns).
export function ProductCompareTable({ products }: { products: Product[] }) {
  const { settings } = useStore();
  const { remove } = useCompare();
  const currency = settings?.currency ?? 'INR';

  // Union of spec keys, preserving first-seen order across products.
  const specKeys: string[] = [];
  for (const p of products) {
    for (const k of Object.keys(p.specs ?? {})) if (!specKeys.includes(k)) specKeys.push(k);
  }

  const labelCell = 'sticky left-0 z-10 bg-surface px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-faint';

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className={labelCell} />
            {products.map((p) => (
              <th key={p.id} className="min-w-[180px] border-l border-border p-4 align-top">
                <div className="flex flex-col gap-2">
                  <Link href={`/shop/${p.slug}`} className="block aspect-square overflow-hidden rounded-md bg-surface-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <ProductImage src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  </Link>
                  <Link href={`/shop/${p.slug}`} className="line-clamp-2 text-left text-sm font-semibold text-ink hover:text-primary">
                    {p.name}
                  </Link>
                  <button onClick={() => remove(p.id)} className="self-start text-xs font-normal text-danger hover:underline">
                    Remove
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="Price" cells={products.map((p) => (
            <span className="font-bold text-primary">{formatCurrency(p.basePrice, currency)}</span>
          ))} />
          <Row label="Brand" cells={products.map((p) => p.brand || '—')} />
          <Row label="Rating" cells={products.map((p) => (p.reviewCount > 0 ? <StarRating value={p.avgRating} count={p.reviewCount} /> : '—'))} />
          <Row label="Availability" cells={products.map((p) => <StockBadge stock={p.inStock ? p.stockQuantity : 0} size="sm" />)} />
          {specKeys.map((key) => (
            <Row
              key={key}
              label={key.replace(/_/g, ' ')}
              mono
              cells={products.map((p) => p.specs?.[key] ?? '—')}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, cells, mono = false }: { label: string; cells: React.ReactNode[]; mono?: boolean }) {
  return (
    <tr className="border-b border-border last:border-0 odd:bg-surface-2/50">
      <th scope="row" className="sticky left-0 z-10 bg-inherit px-4 py-3 text-left text-xs font-semibold capitalize text-muted">
        {label}
      </th>
      {cells.map((c, i) => (
        <td key={i} className={`border-l border-border px-4 py-3 text-ink ${mono ? 'font-mono text-[13px]' : ''}`}>
          {c}
        </td>
      ))}
    </tr>
  );
}
