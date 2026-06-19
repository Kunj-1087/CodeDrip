'use client';
import { useEffect, useState } from 'react';
import type { Review } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/format';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';

export function ReviewList({ productId }: { productId: string }) {
  const { status } = useAuth();
  const { notify } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api.get<{ reviews: Review[] }>(`/reviews/product/${productId}`).then((r) => setReviews(r.reviews)).catch(() => undefined);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', { productId, rating, title: title || undefined, body: body || undefined });
      notify('Thanks for the review!', 'success');
      setTitle('');
      setBody('');
      await load();
    } catch {
      notify('Could not post your review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-ink">Reviews</h2>

      {status === 'authenticated' ? (
        <form onSubmit={submit} className="card mt-4 space-y-3 p-5">
          <div>
            <label className="label" htmlFor="rating">
              Your rating
            </label>
            <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input w-auto">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <input className="input" placeholder="Summary (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="input min-h-[90px]"
            placeholder="What stood out — speed, fit, value?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button className="btn-primary" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post review'}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Sign in to leave a review. Verified purchases get a badge.
        </p>
      )}

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
              <p className="mt-2 text-xs text-muted">
                {r.author} · {formatDate(r.createdAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
