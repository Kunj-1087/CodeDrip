'use client';
import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/format';
import { StockBadge } from '@/components/ui/StockBadge';
import { AddToCart } from './AddToCart';

/**
 * Sticky bottom bar for mobile product detail — shows price, stock status,
 * quantity stepper, and add-to-cart button fixed at the bottom of the viewport.
 * Only visible on small screens (<md breakpoint).
 * Rendered as a client island alongside the server-rendered product page.
 */
export function StickyBottomBar({ product }: { product: Product }) {
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';

  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    const handleVariantChange = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      setVariantId(customEvent.detail);
    };
    window.addEventListener('codedrip-variant-change', handleVariantChange);
    return () => {
      window.removeEventListener('codedrip-variant-change', handleVariantChange);
    };
  }, []);

  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;

  const price = product.basePrice + (selectedVariant?.priceModifier ?? 0);
  const stock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const inStock = stock > 0;

  return (
    <div className="fixed bottom-[56px] left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden animate-[nav-slide-up_300ms_ease-out] bottom-bar-shadow gpu-layer">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-shrink-0">
          <span className="block text-base font-bold text-ink">
            {formatCurrency(price, currency)}
          </span>
          <StockBadge stock={stock} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <AddToCart
            productId={product.id}
            variantId={selectedVariant?.id ?? null}
            inStock={inStock}
            maxQuantity={stock}
            compact
            imageUrl={product.imageUrl}
          />
        </div>
      </div>
    </div>
  );
}
