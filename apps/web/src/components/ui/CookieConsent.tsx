'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'codedrip_cookie_consent';

// GDPR-style consent banner. Essential cookies (auth, cart, theme) always run;
// this gates only optional/analytics cookies. The choice is persisted so the
// banner shows once. We render nothing until mounted to avoid a hydration
// mismatch (server can't know localStorage state).
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* private mode / storage blocked — just don't show the banner */
    }
  }, []);

  const choose = (choice: 'accepted' | 'essential') => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
    // When analytics is wired up later, initialise it here only if choice === 'accepted'.
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[95] p-4"
    >
      <div className="container-px">
        <div className="animate-slide-up flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            We use essential cookies to keep you signed in and remember your cart. With your consent we also use
            analytics cookies to improve the store. See our{' '}
            <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex flex-shrink-0 gap-2">
            <button onClick={() => choose('essential')} className="btn-secondary h-10 px-4 text-sm">
              Essential only
            </button>
            <button onClick={() => choose('accepted')} className="btn-primary h-10 px-4 text-sm">
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
