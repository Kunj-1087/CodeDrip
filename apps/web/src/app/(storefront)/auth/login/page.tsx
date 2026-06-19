'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [redirect, setRedirect] = useState('/');

  // Read ?redirect= without useSearchParams (avoids a Suspense boundary).
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('redirect');
    if (r) setRedirect(r);
  }, []);

  // If already signed in, bounce away from the login page.
  useEffect(() => {
    if (status === 'authenticated') router.replace(redirect);
  }, [status, redirect, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      router.replace(user.role === 'admin' && redirect === '/' ? '/admin' : redirect);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign you in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-px py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-muted">Sign in to track orders and check out faster.</p>

        <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="password">Password</label>
              <Link href="/auth/forgot-password" className="text-sm text-primary">Forgot?</Link>
            </div>
            <input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          New here?{' '}
          <Link href="/auth/register" className="font-medium text-primary">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
