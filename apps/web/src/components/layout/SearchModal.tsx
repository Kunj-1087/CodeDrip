'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatCurrency } from '@/lib/format';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/lib/cn';

export function SearchModal() {
  const router = useRouter();
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('codedrip_recent_searches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  // Listen to open-search / Ctrl+K / Cmd+K custom event
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
    };
    window.addEventListener('open-search', handleOpen);
    return () => window.removeEventListener('open-search', handleOpen);
  }, []);

  // Listen to global open-search trigger triggers
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-search'));
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, []);

  // Sync scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ products: Product[] }>(`/products?q=${encodeURIComponent(query.trim())}`);
        setResults(res.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Save to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('codedrip_recent_searches', JSON.stringify(updated));
  };

  const handleSelectProduct = (product: Product) => {
    saveRecentSearch(query || product.name);
    setOpen(false);
    router.push(`/shop/${product.slug}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelectProduct(results[activeIndex]);
      } else if (query.trim()) {
        saveRecentSearch(query);
        setOpen(false);
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col justify-start bg-black/95 backdrop-blur-md p-6 sm:p-12 font-mono text-zinc-300"
        >
          {/* Backdrop Close */}
          <div className="absolute inset-0 z-0" onClick={() => setOpen(false)} />

          <motion.div 
            initial={{ scale: 0.97, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto w-full max-w-3xl flex flex-col h-full max-h-[85vh] bg-[#0A0A0C]/90 p-6 rounded-2xl border border-white/5 glass-panel shadow-2xl"
          >
            {/* Search Input Bar */}
            <div className="relative border-b border-primary/20 pb-4 flex items-center gap-4">
              <span className="text-[#FF4D4D] font-bold text-2xl animate-pulse">{`>`}</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="grep database for tees..."
                className="w-full bg-transparent text-white text-xl sm:text-2xl font-mono focus:outline-none placeholder-zinc-700 uppercase tracking-wide border-none outline-none"
              />
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-zinc-500 hover:text-white border border-white/10 hover:border-white/20 px-2 py-1 rounded transition-colors uppercase"
              >
                [esc] Close
              </button>
            </div>

            {/* Results / Details Body */}
            <div className="flex-1 overflow-y-auto mt-6 pr-2 scrollbar-none">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted animate-pulse">
                  $ executing grep query...
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">// search results ({results.length} objects)</p>
                  <ul className="space-y-1">
                    {results.map((product, idx) => {
                      const isActive = idx === activeIndex;
                      return (
                        <li 
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-lg border transition-all duration-150 cursor-pointer",
                            isActive 
                              ? "bg-white/[0.03] border-primary/30 text-white shadow-md" 
                              : "bg-transparent border-transparent text-muted"
                          )}
                        >
                          <div className="h-10 w-10 overflow-hidden rounded bg-zinc-900 border border-white/5 flex-shrink-0">
                            <ProductImage src={product.imageUrl} alt="" className="h-full w-full object-cover" sizes="40px" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold uppercase tracking-wider truncate">{product.name}</h4>
                            <span className="text-[9px] text-[#FF4D4D]/80 uppercase mt-0.5 inline-block">// {product.categoryName || 'product'}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-ink">{formatCurrency(product.basePrice, currency)}</span>
                            <span className="block text-[8px] text-zinc-500 uppercase mt-0.5">
                              {product.inStock ? 'in_stock' : 'oos'}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : query.trim() ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  No records found matching "{query}".
                </div>
              ) : (
                /* Recent Searches */
                <div className="space-y-8 py-4">
                  {recentSearches.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">// recent search logs</p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => setQuery(term)}
                            className="bg-zinc-900/60 hover:bg-zinc-800/80 text-xs border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-lg text-muted hover:text-white transition-all font-mono"
                          >
                            $ {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">// hot keys / namespaces</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => { setQuery('tee'); }}
                        className="text-left p-4 rounded-xl border border-white/[0.03] bg-zinc-950/20 hover:border-primary/20 hover:bg-primary/[0.01] transition-all group"
                      >
                        <span className="block text-xs font-bold text-white group-hover:text-primary transition-colors">$ cd ~/t-shirts</span>
                        <span className="block text-[10px] text-muted mt-1 font-sans">Browse all high-GSM combed cotton tees.</span>
                      </button>
                      <button
                        onClick={() => { setQuery('drop'); }}
                        className="text-left p-4 rounded-xl border border-white/[0.03] bg-zinc-950/20 hover:border-accent/20 hover:bg-accent/[0.01] transition-all group"
                      >
                        <span className="block text-xs font-bold text-white group-hover:text-accent transition-colors">$ cd ~/limited-drops</span>
                        <span className="block text-[10px] text-muted mt-1 font-sans">Check short-run releases.</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
