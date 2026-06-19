'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/format';
import { Badge } from './Badge';
import { StarRating } from './StarRating';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const { settings } = useStore();
  const [adding, setAdding] = useState(false);
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

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
      : 0;

  return (
    <div className="card group flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-card-hover">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-square overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl || '/uploads/placeholder.png'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3">
            <Badge tone="danger">-{discount}%</Badge>
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3">
            <Badge tone="neutral">Out of stock</Badge>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.categoryName && <p className="text-xs font-medium uppercase tracking-wide text-muted">{product.categoryName}</p>}
        <Link href={`/shop/${product.slug}`} className="mt-1 line-clamp-2 font-semibold text-ink hover:text-primary">
          {product.name}
        </Link>
        {product.reviewCount > 0 && (
          <div className="mt-1">
            <StarRating value={product.avgRating} count={product.reviewCount} />
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">{formatCurrency(product.basePrice, currency)}</span>
          {discount > 0 && (
            <span className="text-sm text-muted line-through">{formatCurrency(product.compareAtPrice!, currency)}</span>
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
