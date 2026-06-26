'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { formatCurrency, formatDateTime, titleizeStatus } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline';
import type { OrderDetail } from '@/types';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get<{ order: OrderDetail }>(`/orders/${params.id}`)
      .then((r) => setOrder(r.order))
      .catch(() => setNotFound(true));
  }, [params.id]);

  if (notFound) {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">We couldn't find that order</h1>
        <Link href="/orders" className="btn-primary mt-6 inline-flex">Back to your orders</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="container-px py-10"><Skeleton className="h-64 w-full" /></div>;
  }

  const money = (v: string | number) => formatCurrency(Number(v), currency);
  const items = order.items;
  const hasItems = items.length > 0;

  return (
    <div className="container-px py-10">
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
        <div className="space-y-6">
          {/* Items */}
          <div className="card divide-y divide-border p-5">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <Link href={`/shop/${it.snapshot.slug}`} className="font-medium text-ink hover:text-primary transition-colors">
                    {it.snapshot.name}
                  </Link>
                  <p className="text-sm text-muted">
                    Qty {it.quantity}
                    {it.snapshot.variant ? ` · ${it.snapshot.variant}` : ''} · {money(it.unitPrice)} each

                  </p>
                </div>
                <span className="font-semibold text-ink">{money(it.totalPrice)}</span>
              </div>
            ))}
          </div>



          {/* Shipping info */}
          {hasItems && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Shipping
              </h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Physical items will ship within 2–3 business days. You will receive a tracking link once shipped.
                Delivery typically takes 5–8 business days within India.
              </p>
              <Link href="/shipping-policy" className="mt-2 inline-block text-xs text-primary hover:underline">Shipping Policy</Link>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">Order status</h2>
            <OrderStatusTimeline
              paymentStatus={order.payment_status}
              fulfillmentStatus={order.fulfillment_status}
              placedAt={order.created_at}
            />
          </div>

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

          {hasItems && order.shipping_address?.fullName && (
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
          )}
        </aside>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface p-5 sm:p-6 text-center">
        <h2 className="text-lg font-semibold text-ink">Need help with this order?</h2>
        <p className="mt-1 text-sm text-muted">
          If you have questions about delivery or anything else, we are here to help.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href={`/contact?order=${order.order_number}`}
            className="btn-secondary px-5 py-2.5 text-sm rounded-lg"
          >
            Contact support
          </Link>
          <Link
            href={`/order-confirmation/${order.id}`}
            className="btn-secondary px-5 py-2.5 text-sm rounded-lg"
          >
            View confirmation
          </Link>
          {order.payment_status === 'paid' && (
            <Link
              href={`/refund-policy?order=${order.order_number}`}
              className="text-sm text-muted hover:text-ink underline underline-offset-2"
            >
              Refund policy
            </Link>
          )}
        </div>
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
