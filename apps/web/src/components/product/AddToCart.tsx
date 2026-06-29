'use client';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

// Quantity stepper + add-to-cart button. Used on the product detail panel.
export function AddToCart({
  productId,
  variantId,
  inStock,
  maxQuantity,
  compact,
  imageUrl,
}: {
  productId: string;
  variantId: string | null;
  inStock: boolean;
  maxQuantity: number;
  /** Render a compact inline version (used in the sticky mobile bar vs full page). */
  compact?: boolean;
  imageUrl: string | null;
}) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  // maxQuantity === 0 means the item is out of stock. The stepper buttons are
  // disabled to prevent the user from setting a quantity that can't be ordered.
  const capped = maxQuantity > 0 ? maxQuantity : 0;

  const onAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setBusy(true);
    // Trigger floating flying arc ghost element
    window.dispatchEvent(
      new CustomEvent('add-to-cart-animate', {
        detail: { startX: e.clientX, startY: e.clientY, imageUrl },
      })
    );
    try {
      await addItem(productId, qty, variantId);
      notify(`Added ${qty} to your cart`, 'success');
    } catch {
      notify('Could not add to cart. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-border bg-surface-2 overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={!inStock}
            className="grid h-11 w-11 place-items-center text-lg disabled:opacity-40 hover:bg-surface-3 active:scale-90 transition-all text-ink font-bold"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="flex h-11 w-8 items-center justify-center text-sm font-bold font-mono text-ink tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(capped, q + 1))}
            disabled={!inStock || qty >= capped}
            className="grid h-11 w-11 place-items-center text-lg disabled:opacity-40 hover:bg-surface-3 active:scale-90 transition-all text-ink font-bold"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button 
          onClick={onAdd} 
          disabled={busy || !inStock} 
          className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white flex-1 h-11 text-xs font-mono rounded-xl hover:shadow-md hover:shadow-primary/25 lg:hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center"
        >
          {!inStock ? '404: OOS' : busy ? 'git adding...' : 'git add <shirt>'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center rounded-xl border border-border bg-surface-2 overflow-hidden">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={!inStock}
          className="grid h-11 w-11 place-items-center text-lg disabled:opacity-40 hover:bg-surface-3 active:scale-90 transition-all text-ink font-bold"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="flex h-11 w-12 items-center justify-center text-sm font-bold font-mono text-ink tabular-nums" aria-live="polite">
          {qty}
        </span>
        <button
          onClick={() => setQty((q) => Math.min(capped, q + 1))}
          disabled={!inStock || qty >= capped}
          className="grid h-11 w-11 place-items-center text-lg disabled:opacity-40 hover:bg-surface-3 active:scale-90 transition-all text-ink font-bold"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button 
        onClick={onAdd} 
        disabled={busy || !inStock} 
        className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white flex-1 px-6 py-3.5 text-sm font-mono rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
      >
        {!inStock ? '404: Inventory Not Found' : busy ? 'git adding...' : 'git add <shirt>'}
      </button>
    </div>
  );
}
