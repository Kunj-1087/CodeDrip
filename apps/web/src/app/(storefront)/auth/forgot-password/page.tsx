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
        <h1 className="text-2xl font-bold text-ink font-mono">// reset_password_request</h1>
        {sent ? (
          <div className="card mt-6 p-6 bg-surface-2 border-border rounded-2xl">
            <p className="text-ink font-mono text-sm">If <strong>{email}</strong> is registered, a reset link is on its way.</p>
            <p className="mt-2 text-xs text-muted font-mono leading-relaxed">
              The link is valid for 30 minutes. In local dev with no SMTP configured, the link is printed to the API
              console.
            </p>
            <Link href="/auth/login" className="btn border border-border bg-surface text-ink hover:bg-surface-3 inline-flex h-11 items-center justify-center font-mono text-xs rounded-xl px-5 mt-4 transition-all active:scale-[0.98]">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card mt-6 space-y-5 p-6 bg-surface-2 border-border rounded-2xl">
            <p className="text-xs text-muted font-mono leading-relaxed">// Enter your email and we’ll send a link to set a new password.</p>
            <div>
              <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" required className="input h-[52px] font-mono" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full h-[60px] lg:h-12 flex items-center justify-center font-mono text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-40" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
