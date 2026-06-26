'use client';

import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'subscribed'>('idle');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      localStorage.setItem('codedrip_newsletter', JSON.stringify({ email, subscribedAt: new Date().toISOString() }));
    } catch {}
    setStatus('subscribed');
    setEmail('');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 flex max-w-md mx-auto gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="input flex-1"
      />
      <button type="submit" className="btn-primary whitespace-nowrap px-6">
        {status === 'subscribed' ? 'Subscribed!' : 'Join the List'}
      </button>
    </form>
  );
}
