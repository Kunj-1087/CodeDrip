'use client';
import Link from 'next/link';
import type { CartLine } from '@/types';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/format';
import { ProductImage } from '@/components/ui/ProductImage';

export function CartItem({ line }: { line: CartLine }) {
  const { updateQuantity, removeItem } = useCart();
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';

  return (
    <div className="flex gap-4 py-4">
      <Link href={`/shop/${line.slug}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface-2">
        <ProductImage src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" sizes="90px" />
      </Link>

      <div className="flex flex-1 flex-col">
        <Link href={`/shop/${line.slug}`} className="font-medium text-ink hover:text-primary">
          {line.name}
        </Link>
        <span className="text-sm text-muted">{formatCurrency(line.unitPrice, currency)} each</span>

        <div className="mt-auto flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-white/5 bg-black/20 overflow-hidden">
            <button
              onClick={() => updateQuantity(line.id, line.quantity - 1)}
              className="grid h-11 w-11 place-items-center text-lg disabled:opacity-40 hover:bg-white/5 active:scale-90 transition-all text-white font-bold"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="flex h-11 w-8 items-center justify-center text-sm font-bold font-mono text-white tabular-nums">
              {line.quantity}
            </span>
            <button
              onClick={() => updateQuantity(line.id, Math.min(line.stockQuantity, line.quantity + 1))}
              disabled={line.quantity >= line.stockQuantity}
              className="grid h-11 w-11 place-items-center text-lg disabled:opacity-40 hover:bg-white/5 active:scale-90 transition-all text-white font-bold"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            onClick={() => removeItem(line.id)}
            className="h-11 px-3 flex items-center justify-center text-xs font-mono text-danger hover:text-red-400 hover:bg-danger/5 rounded-xl border border-danger/10 transition-all active:scale-95"
          >
            git rm
          </button>
        </div>
      </div>

      <div className="text-right font-semibold text-ink">{formatCurrency(line.lineTotal, currency)}</div>
    </div>
  );
}
