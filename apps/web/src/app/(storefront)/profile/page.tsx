'use client';
import { useEffect, useRef, useState } from 'react';
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
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName({ firstName: user.firstName ?? '', lastName: user.lastName ?? '' });
      setAvatarPreview(user.avatarUrl ?? null);
    }
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

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.upload<{ avatarUrl: string }>('/profile/avatar', fd);
      setAvatarPreview(res.avatarUrl);
      await refresh();
      notify('Avatar updated', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify('Image must be under 5MB', 'error');
      return;
    }
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    uploadAvatar(file);
  };

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

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
        {/* Avatar + Name form */}
        <form onSubmit={saveName} className="card space-y-4 p-6 bg-surface-2 border-border rounded-2xl">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent">// 01_account_details</h2>

          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-border transition-colors hover:border-primary/50"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-3 text-xl font-bold text-muted">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </button>
            <div>
              <p className="text-sm font-medium text-ink">Profile photo</p>
              <p className="text-[10px] text-faint">Click to upload. JPG, PNG up to 5MB.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>

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
