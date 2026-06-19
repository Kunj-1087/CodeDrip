'use client';

// Compact pager. Renders nothing for a single page.
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Window of pages around the current one.
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button className="btn-secondary px-3 py-2" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`btn px-3.5 py-2 ${p === page ? 'bg-primary text-white' : 'text-ink hover:bg-surface-2'}`}
        >
          {p}
        </button>
      ))}
      <button className="btn-secondary px-3 py-2" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
    </nav>
  );
}
