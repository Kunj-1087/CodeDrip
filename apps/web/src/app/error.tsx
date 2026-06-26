'use client';
// Route-level error boundary (App Router). Catches render/runtime errors in any
// page under the root layout and shows a calm, on-brand recovery screen instead
// of a white crash. `reset()` re-renders the failed segment without a full reload.
import { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface to the console in dev; in prod this is where Sentry.captureException
    // would go once error tracking is wired up.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Logo size="lg" className="mb-8" />
      <p className="eyebrow text-danger">500 — Something went wrong</p>
      <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-ink">
        That’s on us, not on you.
      </h1>
      <p className="mt-3 max-w-md text-muted">
        An unexpected error interrupted this page. You can try again, or head back to the store while we look into it.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-faint">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset} className="btn-primary px-6 py-3 text-base">
          Try again
        </button>
        <Link href="/" className="btn-secondary px-6 py-3 text-base">
          Back to home
        </Link>
      </div>
    </div>
  );
}
