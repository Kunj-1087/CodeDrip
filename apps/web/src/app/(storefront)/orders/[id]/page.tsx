'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { formatCurrency, formatDateTime, titleizeStatus } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrderDetail } from '@/types';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    setJustPaid(new URLSearchParams(window.location.search).get('success') === '1');
    api
      .get<{ order: OrderDetail }>(`/orders/${params.id}`)
      .then((r) => setOrder(r.order))
      .catch(() => setNotFound(true));
  }, [params.id]);

  if (notFound) {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">We couldn’t find that order</h1>
        <Link href="/orders" className="btn-primary mt-6 inline-flex">Back to your orders</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="container-px py-10"><Skeleton className="h-64 w-full" /></div>;
  }

  const money = (v: string | number) => formatCurrency(Number(v), currency);

  return (
    <div className="container-px py-10">
      {justPaid && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-300">
          <p className="font-semibold">Thank you — your order is confirmed.</p>
          <p className="text-sm">A confirmation has been recorded for {order.order_number}.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{order.order_number}</h1>
          <p className="text-sm text-muted">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={statusTone(order.payment_status)}>Payment: {titleizeStatus(order.payment_status)}</Badge>
          <Badge tone={statusTone(order.fulfillment_status)}>{titleizeStatus(order.fulfillment_status)}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="card divide-y divide-border p-5">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-ink">{it.snapshot.name}</p>
                <p className="text-sm text-muted">
                  Qty {it.quantity}
                  {it.snapshot.variant ? ` · ${it.snapshot.variant}` : ''} · {money(it.unitPrice)} each
                </p>
              </div>
              <span className="font-semibold text-ink">{money(it.totalPrice)}</span>
            </div>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-3 text-lg font-semibold text-ink">Payment summary</h2>
            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={money(order.subtotal)} />
              {Number(order.discount_amount) > 0 && <Row label="Discount" value={`−${money(order.discount_amount)}`} />}
              <Row label="Shipping" value={Number(order.shipping_fee) === 0 ? 'Free' : money(order.shipping_fee)} />
              <Row label="Tax" value={money(order.tax_amount)} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-ink">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-3 text-lg font-semibold text-ink">Shipping to</h2>
            <address className="text-sm not-italic text-muted">
              {order.shipping_address.fullName && <p className="text-ink">{order.shipping_address.fullName}</p>}
              <p>{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>
                {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
            </address>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
