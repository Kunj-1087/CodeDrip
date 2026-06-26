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
      <h2 className="text-xl font-bold tracking-tight text-ink">
        Reviews{reviews.length > 0 && <span className="ml-2 text-base font-medium text-muted">({reviews.length})</span>}
      </h2>

      <div className="mt-4">
        {status === 'authenticated' ? (
          <ReviewForm productId={productId} onSubmitted={load} />
        ) : (
          <p className="text-sm text-muted">Sign in to leave a review. Verified purchases get a badge.</p>
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
