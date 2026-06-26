'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';

interface Settings {
  store_name: string;
  logo_url: string | null;
  logo_inverted_url: string | null;
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
  tax_rate: number;
  tax_inclusive: boolean;
  announcement_active: boolean;
  announcement_text: string | null;
  announcement_link: string | null;
  announcement_color: string | null;
}

type Tab = 'branding' | 'tax' | 'announcement' | 'shipping' | 'hero' | 'banners';

export default function AdminSettings() {
  const { notify } = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('branding');

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
        logoInvertedUrl: s.logo_inverted_url || null,
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
        taxRate: s.tax_rate,
        taxInclusive: s.tax_inclusive,
        announcementActive: s.announcement_active,
        announcementText: s.announcement_text || null,
        announcementLink: s.announcement_link || null,
        announcementColor: s.announcement_color || null,
      });
      notify('Settings saved', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'branding', label: 'Branding' },
    { key: 'tax', label: 'Tax' },
    { key: 'announcement', label: 'Announcement Bar' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'hero', label: 'Hero Slides' },
    { key: 'banners', label: 'Banners' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Store settings</h1>
        <Button onClick={save} loading={saving}>Save settings</Button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* BRANDING TAB */}
        {tab === 'branding' && (
          <div className="grid gap-6 lg:grid-cols-2">
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
                  <label className="label">Inverted logo URL (footer)</label>
                  <input className="input" value={s.logo_inverted_url ?? ''} onChange={(e) => set('logo_inverted_url', e.target.value)} placeholder="For dark backgrounds" />
                </div>
              </div>
              <div>
                <label className="label">Favicon URL</label>
                <input className="input" value={s.favicon_url ?? ''} onChange={(e) => set('favicon_url', e.target.value)} />
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
                  <input type="color" value={s[key]} onChange={(e) => set(key, e.target.value)} className="h-10 w-14 rounded border border-border" aria-label={label} />
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
                  <input className="input" value={s.social_links?.[net] ?? ''} onChange={(e) => set('social_links', { ...(s.social_links ?? {}), [net]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAX TAB */}
        {tab === 'tax' && (
          <div className="max-w-lg">
            <div className="card space-y-4 p-6">
              <h2 className="font-semibold text-ink">Tax Configuration</h2>
              <div>
                <label className="label">Tax rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="input w-32"
                  value={s.tax_rate}
                  onChange={(e) => set('tax_rate', parseFloat(e.target.value) || 0)}
                />
                <p className="mt-1 text-[10px] text-faint">Applied to all orders. Currently set to {s.tax_rate}%.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={s.tax_inclusive}
                  onChange={(e) => set('tax_inclusive', e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-0"
                />
                <div>
                  <span className="text-sm text-ink">Tax-inclusive pricing</span>
                  <p className="text-[10px] text-faint">When enabled, product prices already include tax.</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENT BAR TAB */}
        {tab === 'announcement' && (
          <div className="max-w-lg">
            <div className="card space-y-4 p-6">
              <h2 className="font-semibold text-ink">Announcement Bar</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={s.announcement_active}
                  onChange={(e) => set('announcement_active', e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-ink">Enable announcement bar</span>
              </label>
              {s.announcement_active && (
                <>
                  <div>
                    <label className="label">Announcement text</label>
                    <input className="input" value={s.announcement_text ?? ''} onChange={(e) => set('announcement_text', e.target.value)} placeholder="e.g. FREE SHIPPING ON ORDERS ABOVE ₹999" />
                  </div>
                  <div>
                    <label className="label">Link URL (optional)</label>
                    <input className="input" value={s.announcement_link ?? ''} onChange={(e) => set('announcement_link', e.target.value)} placeholder="/shop" />
                  </div>
                  <div>
                    <label className="label">Background color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={s.announcement_color ?? '#6363ff'} onChange={(e) => set('announcement_color', e.target.value)} className="h-10 w-14 rounded border border-border" />
                      <input className="input font-mono" value={s.announcement_color ?? ''} onChange={(e) => set('announcement_color', e.target.value)} placeholder="#6363ff" />
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="rounded-lg border border-border p-3 text-center text-sm font-medium text-white" style={{ backgroundColor: s.announcement_color || '#6363ff' }}>
                    {s.announcement_text || 'Your announcement text here'}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* SHIPPING TAB */}
        {tab === 'shipping' && <ShippingSettings />}

        {/* HERO SLIDES TAB */}
        {tab === 'hero' && <HeroSlidesSettings />}

        {/* BANNERS TAB */}
        {tab === 'banners' && <BannerSettings />}
      </div>
    </div>
  );
}

/* ── Shipping Methods (stored in store_settings as JSON) ── */
interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  isActive: boolean;
}

function ShippingSettings() {
  const { notify } = useToast();
  const [methods, setMethods] = useState<ShippingMethod[]>([
    { id: 'standard', name: 'Standard', description: 'Regular delivery', price: 199, estimatedDays: '5-8 business days', isActive: true },
    { id: 'express', name: 'Express', description: 'Faster delivery', price: 250, estimatedDays: '2-3 business days', isActive: true },
    { id: 'next-day', name: 'Next-Day', description: 'Next business day delivery', price: 500, estimatedDays: '1 business day', isActive: true },
  ]);
  const [saving, setSaving] = useState(false);

  const update = (id: string, field: keyof ShippingMethod, value: string | number | boolean) => {
    setMethods((cur) => cur.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const add = () => {
    const id = `method-${Date.now()}`;
    setMethods((cur) => [...cur, { id, name: 'New Method', description: '', price: 0, estimatedDays: '3-5 business days', isActive: true }]);
  };

  const remove = (id: string) => {
    setMethods((cur) => cur.filter((m) => m.id !== id));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', { shippingMethods: methods });
      notify('Shipping methods saved', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card divide-y divide-border">
        {methods.map((m) => (
          <div key={m.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <input className="input font-semibold" value={m.name} onChange={(e) => update(m.id, 'name', e.target.value)} />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" checked={m.isActive} onChange={(e) => update(m.id, 'isActive', e.target.checked)} className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0" />
                  Active
                </label>
                <button onClick={() => remove(m.id)} className="text-danger text-xs hover:underline">Remove</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Price (₹)</label>
                <input type="number" className="input" value={m.price} onChange={(e) => update(m.id, 'price', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Est. delivery</label>
                <input className="input" value={m.estimatedDays} onChange={(e) => update(m.id, 'estimatedDays', e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={m.description} onChange={(e) => update(m.id, 'description', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={add}>Add method</Button>
        <Button onClick={save} loading={saving}>Save shipping methods</Button>
      </div>
    </div>
  );
}

/* ── Hero Slides ── */
interface HeroSlide {
  id: string;
  imageUrl: string;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
  sortOrder: number;
  isActive: boolean;
}

function HeroSlidesSettings() {
  const { notify } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ slides: HeroSlide[] }>('/admin/hero-slides')
      .then((r) => setSlides(r.slides ?? []))
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, field: keyof HeroSlide, value: string | number | boolean) => {
    setSlides((cur) => cur.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const add = () => {
    const id = `slide-${Date.now()}`;
    setSlides((cur) => [...cur, { id, imageUrl: '', heading: 'New Slide', subheading: '', ctaText: 'Shop Now', ctaLink: '/shop', sortOrder: cur.length, isActive: true }]);
  };

  const remove = (id: string) => {
    setSlides((cur) => cur.filter((s) => s.id !== id));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSlides((cur) => { const n = [...cur]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n.map((s, i) => ({ ...s, sortOrder: i })); });
  };

  const moveDown = (idx: number) => {
    setSlides((cur) => { if (idx >= cur.length - 1) return cur; const n = [...cur]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n.map((s, i) => ({ ...s, sortOrder: i })); });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', { heroSlides: slides });
      notify('Hero slides saved', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-muted">Loading…</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      {slides.length === 0 && <p className="text-sm text-muted">No hero slides yet. Add one to get started.</p>}
      {slides.map((slide, idx) => (
        <div key={slide.id} className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted">Slide {idx + 1}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-xs text-muted hover:text-ink disabled:opacity-30">↑</button>
              <button onClick={() => moveDown(idx)} className="text-xs text-muted hover:text-ink disabled:opacity-30">↓</button>
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input type="checkbox" checked={slide.isActive} onChange={(e) => update(slide.id, 'isActive', e.target.checked)} className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0" />
                Active
              </label>
              <button onClick={() => remove(slide.id)} className="text-danger text-xs hover:underline">Remove</button>
            </div>
          </div>
          <div>
            <label className="label">Image URL</label>
            <input className="input" value={slide.imageUrl} onChange={(e) => update(slide.id, 'imageUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Heading</label>
              <input className="input" value={slide.heading} onChange={(e) => update(slide.id, 'heading', e.target.value)} />
            </div>
            <div>
              <label className="label">Subheading</label>
              <input className="input" value={slide.subheading} onChange={(e) => update(slide.id, 'subheading', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">CTA text</label>
              <input className="input" value={slide.ctaText} onChange={(e) => update(slide.id, 'ctaText', e.target.value)} />
            </div>
            <div>
              <label className="label">CTA link</label>
              <input className="input" value={slide.ctaLink} onChange={(e) => update(slide.id, 'ctaLink', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={add}>Add slide</Button>
        <Button onClick={save} loading={saving}>Save hero slides</Button>
      </div>
    </div>
  );
}

/* ── Banner Promotions ── */
interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  bgColor: string;
  isActive: boolean;
}

function BannerSettings() {
  const { notify } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ banners: Banner[] }>('/admin/banners')
      .then((r) => setBanners(r.banners ?? []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, field: keyof Banner, value: string | boolean) => {
    setBanners((cur) => cur.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const add = () => {
    const id = `banner-${Date.now()}`;
    setBanners((cur) => [...cur, { id, title: 'New Banner', description: '', imageUrl: '', linkUrl: '/shop', bgColor: '#6363ff', isActive: true }]);
  };

  const remove = (id: string) => {
    setBanners((cur) => cur.filter((b) => b.id !== id));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', { banners });
      notify('Banners saved', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-muted">Loading…</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      {banners.length === 0 && <p className="text-sm text-muted">No banners yet. Add one to get started.</p>}
      {banners.map((b) => (
        <div key={b.id} className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <input className="input font-semibold" value={b.title} onChange={(e) => update(b.id, 'title', e.target.value)} />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input type="checkbox" checked={b.isActive} onChange={(e) => update(b.id, 'isActive', e.target.checked)} className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0" />
                Active
              </label>
              <button onClick={() => remove(b.id)} className="text-danger text-xs hover:underline">Remove</button>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={b.description} onChange={(e) => update(b.id, 'description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Image URL</label>
              <input className="input" value={b.imageUrl} onChange={(e) => update(b.id, 'imageUrl', e.target.value)} />
            </div>
            <div>
              <label className="label">Link URL</label>
              <input className="input" value={b.linkUrl} onChange={(e) => update(b.id, 'linkUrl', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Background color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={b.bgColor} onChange={(e) => update(b.id, 'bgColor', e.target.value)} className="h-10 w-14 rounded border border-border" />
              <input className="input font-mono w-32" value={b.bgColor} onChange={(e) => update(b.id, 'bgColor', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={add}>Add banner</Button>
        <Button onClick={save} loading={saving}>Save banners</Button>
      </div>
    </div>
  );
}
