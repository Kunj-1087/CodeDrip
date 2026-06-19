'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

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
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-px py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-muted">It takes a minute. Your cart comes with you.</p>

        <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="firstName">First name</label>
              <input id="firstName" required className="input" value={form.firstName} onChange={set('firstName')} />
            </div>
            <div>
              <label className="label" htmlFor="lastName">Last name</label>
              <input id="lastName" required className="input" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required className="input" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8} className="input" value={form.password} onChange={set('password')} />
            <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
          </div>
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
