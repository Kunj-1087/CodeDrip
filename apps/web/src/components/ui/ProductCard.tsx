'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { topSpecs } from '@/lib/specs';
import { Badge } from './Badge';
import { StarRating } from './StarRating';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const { settings } = useStore();
  const { status } = useAuth();
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const currency = settings?.currency ?? 'INR';

  const onAdd = async () => {
    setAdding(true);
    try {
      await addItem(product.id, 1);
      notify(`Added ${product.name} to your cart`, 'success');
    } catch {
      notify('Could not add to cart. Please try again.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const onSave = async () => {
    if (status !== 'authenticated') {
      notify('Sign in to save items to your wishlist', 'info');
      return;
    }
    try {
      await api.post(`/wishlist/${product.id}`);
      setSaved(true);
      notify('Saved to your wishlist', 'success');
    } catch {
      notify('Could not update wishlist', 'error');
    }
  };

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
      : 0;
  const specs = topSpecs(product);
  const lowStock = product.inStock && product.stockQuantity <= 5;

  return (
    <div className="card group flex flex-col overflow-hidden transition-[box-shadow,border-color] duration-200 hover:border-primary/40 hover:shadow-card-hover">
      <div className="relative">
        <Link href={`/shop/${product.slug}`} className="block aspect-square overflow-hidden bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl || '/uploads/placeholder.png'}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Stock badge, top-left */}
        <span className="absolute left-3 top-3">
          {!product.inStock ? (
            <Badge tone="danger">Out of stock</Badge>
          ) : lowStock ? (
            <Badge tone="warning">Low stock</Badge>
          ) : (
            <Badge tone="success">In stock</Badge>
          )}
        </span>

        {/* Wishlist heart, top-right */}
        <button
          onClick={onSave}
          aria-label={`Save ${product.name} to wishlist`}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/80 text-muted backdrop-blur transition-colors hover:text-red-500"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && <p className="eyebrow">{product.brand}</p>}
        <Link
          href={`/shop/${product.slug}`}
          className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink hover:text-primary"
        >
          {product.name}
        </Link>

        {/* Mono spec pills */}
        {specs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {specs.map((s) => (
              <span key={s} className="spec-pill">{s}</span>
            ))}
          </div>
        )}

        {product.reviewCount > 0 && (
          <div className="mt-2">
            <StarRating value={product.avgRating} count={product.reviewCount} />
          </div>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">{formatCurrency(product.basePrice, currency)}</span>
          {discount > 0 && (
            <>
              <span className="text-sm text-muted line-through">{formatCurrency(product.compareAtPrice!, currency)}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">-{discount}%</span>
            </>
          )}
        </div>

        <button
          onClick={onAdd}
          disabled={adding || !product.inStock}
          className="btn-primary mt-4 w-full"
          aria-label={`Add ${product.name} to cart`}
        >
          {adding ? 'Adding…' : product.inStock ? 'Add to cart' : 'Notify me'}
        </button>
      </div>
    </div>
  );
}
