'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/format';

export function BundleCardClient({ bundle }: { bundle: Product }) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const { settings } = useStore();
  const [adding, setAdding] = useState(false);
  const currency = settings?.currency ?? 'INR';

  const onAdd = async () => {
    setAdding(true);
    try {
      await addItem(bundle.id, 1);
      notify(`Added ${bundle.name} to your cart`, 'success');
    } catch {
      notify('Could not add to cart. Please try again.', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <span className="text-xl font-bold text-primary">{formatCurrency(bundle.basePrice, currency)}</span>
      {bundle.compareAtPrice && bundle.compareAtPrice > bundle.basePrice && (
        <span className="text-sm text-faint line-through">{formatCurrency(bundle.compareAtPrice, currency)}</span>
      )}
      <button onClick={onAdd} disabled={adding} className="btn-primary ml-auto px-5 py-2.5 text-sm">
        {adding ? 'Adding…' : 'Add bundle to cart'}
      </button>
    </>
  );
}
