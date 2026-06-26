'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { topSpecs } from '@/lib/specs';
import { ProductImage } from './ProductImage';
import { StarRating } from './StarRating';
import { StockBadge } from './StockBadge';
import { cn } from '@/lib/cn';

// The single most important component in the store. Built entirely from tokens so
// it retheme-s with the palette and works in light/dark with no per-class overrides.
export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const { settings } = useStore();
  const { status } = useAuth();
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const currency = settings?.currency ?? 'INR';

  // Fetch wishlist state from API (authenticated) or localStorage (guest)
  useEffect(() => {
    let cancelled = false;
    const checkWishlist = async () => {
      if (status === 'authenticated') {
        try {
          const res = await api.get<{ items: Array<{ productId: string }> }>('/wishlist');
          if (!cancelled) setSaved(res.items.some((i) => i.productId === product.id));
        } catch {}
      } else {
        try {
          const local = JSON.parse(localStorage.getItem('codedrip_wishlist') || '[]');
          if (!cancelled) setSaved(local.some((i: { productId: string }) => i.productId === product.id));
        } catch {}
      }
      if (!cancelled) setWishlistLoaded(true);
    };
    void checkWishlist();
    return () => { cancelled = true; };
  }, [status, product.id]);

  const onAdd = async () => {
    setAdding(true);
    try {
      await addItem(product.id, 1);
      notify(`Staged ${product.name} for deployment`, 'success');
    } catch {
      notify('Failed to stage item. Please try again.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const onSave = async () => {
    // Optimistic toggle so the heart responds immediately.
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (status === 'authenticated') {
        if (wasSaved) {
          await api.del(`/wishlist/${product.id}`);
          notify('Removed from your wishlist', 'info');
        } else {
          await api.post(`/wishlist/${product.id}`);
          notify('Saved to your wishlist', 'success');
        }
      } else {
        // localStorage fallback for guest users
        const existing = JSON.parse(localStorage.getItem('codedrip_wishlist') || '[]');
        if (wasSaved) {
          const updated = existing.filter((i: { productId: string }) => i.productId !== product.id);
          localStorage.setItem('codedrip_wishlist', JSON.stringify(updated));
          notify('Removed from your wishlist', 'info');
        } else {
          const newItem = {
            productId: product.id,
            name: product.name,
            slug: product.slug,
            basePrice: product.basePrice,
            inStock: product.inStock,
            imageUrl: product.imageUrl,
          };
          localStorage.setItem('codedrip_wishlist', JSON.stringify([...existing, newItem]));
          notify('Saved to your wishlist', 'success');
        }
      }
    } catch {
      setSaved(wasSaved);
      notify('Could not update wishlist', 'error');
    }
  };

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
      : 0;
  const specs = topSpecs(product);

  const isNew = product.tags?.some((t) => t.slug === 'new' || t.name.toLowerCase() === 'new');

  return (
    <div
      className={cn(
        'card group flex flex-col overflow-hidden transition-all duration-300 border border-border bg-surface-2',
        'lg:hover:-translate-y-1.5 lg:hover:border-primary/40 lg:hover:shadow-[0_12px_24px_-10px_rgba(108,99,255,0.15)] active:scale-[0.98] rounded-lg md:rounded-2xl relative',
        product.isFeatured && 'glow-border',
        !product.inStock && 'opacity-70',
      )}
    >
      <div className="relative overflow-hidden aspect-square">
        <Link href={`/shop/${product.slug}`} className="block h-full w-full bg-surface-2 relative">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
          {/* Subtle overlay shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/40 to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* NEW Badge */}
        {isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-md z-20 animate-pulse">
            NEW
          </span>
        )}

        {/* Stock status - top-left */}
        <span className={cn("absolute left-3 backdrop-blur z-20 transition-all", isNew ? "top-[38px]" : "top-3")}>
          <StockBadge stock={product.inStock ? product.stockQuantity : 0} />
        </span>

        {/* Bestseller Badge */}
        {product.isFeatured && (
          <span className={cn("absolute left-3 rounded-full bg-gradient-to-r from-primary to-accent px-2.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-md z-20 transition-all", isNew ? "top-[68px]" : "top-10")}>
            BESTSELLER
          </span>
        )}

        {/* Wishlist heart - top-right */}
        <button
          onClick={onSave}
          aria-label={`Save ${product.name} to wishlist`}
          aria-pressed={saved}
          className={cn(
            "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur border border-white/10 z-20",
            "transition-all lg:hover:scale-110 active:scale-95 after:absolute after:-inset-1.5 after:content-['']",
            saved ? "text-danger border-danger/20 bg-danger/10" : "lg:hover:text-danger"
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 md:p-4 relative bg-surface-2">
        {product.brand && <p className="eyebrow tracking-widest text-[9px] text-accent">{product.brand.toLowerCase()}</p>}
        <Link href={`/shop/${product.slug}`} className="mt-1 no-underline">
          <h3 className="line-clamp-2 text-sm font-sans font-bold leading-snug text-white transition-colors lg:group-hover:text-primary">{product.name}</h3>
        </Link>

        {/* Specs & Tags */}
        {specs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {specs.slice(0, 2).map((s) => (
              <span key={s} className="spec-pill border border-white/5 bg-surface text-[10px] py-0.5 px-2 rounded-md text-muted font-mono">{s}</span>
            ))}
          </div>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.slug}
                className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[9px] font-medium border"
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

        {product.reviewCount > 0 && (
          <div className="mt-2.5">
            <StarRating value={product.avgRating} count={product.reviewCount} />
          </div>
        )}

        {/* Size variants indicators */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {product.variants.map((v) => (
              <span
                key={v.id}
                title={v.stockQuantity <= 0 ? `${v.name} (Out of Stock)` : v.name}
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold font-mono transition-all",
                  v.stockQuantity > 0
                    ? "border-white/10 bg-white/5 text-muted hover:border-primary/50"
                    : "border-white/5 bg-transparent text-muted/30 line-through opacity-40"
                )}
              >
                {v.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-base font-mono font-bold text-white">{formatCurrency(product.basePrice, currency)}</span>
          {discount > 0 && (
            <>
              <span className="text-xs font-mono text-faint line-through">{formatCurrency(product.compareAtPrice!, currency)}</span>
              <span className="text-[10px] font-mono font-bold text-success">-{discount}%</span>
            </>
          )}
        </div>

        {/* CTA add to cart */}
        <button
          onClick={onAdd}
          disabled={adding || !product.inStock}
          className={cn(
            'btn bg-gradient-to-r from-primary to-accent text-white mt-4 w-full py-2.5 font-mono text-xs rounded-xl shadow-md transition-all duration-200',
            'lg:hover:-translate-y-0.5 active:scale-95',
            'disabled:from-border disabled:to-border disabled:opacity-40 disabled:cursor-not-allowed',
          )}
          aria-label={`Add ${product.name} to cart`}
        >
          {adding ? 'staging...' : product.inStock ? 'git add <shirt>' : '404: OOS'}
        </button>
      </div>
    </div>
  );
}

