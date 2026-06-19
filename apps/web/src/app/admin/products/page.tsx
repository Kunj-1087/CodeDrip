'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Pagination as PageMeta } from '@/types';

interface Row {
  id: string;
  name: string;
  sku: string | null;
  basePrice: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryName: string;
}

export default function AdminProducts() {
  const { settings } = useStore();
  const { notify } = useToast();
  const currency = settings?.currency ?? 'INR';
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setRows(null);
    const qs = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) qs.set('search', search);
    api
      .get<{ products: Row[]; pagination: PageMeta }>(`/admin/products?${qs.toString()}`)
      .then((r) => {
        setRows(r.products);
        setMeta(r.pagination);
      })
      .catch(() => setRows([]));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const softDelete = async (id: string, name: string) => {
    if (!confirm(`Archive “${name}”? It stays on past orders but leaves the storefront.`)) return;
    try {
      await api.del(`/admin/products/${id}`);
      notify('Product archived', 'success');
      load();
    } catch {
      notify('Could not archive product', 'error');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>

      <input
        className="input mt-4 max-w-sm"
        placeholder="Search by name or SKU"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!rows ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3" colSpan={6}><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No products found.</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-primary">{p.name}</Link>
                    {p.isFeatured && <span className="ml-2"><Badge tone="info">Featured</Badge></span>}
                    <p className="text-xs text-muted">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.categoryName}</td>
                  <td className="px-4 py-3 text-ink">{formatCurrency(p.basePrice, currency)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stockQuantity <= 5 ? 'font-medium text-red-600' : 'text-ink'}>{p.stockQuantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-primary hover:underline">Edit</Link>
                    <button onClick={() => softDelete(p.id, p.name)} className="ml-3 text-red-600 hover:underline">Archive</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}
