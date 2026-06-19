'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Pagination as PageMeta } from '@/types';

interface Row {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'customer' | 'admin';
  orderCount: number;
  lifetimeValue: number;
  createdAt: string;
}

export default function AdminCustomers() {
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
      .get<{ customers: Row[]; pagination: PageMeta }>(`/admin/customers?${qs.toString()}`)
      .then((r) => { setRows(r.customers); setMeta(r.pagination); })
      .catch(() => setRows([]));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const setRole = async (id: string, role: 'customer' | 'admin') => {
    try {
      await api.patch(`/admin/customers/${id}/role`, { role });
      setRows((cur) => cur?.map((r) => (r.id === id ? { ...r, role } : r)) ?? cur);
      notify(`Role updated to ${role}`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not change role', 'error');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink">Customers</h1>
      <input
        className="input mt-4 max-w-sm"
        placeholder="Search name or email"
        value={search}
        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
      />

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Lifetime value</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {!rows ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border"><td className="px-4 py-3" colSpan={5}><Skeleton className="h-5 w-full" /></td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No customers found.</td></tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}</p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">{c.orderCount}</td>
                  <td className="px-4 py-3 text-ink">{formatCurrency(c.lifetimeValue, currency)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    {c.role === 'admin' ? <Badge tone="info">Admin</Badge> : <Badge tone="neutral">Customer</Badge>}
                    <button
                      onClick={() => setRole(c.id, c.role === 'admin' ? 'customer' : 'admin')}
                      className="ml-3 text-xs text-primary hover:underline"
                    >
                      Make {c.role === 'admin' ? 'customer' : 'admin'}
                    </button>
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
