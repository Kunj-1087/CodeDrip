'use client';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';

// Persistent tray that appears once the shopper flags ≥2 products to compare. Docked
// bottom-center so it doesn't fight the cookie banner (full-width) for the corner.
export function CompareBar() {
  const { items, clear } = useCompare();
  if (items.length < 2) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[85] flex justify-center px-4">
      <div className="pointer-events-auto flex animate-slide-up items-center gap-3 rounded-full border border-border bg-surface py-2 pl-4 pr-2 shadow-lg">
        <span className="text-sm font-medium text-ink">
          {items.length} product{items.length === 1 ? '' : 's'} to compare
        </span>
        <button onClick={clear} className="text-xs text-muted transition-colors hover:text-ink">
          Clear
        </button>
        <Link href="/compare" className="btn-primary h-9 px-4 text-sm">
          Compare
        </Link>
      </div>
    </div>
  );
}
