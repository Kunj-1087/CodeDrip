'use client';
import type { ProductVariant } from '@/types';

// Presentational variant chooser. The parent panel owns the selected id and
// recomputes price/stock when it changes.
export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (variants.length === 0) return null;
  return (
    <div>
      <p className="label">Configuration</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const out = v.stockQuantity <= 0;
          const selected = v.id === selectedId;
          return (
            <button
              key={v.id}
              disabled={out}
              onClick={() => onSelect(v.id)}
              className={`rounded-xl border px-4 py-2 text-sm transition ${
                selected ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-border text-ink hover:bg-surface-2'
              } ${out ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {v.name}
              {out && ' (out)'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
