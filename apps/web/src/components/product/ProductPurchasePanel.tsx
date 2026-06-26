'use client';
import { useState } from 'react';
import type { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { topSpecs } from '@/lib/specs';
import { StockBadge } from '@/components/ui/StockBadge';
import { StarRating } from '@/components/ui/StarRating';
import { VariantSelector } from './VariantSelector';
import { AddToCart } from './AddToCart';
import { cn } from '@/lib/cn';

// Owns the selected variant + computed price/stock, and wires the wishlist
// button. Rendered as a client island beside the server-rendered product copy.
export function ProductPurchasePanel({ product }: { product: Product }) {
  const { settings } = useStore();
  const { notify } = useToast();
  const { status } = useAuth();
  const currency = settings?.currency ?? 'INR';

  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;

  const price = product.basePrice + (selectedVariant?.priceModifier ?? 0);
  const stock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const inStock = stock > 0;

  const handleSelectVariant = (id: string | null) => {
    setVariantId(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('codedrip-variant-change', { detail: id }));
    }
  };

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

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    notify(message, 'success');
  };

  return (
    <div className="space-y-6">
      {product.categoryName && (
        <p className="font-mono text-xs uppercase tracking-wider text-accent">// {product.categoryName.toLowerCase()}</p>
      )}
      <h1 className="text-xl sm:text-3xl font-sans font-bold tracking-tight text-white line-clamp-3 leading-tight">{product.name}</h1>

      {/* Social Share Row */}
      <div className="flex items-center gap-4 text-xs font-mono text-muted border-b border-white/5 pb-4">
        <span className="text-[10px] uppercase tracking-widest text-faint">share.pkg:</span>
        <button
          onClick={() => {
            const url = window.location.href;
            const text = `Check this out: ${product.name} (${formatCurrency(price, currency)}) - ${url}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
          }}
          className="hover:text-primary transition-colors flex items-center gap-1.5"
          aria-label="Share on WhatsApp"
        >
          <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          whatsapp
        </button>
        <button
          onClick={() => {
            copyToClipboard(window.location.href, 'Product link copied to clipboard');
          }}
          className="hover:text-primary transition-colors flex items-center gap-1.5"
          aria-label="Copy Link"
        >
          <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          link
        </button>
        <button
          onClick={() => {
            const url = window.location.href;
            const text = `${product.name} — Buy Online @codedrip`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
          }}
          className="hover:text-primary transition-colors flex items-center gap-1.5"
          aria-label="Share on Twitter/X"
        >
          <svg className="h-3.5 w-3.5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5.3-7-6.1 7H1.7l8-9.2L1 2h7l4.8 6.4L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" />
          </svg>
          twitter
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm font-mono">
        {product.reviewCount > 0 ? (
          <StarRating value={product.avgRating} count={product.reviewCount} />
        ) : (
          <span className="text-xs text-muted">no.reviews()</span>
        )}
        {product.brand && <span className="text-xs text-muted border-l border-white/5 pl-4">dist: {product.brand.toLowerCase()}</span>}
      </div>

      {/* Key specs as monospace pills */}
      {topSpecs(product, 4).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topSpecs(product, 4).map((s) => (
            <span key={s} className="spec-pill border border-white/5 bg-white/[0.02] text-xs font-mono rounded-lg px-3 py-1 text-muted">{s}</span>
          ))}
        </div>
      )}

      {/* Price block */}
      <div className="flex flex-wrap items-center gap-3 bg-black/15 p-4 rounded-xl border border-white/5">
        <span className="text-2xl font-bold font-mono text-danger">{formatCurrency(price, currency)}</span>
        {product.compareAtPrice && product.compareAtPrice > price && (
          <>
            <span className="text-sm font-mono text-muted line-through">{formatCurrency(product.compareAtPrice, currency)}</span>
            <span className="rounded-full bg-danger/10 border border-danger/25 px-2 py-0.5 text-[10px] font-mono font-bold text-danger">
              -{Math.round(((product.compareAtPrice - price) / product.compareAtPrice) * 100)}%
            </span>
          </>
        )}
        <div className="ml-auto">
          <StockBadge stock={stock} showCount size="sm" />
        </div>
      </div>

      {product.shortDescription && (
        <div>
          <p className={cn("text-sm leading-relaxed text-muted font-sans", !descExpanded && "line-clamp-3")}>
            {product.shortDescription}
          </p>
          {product.shortDescription.length > 150 && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-xs font-mono text-primary hover:text-accent mt-1 underline focus:outline-none"
            >
              {descExpanded ? "[read less]" : "[read more]"}
            </button>
          )}
        </div>
      )}

      {/* Selector and Actions */}
      <div className="space-y-4 pt-2">
        <VariantSelector variants={variants} selectedId={variantId} onSelect={handleSelectVariant} />
        
        <AddToCart productId={product.id} variantId={variantId} inStock={inStock} maxQuantity={stock} imageUrl={product.imageUrl} />
      </div>

      {/* Tech tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
          {product.tags.map((tag) => (
            <span
              key={tag.slug}
              className="inline-flex items-center rounded-md px-2.5 py-0.5 font-mono text-[10px] font-medium border"
              style={{
                backgroundColor: `${tag.color}10`,
                color: tag.color,
                borderColor: `${tag.color}25`,
              }}
            >
              {tag.name.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      <button onClick={addToWishlist} className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:text-accent transition-all duration-200 mt-2">
        <span>★</span> <span>git star --item</span>
      </button>
    </div>
  );
}
