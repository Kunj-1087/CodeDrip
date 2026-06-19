'use client';
import Link from 'next/link';
import type { CartLine } from '@/types';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/format';

export function CartItem({ line }: { line: CartLine }) {
  const { updateQuantity, removeItem } = useCart();
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';

  return (
    <div className="flex gap-4 py-4">
      <Link href={`/shop/${line.slug}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={line.imageUrl || '/uploads/placeholder.png'} alt={line.name} className="h-full w-full object-cover" />
      </Link>

      <div className="flex flex-1 flex-col">
        <Link href={`/shop/${line.slug}`} className="font-medium text-ink hover:text-primary">
          {line.name}
        </Link>
        <span className="text-sm text-muted">{formatCurrency(line.unitPrice, currency)} each</span>

        <div className="mt-auto flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => updateQuantity(line.id, line.quantity - 1)}
              className="px-2.5 py-1"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{line.quantity}</span>
            <button
              onClick={() => updateQuantity(line.id, Math.min(line.stockQuantity, line.quantity + 1))}
              className="px-2.5 py-1"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button onClick={() => removeItem(line.id)} className="text-sm text-red-600 hover:underline">
            Remove
          </button>
        </div>
      </div>

      <div className="text-right font-semibold text-ink">{formatCurrency(line.lineTotal, currency)}</div>
    </div>
  );
}
