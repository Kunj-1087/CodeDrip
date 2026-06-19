'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { formatCurrency, formatDate, titleizeStatus } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrderListItem } from '@/types';

export default function OrdersPage() {
  const { status } = useAuth();
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    api.get<{ orders: OrderListItem[] }>('/orders').then((r) => setOrders(r.orders)).catch(() => setOrders([]));
  }, [status]);

  if (status === 'anonymous') {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Sign in to see your orders</h1>
        <Link href="/auth/login?redirect=/orders" className="btn-primary mt-6 inline-flex px-6 py-3">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-bold text-ink">Your orders</h1>

      {!orders ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-lg font-semibold text-ink">No orders yet</p>
          <p className="mt-2 text-muted">When you place an order, it’ll show up here with live status.</p>
          <Link href="/shop" className="btn-primary mt-4 inline-flex">Start shopping</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 hover:shadow-card-hover">
              <div>
                <p className="font-semibold text-ink">{o.orderNumber}</p>
                <p className="text-sm text-muted">{formatDate(o.createdAt)} · {o.itemCount} item{o.itemCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone(o.paymentStatus)}>{titleizeStatus(o.paymentStatus)}</Badge>
                <Badge tone={statusTone(o.fulfillmentStatus)}>{titleizeStatus(o.fulfillmentStatus)}</Badge>
                <span className="font-semibold text-ink">{formatCurrency(o.total, currency)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
