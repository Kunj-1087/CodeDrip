'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

// Editing this single row rebrands the storefront (HARD INVARIANT #6: white-label
// is config/data only). Saving reloads so the new brand colors re-apply via
// StoreContext immediately.
interface Settings {
  store_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  currency: string;
  support_email: string | null;
  support_phone: string | null;
  address: string | null;
  meta_description: string | null;
  social_links: Record<string, string>;
}

export default function AdminSettings() {
  const { notify } = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ settings: Settings }>('/admin/settings').then((r) => setS(r.settings)).catch(() => undefined);
  }, []);

  if (!s) return <div className="p-8 text-muted">Loading…</div>;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((cur) => (cur ? { ...cur, [k]: v } : cur));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', {
        storeName: s.store_name,
        logoUrl: s.logo_url || null,
        faviconUrl: s.favicon_url || null,
        primaryColor: s.primary_color,
        secondaryColor: s.secondary_color,
        accentColor: s.accent_color,
        currency: s.currency,
        supportEmail: s.support_email || null,
        supportPhone: s.support_phone || null,
        address: s.address || null,
        metaDescription: s.meta_description || null,
        socialLinks: s.social_links ?? {},
      });
      notify('Settings saved — applying new branding…', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Store settings</h1>
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save settings'}</button>
      </div>
      <p className="mt-1 text-sm text-muted">Rebrand the whole storefront here — no code changes needed.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-ink">Identity</h2>
          <div>
            <label className="label">Store name</label>
            <input className="input" value={s.store_name} onChange={(e) => set('store_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Logo URL</label>
              <input className="input" value={s.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)} />
            </div>
            <div>
              <label className="label">Favicon URL</label>
              <input className="input" value={s.favicon_url ?? ''} onChange={(e) => set('favicon_url', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Currency code</label>
            <input className="input w-32" value={s.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} />
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-ink">Brand colors</h2>
          {([['primary_color', 'Primary'], ['secondary_color', 'Secondary'], ['accent_color', 'Accent']] as const).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={s[key]}
                onChange={(e) => set(key, e.target.value)}
                className="h-10 w-14 rounded border border-border"
                aria-label={label}
              />
              <div className="flex-1">
                <label className="label">{label}</label>
                <input className="input font-mono" value={s[key]} onChange={(e) => set(key, e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-ink">Support & contact</h2>
          <div>
            <label className="label">Support email</label>
            <input className="input" value={s.support_email ?? ''} onChange={(e) => set('support_email', e.target.value)} />
          </div>
          <div>
            <label className="label">Support phone</label>
            <input className="input" value={s.support_phone ?? ''} onChange={(e) => set('support_phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" value={s.address ?? ''} onChange={(e) => set('address', e.target.value)} />
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold text-ink">SEO & social</h2>
          <div>
            <label className="label">Meta description</label>
            <textarea className="input" value={s.meta_description ?? ''} onChange={(e) => set('meta_description', e.target.value)} />
          </div>
          {(['twitter', 'instagram', 'youtube'] as const).map((net) => (
            <div key={net}>
              <label className="label capitalize">{net}</label>
              <input
                className="input"
                value={s.social_links?.[net] ?? ''}
                onChange={(e) => set('social_links', { ...(s.social_links ?? {}), [net]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
