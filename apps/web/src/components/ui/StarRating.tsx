// Read-only star rating. `value` is 0–5 (halves rounded for display).
export function StarRating({ value, count }: { value: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="text-accent" aria-hidden="true">
        {'★'.repeat(full)}
        <span className="text-muted">{'★'.repeat(5 - full)}</span>
      </span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  );
}
