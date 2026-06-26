import { cn } from '@/lib/cn';

// Single source of truth for stock status across the store (cards, product page,
// admin inventory). Three states keyed off quantity + a low-stock threshold:
//   in stock  → green dot
//   low stock → amber dot, gently pulsing to flag urgency (can show the count)
//   out       → red dot
// Built from semantic tokens so it adapts to light/dark and any rebrand.
export function StockBadge({
  stock,
  threshold = 5,
  showCount = false,
  size = 'md',
  className,
}: {
  stock: number;
  threshold?: number;
  /** When low, show "Only N left" instead of just "Low stock". */
  showCount?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const state = stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'in';

  const tone = {
    in: 'bg-success/[0.12] text-success',
    low: 'bg-warning/[0.14] text-warning',
    out: 'bg-danger/[0.12] text-danger',
  }[state];
  const dot = { in: 'bg-success', low: 'bg-warning', out: 'bg-danger' }[state];
  const label =
    state === 'out' ? '404: Inventory Not Found' : state === 'low' ? (showCount ? `Only ${stock} left` : 'Low stock') : 'In stock';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        tone,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {state === 'low' && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', dot)} />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', dot)} />
      </span>
      {label}
    </span>
  );
}
