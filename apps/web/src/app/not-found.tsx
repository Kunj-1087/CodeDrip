import Link from 'next/link';

// Global 404. Human copy, not "404 - Not Found".
export default function NotFound() {
  return (
    <div className="container-px flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Page not found</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">We couldn’t find that page</h1>
      <p className="mt-2 max-w-md text-muted">
        The link may be old or the product may have sold out. Let’s get you back to parts that are in stock.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-secondary px-6 py-3">Go home</Link>
        <Link href="/shop" className="btn-primary px-6 py-3">Browse products</Link>
      </div>
    </div>
  );
}
