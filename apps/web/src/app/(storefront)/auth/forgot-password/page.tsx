'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // The API always responds 200 (it never reveals whether an email exists),
    // so we can show the same confirmation regardless.
    await api.post('/auth/forgot-password', { email }, { skipRefresh: true }).catch(() => undefined);
    setSent(true);
    setBusy(false);
  };

  return (
    <div className="container-px py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
        {sent ? (
          <div className="card mt-6 p-6">
            <p className="text-ink">If <strong>{email}</strong> is registered, a reset link is on its way.</p>
            <p className="mt-2 text-sm text-muted">
              The link is valid for 30 minutes. In local dev with no SMTP configured, the link is printed to the API
              console.
            </p>
            <Link href="/auth/login" className="btn-secondary mt-4 inline-flex">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
            <p className="text-sm text-muted">Enter your email and we’ll send a link to set a new password.</p>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
