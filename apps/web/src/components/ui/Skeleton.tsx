// Loading placeholder. `.skeleton` carries the shimmer animation (globals.css).
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

// A product-card-shaped skeleton for grid loading states.
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  );
}
