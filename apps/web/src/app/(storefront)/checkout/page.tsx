'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { api, ApiError } from '@/lib/api';
import { AddressForm } from '@/components/checkout/AddressForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { MockPaymentForm } from '@/components/checkout/MockPaymentForm';
import { estimateTotals, type ShippingAddress } from '@/components/checkout/types';

interface CreatedOrder {
  id: string;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { status, user } = useAuth();
  const { items, subtotal, refresh } = useCart();
  const { settings } = useStore();
  const { notify } = useToast();
  const currency = settings?.currency ?? 'INR';

  const [address, setAddress] = useState<ShippingAddress>({ fullName: '', line1: '', city: '', country: 'India' });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [busy, setBusy] = useState(false);

  // Prefill name + default address for signed-in customers.
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (user) setAddress((a) => ({ ...a, fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') }));
    api
      .get<{ addresses: Array<{ line1: string; line2?: string; city: string; state?: string; postalCode?: string; country?: string; isDefault: boolean }> }>('/addresses')
      .then((r) => {
        const def = r.addresses.find((x) => x.isDefault) ?? r.addresses[0];
        if (def)
          setAddress((a) => ({
            ...a,
            line1: def.line1,
            line2: def.line2,
            city: def.city,
            state: def.state,
            postalCode: def.postalCode,
            country: def.country ?? 'India',
          }));
      })
      .catch(() => undefined);
  }, [status, user]);

  if (status === 'loading') return <div className="container-px py-20 text-muted">Loading…</div>;

  if (status === 'anonymous') {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Sign in to check out</h1>
        <p className="mt-2 text-muted">Your cart is saved — sign in and we’ll bring it with you.</p>
        <Link href="/auth/login?redirect=/checkout" className="btn-primary mt-6 inline-flex px-6 py-3">
          Sign in to continue
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !order) {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Nothing to check out</h1>
        <Link href="/shop" className="btn-primary mt-6 inline-flex px-6 py-3">Browse products</Link>
      </div>
    );
  }

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post<{ discount: number }>('/coupons/validate', { code: couponCode, subtotal });
      setDiscount(res.discount);
      notify(`Coupon applied — you saved ${res.discount}`, 'success');
    } catch (err) {
      setDiscount(0);
      notify(err instanceof ApiError ? err.message : 'That coupon is not valid', 'error');
    }
  };

  const placeOrder = async () => {
    setBusy(true);
    try {
      const res = await api.post<{ order: CreatedOrder }>('/orders', {
        shippingAddress: address,
        couponCode: couponCode || undefined,
      });
      setOrder(res.order);
      setStep('payment');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not place the order', 'error');
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/payments/mock-checkout', {
        orderId: order.id,
      });
      if (res.success) {
        notify('Payment approved — order confirmed!', 'success');
        await refresh();
        router.push(`/orders/${order.id}?success=1`);
      } else {
        notify(res.message, 'error');
      }
    } catch (err) {
      // 402 (declined) lands here too; let the customer retry.
      notify(err instanceof ApiError ? err.message : 'Payment failed — please try again', 'error');
    } finally {
      setBusy(false);
    }
  };

  const preview = estimateTotals(subtotal, discount);
  const summary = order
    ? {
        subtotal: order.subtotal,
        discount: order.discountAmount,
        shippingFee: order.shippingFee,
        taxAmount: order.taxAmount,
        total: order.total,
      }
    : { subtotal, discount, shippingFee: preview.shippingFee, taxAmount: preview.taxAmount, total: preview.total };

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-bold text-ink">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">Shipping address</h2>
            <fieldset disabled={step === 'payment'} className="disabled:opacity-60">
              <AddressForm value={address} onChange={setAddress} />
            </fieldset>
          </section>

          {step === 'payment' && order ? (
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-ink">Payment — order {order.orderNumber}</h2>
              <MockPaymentForm amount={order.total} currency={currency} processing={busy} onPay={pay} />
            </section>
          ) : (
            <section className="card p-6">
              <h2 className="mb-2 text-lg font-semibold text-ink">Coupon</h2>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Try WELCOME10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button onClick={applyCoupon} className="btn-secondary whitespace-nowrap">Apply</button>
              </div>
            </section>
          )}
        </div>

        <aside className="card h-fit p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">Order summary</h2>
          <OrderSummary {...summary} currency={currency} />
          {step === 'details' && (
            <button onClick={placeOrder} disabled={busy || !address.fullName || !address.line1 || !address.city} className="btn-primary mt-6 w-full py-3">
              {busy ? 'Placing order…' : 'Place order'}
            </button>
          )}
          <p className="mt-3 text-xs text-muted">
            Totals are finalized by the server when you place the order — what you pay is computed server-side.
          </p>
        </aside>
      </div>
    </div>
  );
}
