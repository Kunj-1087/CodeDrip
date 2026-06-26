'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { AddressForm } from '@/components/checkout/AddressForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { MockPaymentForm } from '@/components/checkout/MockPaymentForm';
import { estimateTotals, type ShippingAddress } from '@/components/checkout/types';
import { formatCurrency } from '@/lib/format';

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
  const [email, setEmail] = useState(user?.email ?? '');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const requiresShipping = items.length > 0;
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'Standard' | 'Express' | 'Next-Day'>('Standard');

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
        <h1 className="text-2xl font-bold text-ink font-mono">Authentication Required</h1>
        <p className="mt-2 text-muted font-mono">You must be authenticated to push to production. Your staging is saved.</p>
        <Link href="/auth/login?redirect=/checkout" className="btn-primary mt-6 inline-flex px-6 py-3 font-mono">
          Authenticate
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !order) {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink font-mono">Nothing to deploy</h1>
        <p className="mt-2 text-muted font-mono">Your staging is empty. Add some threads before pushing to production.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex px-6 py-3 font-mono">ls ./shop</Link>
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
    if (!email) {
      notify('Please enter your email address', 'error');
      return;
    }
    if (!acceptedTerms) {
      notify('Please agree to the terms to continue', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ order: CreatedOrder }>('/orders', {
        shippingAddress: address,
        couponCode: couponCode || undefined,
        shippingMethod,
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
        router.push(`/order-confirmation/${order.id}`);
      } else {
        notify(res.message, 'error');
      }
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Payment failed — please try again', 'error');
    } finally {
      setBusy(false);
    }
  };

  const shippingFee = useMemo(() => {
    if (shippingMethod === 'Express') return 250;
    if (shippingMethod === 'Next-Day') return 500;
    return subtotal >= 5000 ? 0 : 199;
  }, [shippingMethod, subtotal]);

  const summary = useMemo(() => {
    if (order) {
      return {
        subtotal: order.subtotal,
        discount: order.discountAmount,
        shippingFee: order.shippingFee,
        taxAmount: order.taxAmount,
        total: order.total,
      };
    }
    const taxable = Math.max(subtotal - discount, 0);
    const taxAmount = Math.round(taxable * 0.18);
    const total = taxable + shippingFee + taxAmount;
    return {
      subtotal,
      discount,
      shippingFee,
      taxAmount,
      total,
    };
  }, [order, subtotal, discount, shippingFee]);

  return (
    <div className="container-px py-10 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-sans font-bold tracking-tight text-white">Push to Production</h1>
        <p className="mt-1 text-xs text-muted font-mono">// deploying staging commit logs...</p>
        
        {/* Step Indicator */}
        <div className="mt-8 flex items-center gap-2">
          {['config', 'deploy', 'verification'].map((label, i) => {
            const idx = step === 'details' ? 0 : step === 'payment' && order ? 2 : 1;
            const active = i <= idx;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-mono font-bold transition-all',
                  active ? 'bg-primary text-white shadow-[0_0_10px_rgba(108,99,255,0.3)]' : 'bg-[#1e1e24] text-muted border border-white/5',
                )}>
                  {active && i < idx ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={cn('text-xs font-mono font-semibold hidden sm:inline uppercase tracking-wider', active ? 'text-white' : 'text-muted')}>{label}</span>
                {i < 2 && <div className={cn('flex-1 h-[2px] rounded', active ? 'bg-gradient-to-r from-primary to-accent' : 'bg-[#1e1e24]')} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          {/* Mobile Collapsible Order Summary Accordion */}
          <div className="lg:hidden card glass-panel border-border bg-surface-2 rounded-2xl overflow-hidden">
            <button
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="w-full flex items-center justify-between p-5 font-mono text-xs text-ink hover:bg-surface-3 transition-all select-none cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <svg
                  className={cn("h-4 w-4 text-primary transition-transform duration-200", summaryExpanded ? "rotate-180" : "")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span>{summaryExpanded ? "HIDE MANIFEST" : "SHOW MANIFEST"}</span>
              </div>
              <span className="font-bold text-accent">{formatCurrency(summary.total, currency)}</span>
            </button>
            {summaryExpanded && (
              <div className="px-5 pb-5 pt-1 border-t border-border animate-fade-in">
                <OrderSummary {...summary} currency={currency} />
              </div>
            )}
          </div>

          {/* Email section */}
          <section className="card glass-panel border-border bg-surface-2 p-6 rounded-2xl">
            <h2 className="mb-4 text-xs font-mono uppercase tracking-widest text-accent">// 01_maintainer_details</h2>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted uppercase tracking-wider">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@email.com"
                aria-label="Email address"
                autoComplete="email"
                className="w-full h-[52px] rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/10 font-mono transition-all"
                required
              />
            </div>
          </section>

          {/* Shipping address */}
          <section className="card glass-panel border-border bg-surface-2 p-6 rounded-2xl">
            <h2 className="mb-4 text-xs font-mono uppercase tracking-widest text-accent">// 02_deploy_target</h2>
            <fieldset disabled={step === 'payment'} className="disabled:opacity-60">
              <AddressForm value={address} onChange={setAddress} />
            </fieldset>
          </section>

          {/* Shipping method */}
          <section className="card glass-panel border-border bg-surface-2 p-6 rounded-2xl">
            <h2 className="mb-4 text-xs font-mono uppercase tracking-widest text-accent">// shipping_method</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: 'Standard' as const, label: 'Standard', days: '5-8 days', price: subtotal >= 5000 ? 0 : 199 },
                { key: 'Express' as const, label: 'Express', days: '2-3 days', price: 250 },
                { key: 'Next-Day' as const, label: 'Next-Day', days: '1 day', price: 500 },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setShippingMethod(m.key)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    shippingMethod === m.key
                      ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(108,99,255,0.15)]'
                      : 'border-border bg-surface hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">{m.label}</span>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      shippingMethod === m.key ? 'border-primary' : 'border-border'
                    }`}>
                      {shippingMethod === m.key && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted font-mono">{m.days}</p>
                  <p className="mt-1.5 text-sm font-bold text-ink">
                    {m.price === 0 ? 'Free' : formatCurrency(m.price, currency)}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Delivery info */}
          <div className="rounded-2xl border border-border bg-surface-2 p-5 text-xs font-mono leading-relaxed text-muted">
            <p className="font-bold text-ink mb-1">📦 physical_shipping_details.log</p>
            <p>
              These are physical cotton tees, printed and shipped directly. Delivery typically logs 5–8 business days after dispatch.
            </p>
          </div>

          {step === 'payment' && order ? (
            <section className="card glass-panel border-border bg-surface-2 p-6 rounded-2xl">
              <h2 className="mb-4 text-xs font-mono uppercase tracking-widest text-accent">// 03_payment_confirmation : order_{order.orderNumber}</h2>
              <MockPaymentForm amount={order.total} currency={currency} processing={busy} onPay={pay} />
            </section>
          ) : (
            <section className="card glass-panel border-border bg-surface-2 p-6 rounded-2xl">
              <h2 className="mb-2 text-xs font-mono uppercase tracking-widest text-accent">// 03_promo_token_key</h2>
              <div className="flex gap-2 mt-3">
                <input
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/10 font-mono transition-all uppercase"
                  placeholder="Enter secret token"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button onClick={applyCoupon} className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white px-6 font-mono text-xs rounded-xl shadow-md transition-all">
                  Verify
                </button>
              </div>
              <details className="mt-4 group">
                <summary className="cursor-pointer list-none text-[10px] text-faint hover:text-muted font-mono uppercase tracking-wider select-none">
                  [View active discount API keys]
                </summary>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    { code: 'DEVGHOST10', desc: '10% off your order' },
                    { code: 'GITPUSH50', desc: '₹50 off orders above ₹500' },
                    { code: 'NODEBUG', desc: '15% off orders above ₹999' },
                  ].map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCouponCode(c.code)}
                      className="text-left rounded-xl border border-border bg-surface p-3 text-xs text-muted hover:border-primary/50 hover:text-ink transition-all font-mono flex justify-between items-center"
                    >
                      <span className="text-primary font-bold">${c.code}</span>
                      <span className="text-faint">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </details>
            </section>
          )}
        </div>

        <aside className="card glass-panel border-border bg-surface-2 h-fit p-6 rounded-2xl sticky top-24">
          <div className="hidden lg:block">
            <h2 className="mb-4 text-xs font-mono uppercase tracking-widest text-accent">// deployment_manifest</h2>
            <OrderSummary {...summary} currency={currency} />
          </div>
          {step === 'details' && (
            <>
              <label className="mt-6 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/10 bg-black/20 text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none"
                />
                <span className="text-[10px] text-muted leading-relaxed font-mono select-none">
                  I accept terms outlined in <Link href="/terms-of-service" className="text-primary hover:underline">ToS.md</Link>, <Link href="/refund-policy" className="text-primary hover:underline">Refunds.md</Link>, and <Link href="/shipping-policy" className="text-primary hover:underline">Shipping.md</Link>.
                </span>
              </label>
              
              <button 
                onClick={placeOrder} 
                disabled={busy || !address.fullName || !address.line1 || !address.city} 
                className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full h-[60px] lg:h-12 font-mono text-xs rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-6 disabled:from-border disabled:to-border disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {busy ? 'Compiling...' : 'git push origin main'}
              </button>
            </>
          )}
          <p className="mt-4 text-[9px] text-faint font-mono leading-relaxed">
            * Totals are finalized server-side — client-side values are estimates only.
          </p>
        </aside>
      </div>
    </div>
  );
}
