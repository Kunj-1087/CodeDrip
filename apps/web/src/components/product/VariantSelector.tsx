'use client';
import { useState } from 'react';
import type { ProductVariant } from '@/types';
import { cn } from '@/lib/cn';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (variants.length === 0) return null;

  const sorted = [...variants].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.name);
    const bi = SIZE_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div>
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-faint">
        Size {selectedId ? `— ${variants.find(v => v.id === selectedId)?.name}` : ''}
      </p>
      <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 md:flex md:flex-wrap gap-2 w-full">
        {sorted.map((v) => {
          const out = v.stockQuantity <= 0;
          const selected = v.id === selectedId;
          const hovered = v.id === hoveredId;
          return (
            <button
              key={v.id}
              disabled={out}
              onClick={() => onSelect(out ? null : v.id)}
              onMouseEnter={() => setHoveredId(v.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={out ? 'OOS' : v.name}
              className={cn(
                'relative flex h-11 w-full md:w-11 items-center justify-center font-mono text-sm font-bold transition-all duration-200',
                'rounded-xl border outline-none',
                selected && 'border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(108,99,255,0.25)] ring-1 ring-primary/40',
                !selected && !out && 'border-white/10 bg-black/15 text-white hover:border-primary/50 hover:bg-surface-3 hover:-translate-y-0.5 active:translate-y-0',
                out && 'cursor-not-allowed border-white/5 text-muted/30 bg-black/5 opacity-50',
                out && hovered && 'after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-[8px] after:font-bold after:tracking-tighter after:text-danger after:content-["OOS"] after:bg-black/80 after:rounded-xl',
              )}
            >
              {v.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
