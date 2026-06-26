'use client';
import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// MOCK PAYMENT FORM.
// This is a SIMULATED payment form for UI/testing only.
// Real payment outcome is decided SERVER-SIDE (paymentService).
// ---------------------------------------------------------------------------
export function MockPaymentForm({
  amount,
  currency,
  processing,
  onPay,
}: {
  amount: number;
  currency: string;
  processing: boolean;
  onPay: () => void;
}) {
  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');

  // Dummy values — intentionally fake, never transmitted.
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [name, setName] = useState('Test Cardholder');
  const [expiry, setExpiry] = useState('12/29');
  const [cvc, setCvc] = useState('123');
  const [upiId, setUpiId] = useState('developer@okaxis');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onPay();
      }}
      className="space-y-6"
    >
      <div className="rounded-xl border border-dashed border-warning/40 bg-warning/10 p-3 text-xs text-warning font-mono">
        <strong>// DEV MODE</strong> No real payment is charged. The server validates the order and simulates the
        gateway (≈95% success rate). Payment details below are mock data.
      </div>

      {/* Stacked Payment Methods */}
      <div className="space-y-3">
        <label className="text-[10px] font-mono text-muted uppercase tracking-wider block">// 03a_select_payment_protocol</label>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              id: 'card',
              name: 'Credit / Debit Card',
              desc: 'Mock Visa, MasterCard, RuPay',
              icon: (
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20M6 14h2M10 14h4" />
                </svg>
              ),
            },
            {
              id: 'upi',
              name: 'UPI / Instant Transfer',
              desc: 'Mock Google Pay, PhonePe, BHIM',
              icon: (
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
            },
            {
              id: 'cod',
              name: 'Cash on Delivery (COD)',
              desc: 'Pay cash when package lands',
              icon: (
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ),
            },
          ].map((method) => {
            const active = paymentMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as any)}
                className={cn(
                  'flex items-center gap-4 rounded-xl border p-4 text-left font-mono transition-all w-full select-none cursor-pointer',
                  active
                    ? 'border-primary bg-primary/5 text-white shadow-[0_0_15px_rgba(108,99,255,0.15)]'
                    : 'border-white/5 bg-black/20 text-muted hover:border-white/10 hover:text-white',
                )}
              >
                <div className={cn('flex items-center justify-center p-2 rounded-lg border shrink-0', active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-white/5 bg-white/[0.02]')}>
                  {method.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{method.name}</div>
                  <div className="text-[10px] text-faint truncate mt-0.5">{method.desc}</div>
                </div>
                <div className={cn(
                  'h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all',
                  active ? 'border-primary bg-primary' : 'border-white/10 bg-transparent'
                )}>
                  {active && <div className="h-2 w-2 rounded-full bg-white animate-scale-in" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Fields Based on Selection */}
      <div className="space-y-4 pt-2">
        {paymentMethod === 'card' && (
          <>
            <div>
              <label className="label font-mono" htmlFor="card">Card number (mock)</label>
              <input
                id="card"
                className="input h-[52px] font-mono"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                autoComplete="cc-number"
                inputMode="numeric"
                required
              />
            </div>
            <div>
              <label className="label font-mono" htmlFor="cardname">Cardholder</label>
              <input
                id="cardname"
                className="input h-[52px] font-mono"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="cc-name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label font-mono" htmlFor="expiry">Expiry</label>
                <input
                  id="expiry"
                  className="input h-[52px] font-mono"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div>
                <label className="label font-mono" htmlFor="cvc">CVC</label>
                <input
                  id="cvc"
                  className="input h-[52px] font-mono"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </>
        )}

        {paymentMethod === 'upi' && (
          <div>
            <label className="label font-mono" htmlFor="upiId">UPI ID (mock)</label>
            <input
              id="upiId"
              className="input h-[52px] font-mono"
              placeholder="developer@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              autoComplete="off"
              required
            />
            <p className="text-[10px] font-mono text-faint mt-1.5">// payment will trigger a mock push notification response.</p>
          </div>
        )}

        {paymentMethod === 'cod' && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs font-mono text-muted leading-relaxed">
            <p className="font-bold text-white mb-1">📋 cod_protocol_details.log</p>
            <p>
              Please prepare the exact change of <strong className="text-primary">{formatCurrency(amount, currency)}</strong>. Cash on Delivery orders require hardware verification upon delivery.
            </p>
          </div>
        )}
      </div>

      <button type="submit" className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full h-[60px] lg:h-12 flex items-center justify-center font-mono text-xs rounded-xl shadow-lg transition-all" disabled={processing}>
        {processing ? 'Processing…' : `Deploy payment of ${formatCurrency(amount, currency)}`}
      </button>
    </form>
  );
}
