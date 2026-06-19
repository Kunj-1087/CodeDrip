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
        <h1 className="text-2xl font-bold text-ink">Choose a new password</h1>
        {done ? (
          <div className="card mt-6 p-6">
            <p className="text-ink">Your password has been updated. Redirecting you to sign in…</p>
          </div>
        ) : !token ? (
          <div className="card mt-6 p-6">
            <p className="text-ink">This reset link is missing its token.</p>
            <Link href="/auth/forgot-password" className="btn-secondary mt-4 inline-flex">Request a new link</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div>
              <label className="label" htmlFor="password">New password</label>
              <input id="password" type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="mt-1 text-xs text-muted">At least 8 characters. This signs you out of other sessions.</p>
            </div>
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
