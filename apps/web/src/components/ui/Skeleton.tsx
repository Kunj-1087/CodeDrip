import { cn } from '@/lib/cn';

// Loading placeholder. `.skeleton` carries the warm shimmer (globals.css).
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

// A product-card-shaped skeleton — matches ProductCard's footprint so grids don't
// jump when real cards swap in.
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

// Paragraph-shaped shimmer. The last line is shortened to read like real prose.
export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

// A single table row of shimmer cells, for table loading states.
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn('h-4', i === 0 ? 'w-3/4' : 'w-1/2')} />
        </td>
      ))}
    </tr>
  );
}
