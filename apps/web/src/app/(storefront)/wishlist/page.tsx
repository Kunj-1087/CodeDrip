'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';

interface WishItem {
  productId: string;
  name: string;
  slug: string;
  basePrice: number;
  inStock: boolean;
  imageUrl: string | null;
}

export default function WishlistPage() {
  const { status } = useAuth();
  const { addItem } = useCart();
  const { settings } = useStore();
  const { notify } = useToast();
  const currency = settings?.currency ?? 'INR';
  const [items, setItems] = useState<WishItem[] | null>(null);

  const load = () => api.get<{ items: WishItem[] }>('/wishlist').then((r) => setItems(r.items)).catch(() => setItems([]));

  useEffect(() => {
    if (status === 'authenticated') void load();
  }, [status]);

  const remove = async (productId: string) => {
    await api.del(`/wishlist/${productId}`).catch(() => undefined);
    void load();
  };

  if (status === 'anonymous') {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Sign in to see your wishlist</h1>
        <Link href="/auth/login?redirect=/wishlist" className="btn-primary mt-6 inline-flex px-6 py-3">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-bold text-ink">Your wishlist</h1>
      {!items ? (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-lg font-semibold text-ink">Nothing saved yet</p>
          <p className="mt-2 text-muted">Tap “Save for later” on any product to keep an eye on it.</p>
          <Link href="/shop" className="btn-primary mt-4 inline-flex">Browse products</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((it) => (
            <div key={it.productId} className="card flex items-center gap-4 p-4">
              <Link href={`/shop/${it.slug}`} className="h-16 w-16 overflow-hidden rounded-lg bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.imageUrl || '/uploads/placeholder.png'} alt={it.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex-1">
                <Link href={`/shop/${it.slug}`} className="font-medium text-ink hover:text-primary">{it.name}</Link>
                <p className="text-sm text-muted">{formatCurrency(it.basePrice, currency)}</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await addItem(it.productId, 1);
                    notify('Added to cart', 'success');
                  } catch {
                    notify('Could not add to cart', 'error');
                  }
                }}
                disabled={!it.inStock}
                className="btn-primary"
              >
                {it.inStock ? 'Add to cart' : 'Out of stock'}
              </button>
              <button onClick={() => remove(it.productId)} className="btn-ghost text-sm text-red-600">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
