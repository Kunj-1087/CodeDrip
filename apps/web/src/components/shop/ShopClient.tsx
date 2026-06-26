'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Product, Category, Pagination as PaginationMeta } from '@/types';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from './SearchBar';
import { SortDropdown } from './SortDropdown';
import { FilterPanel } from './FilterPanel';
import { cn } from '@/lib/cn';

export function ShopClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Drag states for mobile filters sheet
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);

  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      category: params.get('category') ?? undefined,
      sort: params.get('sort') ?? 'newest',
      featured: params.get('featured') ?? undefined,
      minPrice: params.get('minPrice') ?? undefined,
      maxPrice: params.get('maxPrice') ?? undefined,
      page: Number(params.get('page') ?? '1'),
    }),
    [params],
  );

  const setParam = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, v);
      }
      if (!('page' in patch)) next.delete('page');
      router.replace(`/shop?${next.toString()}`);
    },
    [params, router],
  );

  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice ?? '');
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice ?? '');

  useEffect(() => {
    setLocalMinPrice(filters.minPrice ?? '');
    setLocalMaxPrice(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories')
      .then((r) => setCategories(r.categories))
      .catch(() => undefined);
  }, []);

  // Lock body scroll when mobile filter is open
  useEffect(() => {
    if (filterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [filterOpen]);

  // Touch drag-to-dismiss handlers for bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset > 120) {
      setFilterOpen(false);
    }
    setDragOffset(0);
  };

  // Client-side size filtering logic
  const displayedProducts = useMemo(() => {
    if (!selectedSize) return products;
    return products.filter((p) => {
      if (p.variants?.some((v) => v.name.toUpperCase() === selectedSize.toUpperCase())) return true;
      if (p.tags?.some((t) => t.name.toUpperCase() === selectedSize.toUpperCase() || t.slug.toUpperCase() === selectedSize.toUpperCase())) return true;
      const sizeSpec = p.specs?.sizes || p.specs?.size;
      if (typeof sizeSpec === 'string' && sizeSpec.toUpperCase().includes(selectedSize.toUpperCase())) return true;
      return false;
    });
  }, [products, selectedSize]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filters.q) qs.set('q', filters.q);
    if (filters.category) qs.set('category', filters.category);
    if (filters.sort) qs.set('sort', filters.sort);
    if (filters.featured) qs.set('featured', filters.featured);
    if (filters.minPrice) qs.set('minPrice', filters.minPrice);
    if (filters.maxPrice) qs.set('maxPrice', filters.maxPrice);
    qs.set('page', String(filters.page));
    qs.set('limit', '12');

    api
      .get<{ products: Product[]; pagination: PaginationMeta }>(`/products?${qs.toString()}`)
      .then((res) => {
        setProducts(res.products);
        setPagination(res.pagination);
      })
      .catch(() => {
        setProducts([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (selectedSize ? 1 : 0) +
    ((filters.minPrice || filters.maxPrice) ? 1 : 0);

  return (
    <div className="container-px py-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-mono">
            {filters.category ? `/${filters.category}` : '/shop'}
          </h1>
          <p className="text-sm text-muted font-mono">
            {pagination
              ? `${selectedSize ? displayedProducts.length : pagination.total} result${(selectedSize ? displayedProducts.length : pagination.total) !== 1 ? 's' : ''}`
              : 'Loading...'}
          </p>
        </div>
        <SortDropdown value={filters.sort} onChange={(sort) => setParam({ sort })} />
      </div>

      <div className="mb-4 flex items-center gap-2 md:hidden">
        <button
          onClick={() => setFilterOpen(true)}
          className={cn(
            'btn-secondary flex-1 justify-center gap-2 py-2.5 text-sm',
            activeFilterCount > 0 && 'border-primary text-primary',
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
        <SearchBar initial={filters.q} onSearch={(q) => setParam({ q: q || undefined })} />
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 md:hidden">
          {filters.category && (
            <button
              onClick={() => setParam({ category: undefined })}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {filters.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              <span aria-hidden>×</span>
            </button>
          )}
          {selectedSize && (
            <button
              onClick={() => setSelectedSize(null)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              Size: {selectedSize}
              <span aria-hidden>×</span>
            </button>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <button
              onClick={() => setParam({ minPrice: undefined, maxPrice: undefined })}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {'\u20B9'}{filters.minPrice || '0'}–{filters.maxPrice || '...'}
              <span aria-hidden>×</span>
            </button>
          )}
          <button
            onClick={() => {
              setParam({ category: undefined, minPrice: undefined, maxPrice: undefined });
              setSelectedSize(null);
            }}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted hover:text-ink"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <div className="hidden lg:block space-y-6">
          <FilterPanel
            filters={{
              category: filters.category,
              minPrice: filters.minPrice,
              maxPrice: filters.maxPrice,
            }}
            onChange={(next) => setParam({ ...next })}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
          />
        </div>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card p-8 sm:p-12 text-center">
              <p className="text-lg font-semibold text-ink font-mono">404: No results found</p>
              <p className="mt-2 text-sm text-muted font-mono">
                Your query returned zero results. Try a broader search or clear the filters.
              </p>
              <button onClick={() => router.replace('/shop')} className="btn-secondary mt-4 font-mono">
                rm -rf ./filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {displayedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {pagination && (
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => setParam({ page: String(page) })}
                />
              )}
            </>
          )}
        </div>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setFilterOpen(false)}
          />
          <div
            style={{
              transform: `translateY(${dragOffset}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute bottom-0 left-0 right-0 h-[75vh] flex flex-col rounded-t-2xl border-t border-border bg-[#0e0e10] shadow-xl overflow-hidden"
          >
            {/* Drag Handle & Header */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full py-3 flex flex-col items-center cursor-grab active:cursor-grabbing border-b border-white/5 bg-[#0e0e10]"
            >
              <div className="h-1.5 w-12 rounded-full bg-white/20" />
              <div className="mt-2 flex items-center justify-between w-full px-5">
                <span className="text-sm font-bold font-mono text-white">// git filter-branch</span>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="text-xs font-mono text-primary hover:text-accent border border-primary/20 px-2 py-0.5 rounded"
                >
                  [esc]
                </button>
              </div>
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-6">
              {/* Sort Option Buttons */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent mb-3">// sort.config</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'featured', label: 'Featured' },
                    { value: 'newest', label: 'Newest' },
                    { value: 'price_asc', label: 'Price: Low-High' },
                    { value: 'price_desc', label: 'Price: High-Low' },
                    { value: 'rating', label: 'Top Rated' },
                    { value: 'name', label: 'Name A–Z' },
                  ].map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setParam({ sort: o.value })}
                      className={cn(
                        "py-2 px-3 text-xs font-mono border rounded-xl transition-all duration-200 active:scale-95 text-center",
                        filters.sort === o.value
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-[0_0_10px_rgba(108,99,255,0.15)]"
                          : "border-white/5 bg-black/20 text-muted hover:border-white/10"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Options */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent mb-3">// category.db</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setParam({ category: undefined })}
                    className={cn(
                      "py-1.5 px-3 text-xs font-mono border rounded-xl transition-all duration-200 active:scale-95",
                      !filters.category
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-[0_0_10px_rgba(108,99,255,0.15)]"
                        : "border-white/5 bg-black/20 text-muted hover:border-white/10"
                    )}
                  >
                    all_products
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setParam({ category: c.slug })}
                      className={cn(
                        "py-1.5 px-3 text-xs font-mono border rounded-xl transition-all duration-200 active:scale-95",
                        filters.category === c.slug
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-[0_0_10px_rgba(108,99,255,0.15)]"
                          : "border-white/5 bg-black/20 text-muted hover:border-white/10"
                      )}
                    >
                      {c.slug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Chips */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent mb-3">// size.attr</h3>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                      className={cn(
                        "w-11 h-11 flex items-center justify-center text-xs font-mono font-bold border rounded-xl transition-all duration-200 active:scale-95",
                        selectedSize === sz
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(108,99,255,0.15)]"
                          : "border-white/5 bg-black/20 text-muted hover:border-white/10"
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent mb-3">// price.range</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={localMinPrice}
                      onChange={(e) => setLocalMinPrice(e.target.value)}
                      placeholder="Min"
                      aria-label="Minimum price"
                      className="input py-2 pl-7 font-mono text-xs"
                    />
                  </div>
                  <span className="text-muted font-mono">–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={localMaxPrice}
                      onChange={(e) => setLocalMaxPrice(e.target.value)}
                      placeholder="Max"
                      aria-label="Maximum price"
                      className="input py-2 pl-7 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setParam({ minPrice: localMinPrice || undefined, maxPrice: localMaxPrice || undefined });
                    }}
                    className="btn-secondary flex-1 py-2 font-mono text-xs"
                  >
                    Apply price
                  </button>
                  {(localMinPrice || localMaxPrice) && (
                    <button
                      onClick={() => {
                        setLocalMinPrice('');
                        setLocalMaxPrice('');
                        setParam({ minPrice: undefined, maxPrice: undefined });
                      }}
                      className="btn border border-danger/25 bg-danger/5 hover:bg-danger/10 text-danger px-3 py-2 rounded-xl text-xs font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Sticky Action Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-[#0e0e10] p-4 flex gap-2">
              <button
                onClick={() => {
                  setParam({
                    category: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    sort: 'featured',
                  });
                  setSelectedSize(null);
                  setLocalMinPrice('');
                  setLocalMaxPrice('');
                  setFilterOpen(false);
                }}
                className="btn-secondary flex-1 py-3 font-mono text-xs"
              >
                Reset all
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="btn bg-gradient-to-r from-primary to-accent text-white flex-[2] py-3 font-mono text-xs rounded-xl shadow-md"
              >
                Show results ({displayedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
