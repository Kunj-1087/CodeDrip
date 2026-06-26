'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useWishlist } from '@/hooks/useWishlist';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductImage } from '@/components/ui/ProductImage';

export default function WishlistPage() {
  const { addItem } = useCart();
  const { settings } = useStore();
  const { notify } = useToast();
  const currency = settings?.currency ?? 'INR';
  const { items, loading, removeItem } = useWishlist();

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-bold text-ink">Your wishlist</h1>
      {!items ? (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-lg font-semibold text-ink">Your wishlist is empty</p>
          <p className="mt-2 text-muted">Save your favorite planners, templates, and desk tools here.</p>
          <Link href="/shop" className="btn-primary mt-4 inline-flex">Browse products</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((it) => (
            <div key={it.productId} className="card flex items-center gap-4 p-4">
              <Link href={`/shop/${it.slug}`} className="h-16 w-16 overflow-hidden rounded-lg bg-surface-2">
                <ProductImage src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" sizes="64px" />
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
              <button onClick={() => removeItem(it.productId)} className="btn-ghost text-sm text-danger">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
