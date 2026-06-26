'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';

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
        <Logo size="lg" className="mb-8" />
        <h1 className="text-3xl font-bold tracking-tight text-ink font-mono">Authenticate</h1>
        <p className="mt-2 text-muted font-mono">Sign in to track deployments and push to production faster.</p>

        <form onSubmit={submit} className="card mt-6 space-y-5 p-6 bg-surface-2 border-border rounded-2xl shadow-sm">
          {error && <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger font-mono">// Error: {error}</p>}
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required className="input h-[52px] font-mono" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono text-muted uppercase tracking-wider block" htmlFor="password">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-primary font-mono">[Forgot?]</Link>
            </div>
            <input id="password" type="password" autoComplete="current-password" required className="input h-[52px] font-mono" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full h-[60px] lg:h-12 flex items-center justify-center font-mono text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-40" disabled={busy}>
            {busy ? 'Authenticating…' : 'Authenticate'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted font-mono">
          New here?{' '}
          <Link href="/auth/register" className="font-medium text-primary font-mono">Register</Link>
        </p>
      </div>
    </div>
  );
}
