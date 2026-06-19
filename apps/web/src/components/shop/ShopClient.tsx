'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Product, Pagination as PaginationMeta } from '@/types';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from './SearchBar';
import { SortDropdown } from './SortDropdown';
import { FilterPanel } from './FilterPanel';

export function ShopClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Current filter values derived from the URL (the URL is the source of truth).
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

  // Write a partial filter change back into the URL (resets to page 1).
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

  return (
    <div className="container-px py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {filters.category ? `${filters.category.toUpperCase()} & memory` : 'All products'}
          </h1>
          <p className="text-sm text-muted">
            {pagination ? `${pagination.total} ${pagination.total === 1 ? 'product' : 'products'}` : 'Loading…'}
          </p>
        </div>
        <SortDropdown value={filters.sort} onChange={(sort) => setParam({ sort })} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-6">
          <SearchBar initial={filters.q} onSearch={(q) => setParam({ q: q || undefined })} />
          <FilterPanel
            filters={{ category: filters.category, minPrice: filters.minPrice, maxPrice: filters.maxPrice }}
            onChange={(next) => setParam({ ...next })}
          />
        </div>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-lg font-semibold text-ink">No parts match those filters yet</p>
              <p className="mt-2 text-sm text-muted">
                Try a broader search or clear the price range — we add stock regularly.
              </p>
              <button onClick={() => router.replace('/shop')} className="btn-secondary mt-4">
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {products.map((p) => (
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
    </div>
  );
}
