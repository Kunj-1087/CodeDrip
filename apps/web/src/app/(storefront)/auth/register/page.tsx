'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      // Consume ?redirect= so users who were sent here from a protected route
      // via the login page link are taken back to where they need to go.
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-px py-16">
      <div className="mx-auto max-w-md">
        <Logo size="lg" className="mb-8" />
        <h1 className="text-3xl font-bold tracking-tight text-ink font-mono">git init —account</h1>
        <p className="mt-2 text-muted font-mono">Takes 30 seconds. Your staging branches are saved.</p>

        <form onSubmit={submit} className="card mt-6 space-y-5 p-6 bg-surface-2 border-border rounded-2xl shadow-sm">
          {error && <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger font-mono">// Error: {error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="firstName">First name</label>
              <input id="firstName" required autoComplete="given-name" className="input h-[52px] font-mono" value={form.firstName} onChange={set('firstName')} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="lastName">Last name</label>
              <input id="lastName" required autoComplete="family-name" className="input h-[52px] font-mono" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required className="input h-[52px] font-mono" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8} className="input h-[52px] font-mono" value={form.password} onChange={set('password')} />
            <p className="mt-1 text-[9px] text-faint font-mono">// Min length: 8 characters.</p>
          </div>
          <button className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full h-[60px] lg:h-12 flex items-center justify-center font-mono text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-40" disabled={busy}>
            {busy ? 'Initializing…' : 'git init'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted font-mono">
          Already authenticated?{' '}
          <Link href="/auth/login" className="font-medium text-primary font-mono">Authenticate</Link>
        </p>
      </div>
    </div>
  );
}
