'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/format';
import { ProductImage } from '@/components/ui/ProductImage';
import { cn } from '@/lib/cn';

// Slide-over cart. Full-screen sheet on phones (w-full) and a right-docked panel
// on sm+ (max-w-md). Reads/writes the shared cart via useCart, so it always
// reflects the same state as the /cart page. ESC + backdrop + scroll-lock, like
// the modal. The navbar owns the open/close state and renders this.
export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, itemCount, loading, updateQuantity, removeItem } = useCart();
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Your cart">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-white/5 bg-[#0A0A0C] shadow-2xl sm:max-w-md animate-[drawer-in_240ms_ease-out] glass-panel gpu-layer">
        {/* Header */}
        <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-white/5 px-4 bg-black/20">
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-sm font-bold tracking-tight text-white font-mono flex-1">
            &lt;staging_area /&gt; {itemCount > 0 && <span className="text-accent font-mono ml-1">({itemCount} objects)</span>}
          </h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-none">
          {loading ? (
            <p className="text-xs text-muted font-mono animate-pulse">// fetching staging_logs.json...</p>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6">
              <span className="text-3xl mb-4">📭</span>
              <p className="text-sm font-bold text-white font-mono">staging.is_empty()</p>
              <p className="mt-2 max-w-xs text-xs text-muted font-sans leading-relaxed">
                No items currently staged for production deployment. Head to the repository shop and stage some threads.
              </p>
              <Link href="/shop" onClick={onClose} className="btn bg-gradient-to-r from-primary to-accent text-white mt-6 font-mono text-xs px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-primary/20">
                cd shop/
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((line) => (
                <li key={line.id} className="flex gap-4 py-5 hover:bg-white/[0.01] px-2 rounded-xl transition-colors">
                  <Link
                    href={`/shop/${line.slug}`}
                    onClick={onClose}
                    className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-white/5 bg-black/20"
                  >
                    <ProductImage src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" sizes="80px" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/shop/${line.slug}`}
                      onClick={onClose}
                      className="line-clamp-2 text-xs font-semibold font-sans text-white hover:text-primary transition-colors leading-snug"
                    >
                      {line.name}
                    </Link>
                    <span className="mt-1 text-[10px] font-mono text-muted">{formatCurrency(line.unitPrice, currency)} / unit</span>

                    <div className="mt-3 flex items-center gap-2">
                      {/* Inline Stepper */}
                      <div className="flex items-center rounded-xl border border-white/5 bg-black/30 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(line.id, line.quantity - 1)}
                          className="grid h-11 w-11 place-items-center text-sm text-muted hover:text-white active:scale-90 transition-all font-bold"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold text-white tabular-nums">{line.quantity}</span>
                        <button
                          onClick={() => updateQuantity(line.id, Math.min(line.stockQuantity, line.quantity + 1))}
                          disabled={line.quantity >= line.stockQuantity}
                          className="grid h-11 w-11 place-items-center text-sm text-muted hover:text-white active:scale-90 transition-all font-bold"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(line.id)}
                        className="ml-auto h-11 px-3 flex items-center justify-center text-[10px] font-mono text-danger hover:text-red-400 hover:bg-danger/5 rounded-xl border border-danger/10 transition-all active:scale-95"
                      >
                        git rm
                      </button>
                    </div>
                  </div>

                  <span className="flex-shrink-0 text-xs font-mono font-bold text-white pl-2">
                    {formatCurrency(line.lineTotal, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-white/5 p-5 bg-black/20">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-mono text-muted">Subtotal</span>
              <span className="text-base font-mono font-bold text-white">{formatCurrency(subtotal, currency)}</span>
            </div>
            <p className="mb-4 text-[10px] font-mono text-faint">// shipping & tax calculated at origin</p>
            <Link 
              href="/checkout" 
              onClick={onClose} 
              className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full py-3.5 text-center font-mono text-xs rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              git commit -m "checkout"
            </Link>
            <Link 
              href="/cart" 
              onClick={onClose} 
              className="btn border border-border bg-surface-2 text-ink hover:bg-surface-3 mt-2.5 w-full py-3 text-center font-mono text-xs rounded-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              git status
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
