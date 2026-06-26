'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrderDetail } from '@/types';

export default function OrderConfirmationPage() {
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
        <h1 className="text-2xl font-bold text-ink">Order not found</h1>
        <p className="mt-2 text-muted">We could not find that order. Please check the link or contact support.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex px-6 py-3">Continue shopping</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="container-px py-10"><Skeleton className="h-96 w-full" /></div>;
  }

  const money = (v: string | number) => formatCurrency(Number(v), currency);
  const items = order.items;
  const hasItems = items.length > 0;

  return (
    <div className="container-px py-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-success/30 bg-success/10 p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-mono">🚀 Deployment Successful!</h1>
          <p className="mt-2 text-muted font-mono">
            Order <span className="font-semibold text-ink">{order.order_number}</span> has been pushed to production.
          </p>
          <p className="mt-1 text-sm text-muted font-mono">
            Deployed on {formatDateTime(order.created_at)}
          </p>
        </div>

        {/* Shipping info */}
        {hasItems && (
          <div className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink font-mono">
              <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Shipping / Delivery Pipeline
            </h2>
            <p className="mt-2 text-sm text-muted leading-relaxed font-mono">
              Your threads will ship within 2–3 business days. You will receive a tracking link once the deployment is en route.
            </p>
            <div className="mt-2 text-sm text-muted font-mono">
              <p className="font-medium text-ink">Shipping to:</p>
              <p>{order.shipping_address.fullName}</p>
              <p>{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>
                {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/shipping-policy" className="text-xs text-primary hover:underline">
                Shipping Policy
              </Link>
            </div>
          </div>
        )}

        {/* Order items */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-ink mb-3 font-mono">Deployment Manifest</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <Link href={`/shop/${item.snapshot.slug}`} className="font-medium text-ink hover:text-primary transition-colors">
                    {item.snapshot.name}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    Qty {item.quantity}
                    {item.snapshot.variant ? ` · ${item.snapshot.variant}` : ''}

                  </p>
                </div>
                <span className="font-semibold text-ink whitespace-nowrap">{money(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink mb-3 font-mono">Cost Summary</h2>
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

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link href="/shop" className="btn-primary flex-1 py-3 text-center rounded-lg font-mono">
            ls ./shop
          </Link>
          <Link href={`/orders/${order.id}`} className="btn-secondary flex-1 py-3 text-center rounded-lg font-mono">
            View deployment logs
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted text-center font-mono">
          Questions about your deployment? <Link href="/contact" className="text-primary hover:underline">File an issue</Link>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted font-mono">{label}</span>
      <span className="text-ink font-mono">{value}</span>
    </div>
  );
}
