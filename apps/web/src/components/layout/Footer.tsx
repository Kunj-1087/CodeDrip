'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';

export function Footer() {
  const { settings } = useStore();
  const { notify } = useToast();
  const [email, setEmail] = useState('');

  const name = settings?.storeName ?? 'OursCart';

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-px grid gap-10 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-ink">{name}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Real specs, honest prices, and parts that actually fit. Memory and storage for builders who know what they
            need.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Shop</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/shop?category=ram" className="hover:text-ink">RAM</Link></li>
            <li><Link href="/shop?category=ssd" className="hover:text-ink">SSDs</Link></li>
            <li><Link href="/shop?category=hdd" className="hover:text-ink">Hard drives</Link></li>
            <li><Link href="/shop?category=accessories" className="hover:text-ink">Accessories</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Help</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/orders" className="hover:text-ink">Track an order</Link></li>
            {settings?.supportEmail && (
              <li><a href={`mailto:${settings.supportEmail}`} className="hover:text-ink">{settings.supportEmail}</a></li>
            )}
            {settings?.supportPhone && <li><span>{settings.supportPhone}</span></li>}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Get a heads-up on price drops</p>
          <p className="mb-3 text-sm text-muted">New stock and genuine deals. No spam, unsubscribe anytime.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEmail('');
              notify('Thanks — we’ll email you when prices move.', 'success');
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              className="input"
            />
            <button className="btn-primary whitespace-nowrap">Notify me</button>
          </form>
        </div>
      </div>

      <div className="border-t border-border py-6">
        <div className="container-px flex flex-col items-center justify-between gap-2 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <p>Built for people who read the spec sheet.</p>
        </div>
      </div>
    </footer>
  );
}
