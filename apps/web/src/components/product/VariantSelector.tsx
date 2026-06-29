'use client';
import { useState } from 'react';
import type { ProductVariant } from '@/types';
import { cn } from '@/lib/cn';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const MOCK_COLORS = [
  { name: 'Console Black', code: '#0A0A0C' },
  { name: 'Charcoal Grey', code: '#2D2D30' },
  { name: 'Matrix Green', code: '#00FF66' },
  { name: 'Blood Red', code: '#FF4D4D' },
];

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
  const [selectedColor, setSelectedColor] = useState('Console Black');

  if (variants.length === 0) return null;

  const sorted = [...variants].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.name);
    const bi = SIZE_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div className="space-y-4">
      {/* Color Swatches Layer */}
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-faint">
          Color — <span className="text-ink">{selectedColor}</span>
        </p>
        <div className="mt-2 flex gap-3">
          {MOCK_COLORS.map((c) => {
            const active = selectedColor === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedColor(c.name)}
                title={c.name}
                className={cn(
                  "relative h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95",
                  active ? "border-primary ring-2 ring-primary/40" : "border-border"
                )}
                style={{ backgroundColor: c.code }}
              >
                {active && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4.5 w-4.5 text-white drop-shadow">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Swatches Layer */}
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-faint">
          Size {selectedId ? `— ${variants.find(v => v.id === selectedId)?.name}` : ''}
        </p>
        <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 md:flex md:flex-wrap gap-2 w-full">
          {sorted.map((v) => {
            const out = v.stockQuantity <= 0;
            const selected = v.id === selectedId;
            return (
              <button
                key={v.id}
                type="button"
                disabled={out}
                onClick={() => onSelect(out ? null : v.id)}
                onMouseEnter={() => setHoveredId(v.id)}
                onMouseLeave={() => setHoveredId(null)}
                title={out ? 'Out of Stock' : v.name}
                className={cn(
                  'relative flex h-11 w-full md:w-11 items-center justify-center font-mono text-sm font-bold transition-all duration-200 overflow-hidden',
                  'rounded-xl border outline-none',
                  selected && 'border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(108,99,255,0.25)] ring-1 ring-primary/40',
                  !selected && !out && 'border-border bg-surface text-ink hover:border-primary/50 hover:bg-surface-3 hover:-translate-y-0.5 active:translate-y-0',
                  out && 'cursor-not-allowed border-border/40 text-muted/30 bg-surface-2 opacity-55',
                )}
              >
                {v.name}
                {/* Diagonal line strikeout */}
                {out && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[140%] h-[1.5px] bg-[#FF4D4D]/50 rotate-45 transform" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
