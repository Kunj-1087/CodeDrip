'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Review } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import { ReviewForm } from './ReviewForm';

// Pure renderer for a product's reviews + the composer (signed-in users only).
// Submitting reloads the list so a new/edited review shows immediately.
export function ReviewList({ productId }: { productId: string }) {
  const { status } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);

  const load = useCallback(() => {
    api
      .get<{ reviews: Review[] }>(`/reviews/product/${productId}`)
      .then((r) => setReviews(r.reviews))
      .catch(() => undefined);
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold tracking-tight text-ink font-mono uppercase">
        &lt;customer_feedback /&gt;{reviews.length > 0 && <span className="ml-2 text-xs font-normal text-muted">({reviews.length} logs)</span>}
      </h2>

      {/* Star Breakdown Summary Chart */}
      {reviews.length > 0 && (() => {
        const total = reviews.length;
        const counts = [0, 0, 0, 0, 0];
        let sum = 0;
        reviews.forEach((r) => {
          const star = Math.min(5, Math.max(1, Math.round(r.rating)));
          counts[star - 1]++;
          sum += r.rating;
        });
        const avg = (sum / total).toFixed(1);
        const starsArray = [5, 4, 3, 2, 1];

        return (
          <div className="grid gap-6 md:grid-cols-3 border border-white/5 bg-black/15 p-6 rounded-xl mt-4">
            <div className="flex flex-col items-center justify-center text-center border-b border-white/5 md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-6">
              <span className="text-4xl font-bold font-mono text-white leading-none">{avg}</span>
              <div className="mt-2.5">
                <StarRating value={parseFloat(avg)} />
              </div>
              <span className="mt-2 text-xs font-mono text-faint">system.avg_rating()</span>
            </div>
            <div className="md:col-span-2 space-y-2">
              {starsArray.map((s) => {
                const count = counts[s - 1];
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={s} className="flex items-center gap-3 text-xs font-mono text-muted">
                    <span className="w-12 text-right">{s} star</span>
                    <div className="h-2 flex-1 rounded bg-black/40 overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right tabular-nums">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="mt-6">
        {status === 'authenticated' ? (
          <ReviewForm productId={productId} onSubmitted={load} />
        ) : (
          <p className="text-xs text-muted font-mono">// Sign in to commit a review. Verified purchases gain tag badges.</p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">No reviews yet — be the first to share how this part performed.</p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} />
                {r.isVerifiedPurchase && <Badge tone="success">Verified purchase</Badge>}
              </div>
              {r.title && <h3 className="mt-2 font-semibold text-ink">{r.title}</h3>}
              {r.body && <p className="mt-1 text-sm text-muted">{r.body}</p>}
              <p className="mt-2 text-xs text-faint">
                {r.author} · {formatDate(r.createdAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
