// Read-only star rating with true fractional fill (a 4.6 shows ~60% of the 5th
// star), rendered as SVG so it stays crisp and uses the amber accent token.
export function StarRating({ value, count }: { value: number; count?: number }) {
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="relative inline-block" aria-hidden="true">
        {/* Empty track */}
        <Stars className="text-border-strong" />
        {/* Filled overlay, clipped to the rating percentage */}
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <Stars className="text-accent" />
        </span>
      </span>
      {count !== undefined && <span className="text-faint">({count})</span>}
    </span>
  );
}

function Stars({ className }: { className?: string }) {
  return (
    <span className={`flex ${className ?? ''}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" aria-hidden="true">
          <path d="m12 2 2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}
