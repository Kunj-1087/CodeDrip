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
}: {
  productId: string;
  variantId: string | null;
  inStock: boolean;
  maxQuantity: number;
}) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const onAdd = async () => {
    setBusy(true);
    try {
      await addItem(productId, qty, variantId);
      notify(`Added ${qty} to your cart`, 'success');
    } catch {
      notify('Could not add to cart. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-xl border border-border">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-lg" aria-label="Decrease quantity">
          −
        </button>
        <span className="w-10 text-center text-sm font-medium" aria-live="polite">
          {qty}
        </span>
        <button
          onClick={() => setQty((q) => Math.min(maxQuantity || 99, q + 1))}
          className="px-3 py-2 text-lg"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button onClick={onAdd} disabled={busy || !inStock} className="btn-primary flex-1 px-6 py-3 text-base">
        {!inStock ? 'Out of stock' : busy ? 'Adding…' : 'Add to cart'}
      </button>
    </div>
  );
}
