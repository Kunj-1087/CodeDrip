'use client';
import { useState } from 'react';
import type { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { topSpecs } from '@/lib/specs';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { VariantSelector } from './VariantSelector';
import { AddToCart } from './AddToCart';

// Owns the selected variant + computed price/stock, and wires the wishlist
// button. Rendered as a client island beside the server-rendered product copy.
export function ProductPurchasePanel({ product }: { product: Product }) {
  const { settings } = useStore();
  const { notify } = useToast();
  const { status } = useAuth();
  const currency = settings?.currency ?? 'INR';

  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(null);
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;

  const price = product.basePrice + (selectedVariant?.priceModifier ?? 0);
  const stock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const inStock = stock > 0;

  const addToWishlist = async () => {
    if (status !== 'authenticated') {
      notify('Sign in to save items to your wishlist', 'info');
      return;
    }
    try {
      await api.post(`/wishlist/${product.id}`);
      notify('Saved to your wishlist', 'success');
    } catch {
      notify('Could not update wishlist', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {product.categoryName && (
        <p className="text-sm font-medium uppercase tracking-wide text-muted">{product.categoryName}</p>
      )}
      <h1 className="text-3xl font-bold text-ink">{product.name}</h1>

      <div className="flex items-center gap-4">
        {product.reviewCount > 0 ? (
          <StarRating value={product.avgRating} count={product.reviewCount} />
        ) : (
          <span className="text-sm text-muted">No reviews yet</span>
        )}
        {product.brand && <span className="text-sm text-muted">by {product.brand}</span>}
      </div>

      {/* Key specs as monospace pills, mirroring the spec sheet. */}
      {topSpecs(product, 4).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topSpecs(product, 4).map((s) => (
            <span key={s} className="spec-pill">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-ink">{formatCurrency(price, currency)}</span>
        {product.compareAtPrice && product.compareAtPrice > price && (
          <span className="text-lg text-muted line-through">{formatCurrency(product.compareAtPrice, currency)}</span>
        )}
        {inStock ? (
          <Badge tone={stock <= 5 ? 'warning' : 'success'}>{stock <= 5 ? `Only ${stock} left` : 'In stock'}</Badge>
        ) : (
          <Badge tone="danger">Out of stock</Badge>
        )}
      </div>

      {product.shortDescription && <p className="text-muted">{product.shortDescription}</p>}

      <VariantSelector variants={variants} selectedId={variantId} onSelect={setVariantId} />

      <AddToCart productId={product.id} variantId={variantId} inStock={inStock} maxQuantity={stock} />

      <button onClick={addToWishlist} className="btn-ghost px-0 text-sm text-primary">
        ♥ Save for later
      </button>
    </div>
  );
}
