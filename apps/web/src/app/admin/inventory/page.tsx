'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/format';
import { StockBadge } from '@/components/ui/StockBadge';
import { Skeleton } from '@/components/ui/Skeleton';

// Inventory view: the same products as /admin/products, but framed around stock.
// Stock is edited on the product editor (single source of truth), so each row
// links there rather than duplicating an edit control here.
const LOW_STOCK = 5;

interface Row {
  id: string;
  name: string;
  sku: string | null;
  categoryName: string | null;
  basePrice: number;
  stockQuantity: number;
}

export default function AdminInventoryPage() {
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    // Pull a generous page; inventory is a scan view, not paginated browsing.
    api
      .get<{ products: Row[] }>('/admin/products?limit=200')
      .then((r) => setRows(r.products))
      .catch(() => setRows([]));
  }, []);

  const counts = useMemo(() => {
    const list = rows ?? [];
    return {
      total: list.length,
      low: list.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK).length,
      out: list.filter((p) => p.stockQuantity <= 0).length,
    };
  }, [rows]);

  const visible = useMemo(() => {
    const list = (rows ?? []).slice().sort((a, b) => a.stockQuantity - b.stockQuantity);
    if (filter === 'low') return list.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK);
    if (filter === 'out') return list.filter((p) => p.stockQuantity <= 0);
    return list;
  }, [rows, filter]);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Inventory</h1>
      <p className="mt-1 text-sm text-muted">Sorted lowest-stock first, so the parts about to sell out are up top.</p>

      {/* Summary + filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['all', `All (${counts.total})`],
            ['low', `Low stock (${counts.low})`],
            ['out', `Out of stock (${counts.out})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white'
                : 'rounded-md border border-border-strong px-3 py-1.5 text-sm text-muted hover:bg-surface-3 hover:text-ink'
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-border-strong text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-faint">Product</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-faint">SKU</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-faint">Category</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-faint">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-faint">Qty</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-faint">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3" colSpan={7}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  {filter === 'all' ? 'No products yet.' : 'Nothing in this state — stock levels look healthy.'}
                </td>
              </tr>
            ) : (
              visible.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-3">
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{p.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{p.categoryName ?? '—'}</td>
                  <td className="px-4 py-3 text-ink">{formatCurrency(p.basePrice, currency)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{p.stockQuantity}</td>
                  <td className="px-4 py-3">
                    <StockBadge stock={p.stockQuantity} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-primary hover:underline">
                      Adjust
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
