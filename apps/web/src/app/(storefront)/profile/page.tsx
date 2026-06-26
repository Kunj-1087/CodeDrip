'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, ApiError } from '@/lib/api';

export default function ProfilePage() {
  const { status, user, refresh } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState({ firstName: '', lastName: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setName({ firstName: user.firstName ?? '', lastName: user.lastName ?? '' });
  }, [user]);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch('/profile', name);
      await refresh();
      notify('Profile updated', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not update profile', 'error');
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch('/profile/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      notify('Password changed. Other sessions were signed out.', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not change password', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'anonymous') {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Sign in to manage your profile</h1>
        <Link href="/auth/login?redirect=/profile" className="btn-primary mt-6 inline-flex px-6 py-3">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-bold text-ink">Your profile</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveName} className="card space-y-4 p-6 bg-surface-2 border-border rounded-2xl">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent">// 01_account_details</h2>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="email">Email</label>
            <input id="email" className="input h-[52px] font-mono opacity-50 cursor-not-allowed" value={user?.email ?? ''} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="firstName">First name</label>
              <input id="firstName" className="input h-[52px] font-mono" autoComplete="given-name" value={name.firstName} onChange={(e) => setName((n) => ({ ...n, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="lastName">Last name</label>
              <input id="lastName" className="input h-[52px] font-mono" autoComplete="family-name" value={name.lastName} onChange={(e) => setName((n) => ({ ...n, lastName: e.target.value }))} />
            </div>
          </div>
          <button className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full sm:w-auto h-12 flex items-center justify-center font-mono text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-40" disabled={busy}>
            {busy ? 'Compiling…' : 'Save changes'}
          </button>
        </form>

        <form onSubmit={changePassword} className="card space-y-4 p-6 bg-surface-2 border-border rounded-2xl">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent">// 02_security_protocol</h2>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="current">Current password</label>
            <input id="current" type="password" className="input h-[52px] font-mono" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="new">New password</label>
            <input id="new" type="password" className="input h-[52px] font-mono" autoComplete="new-password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <button className="btn border border-white/10 bg-black/20 text-white hover:bg-white/[0.05] w-full sm:w-auto h-12 flex items-center justify-center font-mono text-xs rounded-xl transition-all active:scale-[0.98] disabled:opacity-40" disabled={busy}>
            {busy ? 'Verifying…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
