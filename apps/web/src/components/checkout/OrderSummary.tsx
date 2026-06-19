'use client';
import { formatCurrency } from '@/lib/format';

interface Line {
  label: string;
  value: number;
  muted?: boolean;
  negative?: boolean;
}

export function OrderSummary({
  subtotal,
  discount,
  shippingFee,
  taxAmount,
  total,
  currency,
}: {
  subtotal: number;
  discount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  currency: string;
}) {
  const lines: Line[] = [
    { label: 'Subtotal', value: subtotal },
    ...(discount > 0 ? [{ label: 'Discount', value: discount, negative: true } as Line] : []),
    { label: shippingFee === 0 ? 'Shipping (free)' : 'Shipping', value: shippingFee, muted: true },
    { label: 'Tax (18% GST)', value: taxAmount, muted: true },
  ];

  return (
    <div className="space-y-2 text-sm">
      {lines.map((l) => (
        <div key={l.label} className="flex justify-between">
          <span className="text-muted">{l.label}</span>
          <span className={l.negative ? 'font-medium text-green-600' : 'text-ink'}>
            {l.negative ? '−' : ''}
            {formatCurrency(l.value, currency)}
          </span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold text-ink">
        <span>Total</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
    </div>
  );
}
