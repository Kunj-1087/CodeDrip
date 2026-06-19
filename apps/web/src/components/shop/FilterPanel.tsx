'use client';
import { useEffect, useState } from 'react';
import type { Category } from '@/types';
import { api } from '@/lib/api';

interface Filters {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}

// Category + price-range filters. Categories are fetched once; price is applied
// on "Apply" so we don't refetch on every keystroke.
export function FilterPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [min, setMin] = useState(filters.minPrice ?? '');
  const [max, setMax] = useState(filters.maxPrice ?? '');

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((r) => setCategories(r.categories)).catch(() => undefined);
  }, []);

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Category</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => onChange({ ...filters, category: undefined })}
              className={`w-full rounded-lg px-2 py-1.5 text-left ${!filters.category ? 'bg-primary/10 font-medium text-primary' : 'text-muted hover:bg-surface-2'}`}
            >
              All products
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onChange({ ...filters, category: c.slug })}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left ${filters.category === c.slug ? 'bg-primary/10 font-medium text-primary' : 'text-muted hover:bg-surface-2'}`}
              >
                <span>{c.name}</span>
                {c.productCount !== undefined && <span className="text-xs">{c.productCount}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Price (₹)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="input py-2"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min={0}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="input py-2"
          />
        </div>
        <button
          onClick={() => onChange({ ...filters, minPrice: min || undefined, maxPrice: max || undefined })}
          className="btn-secondary mt-3 w-full py-2"
        >
          Apply price
        </button>
      </div>
    </aside>
  );
}
