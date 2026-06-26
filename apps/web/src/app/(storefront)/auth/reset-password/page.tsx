'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Read the ?token= from the reset link without useSearchParams.
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, password }, { skipRefresh: true });
      setDone(true);
      setTimeout(() => router.replace('/auth/login'), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset your password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-px py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-ink font-mono">// choose_new_password</h1>
        {done ? (
          <div className="card mt-6 p-6 bg-surface-2 border-border rounded-2xl">
            <p className="text-ink font-mono text-sm">Your password has been updated. Redirecting you to sign in…</p>
          </div>
        ) : !token ? (
          <div className="card mt-6 p-6 bg-surface-2 border-border rounded-2xl">
            <p className="text-ink font-mono text-sm">// Error: This reset link is missing its token.</p>
            <Link href="/auth/forgot-password" className="btn border border-border bg-surface text-ink hover:bg-surface-3 inline-flex h-11 items-center justify-center font-mono text-xs rounded-xl px-5 mt-4 transition-all active:scale-[0.98]">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card mt-6 space-y-5 p-6 bg-surface-2 border-border rounded-2xl">
            {error && <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger font-mono">// Error: {error}</p>}
            <div>
              <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="password">New password</label>
              <input id="password" type="password" autoComplete="new-password" required minLength={8} className="input h-[52px] font-mono" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="mt-1 text-[9px] text-faint font-mono">// Min 8 characters. Signs out other sessions.</p>
            </div>
            <button className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full h-[60px] lg:h-12 flex items-center justify-center font-mono text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-40" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
