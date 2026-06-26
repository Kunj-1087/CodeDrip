'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { formatCurrency, formatDate, titleizeStatus } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { RevenueChart, type RevenuePoint } from '@/components/admin/RevenueChart';
import { DoughnutChart, type Slice } from '@/components/admin/DoughnutChart';

interface Kpis {
  revenueMtd: number;
  ordersToday: number;
  totalCustomers: number;
  lowStock: number;
}
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

// Chart slice colors are canvas-drawn (not CSS), so they're literal hex — kept in
// step with the warm design tokens: amber/info-blue/violet/success/danger.
const STATUS_COLORS: Record<string, string> = {
  pending: '#f4a942',
  processing: '#0066cc',
  shipped: '#6366f1',
  delivered: '#3d9970',
  cancelled: '#e5534b',
};

export default function AdminDashboard() {
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [series, setSeries] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statusSlices, setStatusSlices] = useState<Slice[]>([]);
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  useEffect(() => {
    api.get<Kpis>('/admin/analytics/kpis').then(setKpis).catch(() => undefined);
    api.get<{ series: RevenuePoint[] }>('/admin/analytics/revenue-series?days=30').then((r) => setSeries(r.series)).catch(() => undefined);
    api.get<{ products: TopProduct[] }>('/admin/analytics/top-products').then((r) => setTopProducts(r.products)).catch(() => undefined);
    api.get<{ orders: RecentOrder[] }>('/admin/analytics/recent-orders').then((r) => setRecent(r.orders)).catch(() => undefined);
    api
      .get<{ breakdown: Array<{ status: string; count: number }> }>('/admin/analytics/status-breakdown')
      .then((r) => setStatusSlices(r.breakdown.map((b) => ({ label: b.status, value: b.count, color: STATUS_COLORS[b.status] ?? '#94a3b8' }))))
      .catch(() => undefined);
  }, []);

  const cards = [
    { label: 'Revenue (this month)', value: kpis ? formatCurrency(kpis.revenueMtd, currency) : null },
    { label: 'Orders today', value: kpis ? String(kpis.ordersToday) : null },
    { label: 'Customers', value: kpis ? String(kpis.totalCustomers) : null },
    { label: 'Low-stock items', value: kpis ? String(kpis.lowStock) : null, alert: (kpis?.lowStock ?? 0) > 0 },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5 transition-shadow duration-200 hover:shadow-sm">
            <p className="eyebrow">{c.label}</p>
            {c.value === null ? (
              <Skeleton className="mt-2 h-9 w-28" />
            ) : (
              <p className={`mt-1.5 text-3xl font-bold tracking-tight tabular-nums ${c.alert ? 'text-danger' : 'text-ink'}`}>
                {c.value}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ink">Revenue — last 30 days</h2>
          <RevenueChart data={series} currency={currency} />
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">Orders by status</h2>
          <DoughnutChart data={statusSlices} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">Top products this month</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted">No paid orders yet this month.</p>
          ) : (
            <ul className="divide-y divide-border">
              {topProducts.map((p) => (
                <li key={p.productId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink">{p.name}</span>
                  <span className="text-muted">{p.units} sold · {formatCurrency(p.revenue, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <Link href={`/admin/orders?search=${o.orderNumber}`} className="font-medium text-ink hover:text-primary">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-muted">{o.email} · {formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(o.paymentStatus)}>{titleizeStatus(o.paymentStatus)}</Badge>
                    <span className="font-medium text-ink">{formatCurrency(o.total, currency)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
