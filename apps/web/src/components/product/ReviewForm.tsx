'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

// Review composer. Split out of ReviewList so the list stays a pure renderer and
// the form owns its own draft state. Rating is a click-to-set star row (clearer
// than a <select>); the server decides the verified-purchase badge, not us.
export function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const { notify } = useToast();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', { productId, rating, title: title || undefined, body: body || undefined });
      notify('Thanks — your review is posted.', 'success');
      setTitle('');
      setBody('');
      setRating(5);
      onSubmitted();
    } catch {
      notify('Could not post your review. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const shown = hover || rating;

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div>
        <span className="label mb-2">Your rating</span>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <svg
                viewBox="0 0 24 24"
                className={cn('h-6 w-6 transition-colors', n <= shown ? 'text-accent' : 'text-border-strong')}
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="m12 2 2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <input
        className="input"
        placeholder="Summary (optional) — e.g. “Hit rated 6000MT/s on my B650”"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
      />
      <textarea
        className="input min-h-[90px]"
        placeholder="What stood out — speed, fit, temps, value? Did it work on your board?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
      />
      <button className="btn-primary" disabled={submitting}>
        {submitting ? 'Posting…' : 'Post review'}
      </button>
    </form>
  );
}
