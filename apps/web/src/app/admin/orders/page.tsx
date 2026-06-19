'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, API_URL } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate, titleizeStatus } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Pagination as PageMeta } from '@/types';

interface Row {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  customerEmail: string;
  createdAt: string;
}

const FULFILLMENT = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrders() {
  const { settings } = useStore();
  const { notify } = useToast();
  const currency = settings?.currency ?? 'INR';
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [filters, setFilters] = useState({ fulfillmentStatus: '', paymentStatus: '', search: '' });
  const [page, setPage] = useState(1);

  const buildQs = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.fulfillmentStatus) qs.set('fulfillmentStatus', filters.fulfillmentStatus);
    if (filters.paymentStatus) qs.set('paymentStatus', filters.paymentStatus);
    if (filters.search) qs.set('search', filters.search);
    return qs;
  }, [filters, page]);

  const load = useCallback(() => {
    setRows(null);
    api
      .get<{ orders: Row[]; pagination: PageMeta }>(`/admin/orders?${buildQs().toString()}`)
      .then((r) => {
        setRows(r.orders);
        setMeta(r.pagination);
      })
      .catch(() => setRows([]));
  }, [buildQs]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const updateFulfillment = async (id: string, fulfillmentStatus: string) => {
    try {
      await api.patch(`/admin/orders/${id}`, { fulfillmentStatus });
      setRows((cur) => cur?.map((r) => (r.id === id ? { ...r, fulfillmentStatus } : r)) ?? cur);
      notify('Order updated', 'success');
    } catch {
      notify('Could not update order', 'error');
    }
  };

  // CSV export: fetch with credentials, then download the returned blob.
  const exportCsv = async () => {
    const qs = buildQs();
    qs.delete('page');
    qs.delete('limit');
    const res = await fetch(`${API_URL}/api/admin/orders/export?${qs.toString()}`, { credentials: 'include' });
    if (!res.ok) {
      notify('Export failed', 'error');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <button onClick={exportCsv} className="btn-secondary">Export CSV</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search order # or email"
          value={filters.search}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({ ...f, search: e.target.value }));
          }}
        />
        <select className="input w-auto" value={filters.paymentStatus} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, paymentStatus: e.target.value })); }}>
          <option value="">All payments</option>
          {PAYMENT.map((s) => <option key={s} value={s}>{titleizeStatus(s)}</option>)}
        </select>
        <select className="input w-auto" value={filters.fulfillmentStatus} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, fulfillmentStatus: e.target.value })); }}>
          <option value="">All fulfillment</option>
          {FULFILLMENT.map((s) => <option key={s} value={s}>{titleizeStatus(s)}</option>)}
        </select>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Fulfillment</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {!rows ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border"><td className="px-4 py-3" colSpan={6}><Skeleton className="h-5 w-full" /></td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No orders match those filters.</td></tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-muted">{o.customerEmail}</td>
                  <td className="px-4 py-3 text-ink">{formatCurrency(o.total, currency)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(o.paymentStatus)}>{titleizeStatus(o.paymentStatus)}</Badge></td>
                  <td className="px-4 py-3">
                    <select
                      value={o.fulfillmentStatus}
                      onChange={(e) => updateFulfillment(o.id, e.target.value)}
                      className="input w-auto py-1.5 text-xs"
                    >
                      {FULFILLMENT.map((s) => <option key={s} value={s}>{titleizeStatus(s)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
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
