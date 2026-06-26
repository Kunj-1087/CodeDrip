'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { formatCurrency, formatDate, titleizeStatus } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { RevenueChart, type RevenuePoint } from '@/components/admin/RevenueChart';
import { DoughnutChart, type Slice } from '@/components/admin/DoughnutChart';

interface TopProduct {
  productId: string;
  name: string;
  units: number;
  revenue: number;
}
interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  email: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f4a942',
  processing: '#0066cc',
  shipped: '#6366f1',
  delivered: '#3d9970',
  cancelled: '#e5534b',
};

export default function AdminAnalyticsPage() {
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';
  const [series, setSeries] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statusSlices, setStatusSlices] = useState<Slice[]>([]);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    api.get<{ series: RevenuePoint[] }>(`/admin/analytics/revenue-series?days=${days}`).then((r) => setSeries(r.series)).catch(() => undefined);
    api.get<{ products: TopProduct[] }>('/admin/analytics/top-products').then((r) => setTopProducts(r.products)).catch(() => undefined);
    api.get<{ orders: RecentOrder[] }>('/admin/analytics/recent-orders').then((r) => setRecent(r.orders)).catch(() => undefined);
    api
      .get<{ breakdown: Array<{ status: string; count: number }> }>('/admin/analytics/status-breakdown')
      .then((r) => setStatusSlices(r.breakdown.map((b) => ({ label: b.status, value: b.count, color: STATUS_COLORS[b.status] ?? '#94a3b8' }))))
      .catch(() => undefined);
  }, [days]);

  const totalRevenue = series.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = series.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Analytics</h1>
          <p className="mt-1 text-sm text-muted">Revenue trends, top products, and acquisition insights.</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                days === d ? 'bg-primary text-white' : 'bg-surface-3 text-muted hover:text-ink'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="eyebrow">Revenue ({days}d)</p>
          <p className="mt-1.5 text-2xl font-bold text-ink">{formatCurrency(totalRevenue, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="eyebrow">Orders ({days}d)</p>
          <p className="mt-1.5 text-2xl font-bold text-ink">{totalOrders}</p>
        </div>
        <div className="card p-5">
          <p className="eyebrow">Avg. order value</p>
          <p className="mt-1.5 text-2xl font-bold text-ink">
            {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders, currency) : '—'}
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="mt-6 card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">Revenue trend</h2>
        <RevenueChart data={series} currency={currency} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">Orders by status</h2>
          <DoughnutChart data={statusSlices} />
        </div>

        {/* Top products */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">Top products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted">No paid orders yet this month.</p>
          ) : (
            <ul className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-[10px] font-bold text-muted">
                      {i + 1}
                    </span>
                    <span className="text-ink">{p.name}</span>
                  </div>
                  <span className="text-muted">{p.units} sold · {formatCurrency(p.revenue, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-6 card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">Recent orders</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Payment</th>
                  <th className="pb-2 font-medium">Fulfillment</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium text-ink">{o.orderNumber}</td>
                    <td className="py-2.5 text-muted">{o.email}</td>
                    <td className="py-2.5 text-ink">{formatCurrency(o.total, currency)}</td>
                    <td className="py-2.5"><Badge tone={statusTone(o.paymentStatus)} size="sm">{titleizeStatus(o.paymentStatus)}</Badge></td>
                    <td className="py-2.5"><Badge tone={statusTone(o.fulfillmentStatus)} size="sm">{titleizeStatus(o.fulfillmentStatus)}</Badge></td>
                    <td className="py-2.5 text-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
