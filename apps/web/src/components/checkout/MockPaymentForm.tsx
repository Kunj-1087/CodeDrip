'use client';
import { useState } from 'react';
import { formatCurrency } from '@/lib/format';

// ---------------------------------------------------------------------------
// MOCK PAYMENT FORM.
// This is a SIMULATED card form for UI/testing only. The card fields below are
// pre-filled with obvious dummy values and are NEVER sent anywhere — the only
// thing submitted to the server is the order id (handled by the checkout page).
// The real payment outcome is decided SERVER-SIDE (paymentService). Swap this
// component for a real gateway's SDK (Stripe Elements, Razorpay, etc.) in prod.
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
  // Dummy values — intentionally fake, never transmitted.
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [name, setName] = useState('Test Cardholder');
  const [expiry, setExpiry] = useState('12/29');
  const [cvc, setCvc] = useState('123');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onPay();
      }}
      className="space-y-4"
    >
      <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
        <strong>Mock checkout.</strong> No real card is charged. The server validates the order and simulates the
        gateway (≈95% approve). Card details below are dummy and are not sent anywhere.
      </div>

      <div>
        <label className="label" htmlFor="card">Card number</label>
        <input id="card" className="input font-mono" value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" />
      </div>
      <div>
        <label className="label" htmlFor="cardname">Name on card</label>
        <input id="cardname" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="expiry">Expiry</label>
          <input id="expiry" className="input font-mono" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cvc">CVC</label>
          <input id="cvc" className="input font-mono" value={cvc} onChange={(e) => setCvc(e.target.value)} />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full py-3 text-base" disabled={processing}>
        {processing ? 'Processing…' : `Pay ${formatCurrency(amount, currency)}`}
      </button>
    </form>
  );
}
