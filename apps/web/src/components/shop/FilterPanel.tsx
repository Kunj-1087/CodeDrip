'use client';
import { useEffect, useState } from 'react';
import type { Category } from '@/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

interface Filters {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}

export function FilterPanel({
  filters,
  onChange,
  selectedSize,
  onSizeChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  selectedSize: string | null;
  onSizeChange: (size: string | null) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [min, setMin] = useState(filters.minPrice ?? '');
  const [max, setMax] = useState(filters.maxPrice ?? '');

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((r) => setCategories(r.categories)).catch(() => undefined);
  }, []);

  useEffect(() => {
    setMin(filters.minPrice ?? '');
    setMax(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  const filterBtn = (key: keyof Filters, value: string | undefined, label: string, active: boolean) => (
    <button
      onClick={() => onChange({ ...filters, [key]: active ? undefined : value })}
      className={cn(
        'w-full rounded-lg px-2 py-1.5 text-left text-sm font-mono transition-colors duration-150',
        active
          ? 'bg-primary/10 font-semibold text-primary'
          : 'text-muted hover:bg-surface-2 hover:text-ink',
      )}
    >
      {label}
    </button>
  );

  return (
    <aside className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-accent">// category.db</h3>
        <ul className="space-y-1">
          <li>{filterBtn('category', undefined, 'all_products', !filters.category)}</li>
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between">
              {filterBtn('category', c.slug, c.slug, filters.category === c.slug)}
              {c.productCount !== undefined && <span className="pr-2 text-xs font-mono text-faint">{c.productCount}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Size Chips */}
      <div>
        <h3 className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-accent">// size.attr</h3>
        <div className="grid grid-cols-3 gap-2">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
            <button
              key={sz}
              onClick={() => onSizeChange(selectedSize === sz ? null : sz)}
              className={cn(
                "h-9 flex items-center justify-center text-xs font-mono font-bold border rounded-lg transition-all duration-200 active:scale-95",
                selectedSize === sz
                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(108,99,255,0.15)]"
                  : "border-white/5 bg-black/20 text-muted hover:border-white/10 hover:text-ink"
              )}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-accent">// price.range</h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">₹</span>
            <input
              type="number"
              min={0}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="Min"
              aria-label="Minimum price"
              className="input py-2 pl-6 font-mono text-xs"
            />
          </div>
          <span className="text-muted font-mono">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">₹</span>
            <input
              type="number"
              min={0}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="Max"
              aria-label="Maximum price"
              className="input py-2 pl-6 font-mono text-xs"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onChange({ ...filters, minPrice: min || undefined, maxPrice: max || undefined })}
            className="btn-secondary flex-1 py-2 font-mono text-xs"
          >
            Apply price
          </button>
          {(min || max) && (
            <button
              onClick={() => {
                setMin('');
                setMax('');
                onChange({ ...filters, minPrice: undefined, maxPrice: undefined });
              }}
              className="btn border border-danger/25 bg-danger/5 hover:bg-danger/10 text-danger px-2.5 py-2 rounded-lg text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
