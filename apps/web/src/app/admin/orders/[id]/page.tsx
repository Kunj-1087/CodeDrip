'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDateTime, titleizeStatus } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { OrderDetail } from '@/types';

interface TimelineEvent {
  id: string;
  status: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

const FULFILLMENT = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { settings } = useStore();
  const { notify } = useToast();
  const currency = settings?.currency ?? 'INR';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const loadOrder = useCallback(() => {
    api.get<{ order: OrderDetail }>(`/admin/orders/${params.id}`)
      .then((r) => setOrder(r.order))
      .catch(() => setNotFound(true));
  }, [params.id]);

  const loadTimeline = useCallback(() => {
    api.get<{ timeline: TimelineEvent[] }>(`/admin/orders/${params.id}/timeline`)
      .then((r) => setTimeline(r.timeline ?? []))
      .catch(() => undefined);
  }, [params.id]);

  useEffect(() => { loadOrder(); loadTimeline(); }, [loadOrder, loadTimeline]);

  const updateFulfillment = async (status: string) => {
    try {
      await api.patch(`/admin/orders/${params.id}`, { fulfillmentStatus: status });
      setOrder((cur) => cur ? { ...cur, fulfillment_status: status } : cur);
      notify('Order status updated', 'success');
      loadTimeline();
    } catch {
      notify('Could not update order', 'error');
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setCommentBusy(true);
    try {
      await api.post(`/admin/orders/${params.id}/timeline`, { status: 'comment', note: comment.trim() });
      setComment('');
      loadTimeline();
      notify('Comment added', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not add comment', 'error');
    } finally {
      setCommentBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-ink">Order not found</h1>
        <Link href="/admin/orders" className="btn-primary mt-4 inline-flex">Back to orders</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  }

  const money = (v: string | number) => formatCurrency(Number(v), currency);
  const addr = order.shipping_address || {};

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/orders" className="text-muted hover:text-ink transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-ink">{order.order_number}</h1>
          </div>
          <p className="mt-1 text-sm text-muted ml-8">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={statusTone(order.payment_status)}>Payment: {titleizeStatus(order.payment_status)}</Badge>
          <Badge tone={statusTone(order.fulfillment_status)}>Fulfillment: {titleizeStatus(order.fulfillment_status)}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_26rem]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Fulfillment controls */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Update fulfillment status</h2>
            <div className="flex flex-wrap gap-2">
              {FULFILLMENT.map((s) => (
                <button
                  key={s}
                  onClick={() => updateFulfillment(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    order.fulfillment_status === s
                      ? 'bg-primary text-white'
                      : 'bg-surface-3 text-muted hover:text-ink'
                  }`}
                >
                  {titleizeStatus(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div className="card divide-y divide-border">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-ink">Line items</h2>
            </div>
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-4 px-4 py-3">
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

          {/* Timeline */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink">Order timeline</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted">No timeline events yet.</p>
            ) : (
              <div className="relative ml-3 border-l-2 border-border pl-6 space-y-5">
                {timeline.map((ev) => (
                  <div key={ev.id} className="relative">
                    <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-surface" />
                    <p className="text-xs font-semibold text-ink">
                      {titleizeStatus(ev.status)}
                      <span className="ml-2 font-normal text-muted">{formatDateTime(ev.createdAt)}</span>
                    </p>
                    {ev.note && <p className="mt-0.5 text-sm text-muted">{ev.note}</p>}
                    {ev.createdBy && <p className="mt-0.5 text-[10px] text-faint">by {ev.createdBy}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div className="mt-4 flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="Add a note or comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
              />
              <Button size="sm" onClick={addComment} loading={commentBusy} disabled={!comment.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Customer</h2>
            <p className="text-sm text-muted">{order.customer_email || '—'}</p>
          </div>

          {/* Shipping address */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Shipping address</h2>
            <address className="text-sm not-italic text-muted">
              {addr.fullName && <p className="text-ink">{addr.fullName}</p>}
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}</p>
              {addr.country && <p>{addr.country}</p>}
            </address>
          </div>

          {/* Payment summary */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Payment summary</h2>
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

          {/* Print invoice */}
          <Button variant="secondary" className="w-full" onClick={() => window.print()}>
            Print invoice
          </Button>
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
