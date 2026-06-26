'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface GlobalSeo {
  metaTitleTemplate: string | null;
  defaultMetaDescription: string | null;
  ogDefaultImageUrl: string | null;
  gaTrackingId: string | null;
  fbPixelId: string | null;
  searchConsoleMeta: string | null;
  robotsTxt: string | null;
}

interface PageSeo {
  pageSlug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
}

export default function SeoAdminPage() {
  const { notify } = useToast();
  const [global, setGlobal] = useState<GlobalSeo | null>(null);
  const [pages, setPages] = useState<PageSeo[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'pages'>('global');

  useEffect(() => {
    api.get<{ global: GlobalSeo; pages: PageSeo[] }>('/admin/seo')
      .then((r) => { setGlobal(r.global); setPages(r.pages); })
      .catch(() => undefined);
  }, []);

  if (!global) return <div className="p-8 text-muted">Loading…</div>;

  const saveGlobal = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/seo', global);
      notify('SEO settings saved', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePage = async (slug: string, data: Partial<PageSeo>) => {
    try {
      await api.patch(`/admin/seo/pages/${slug}`, data);
      setPages((cur) => cur.map((p) => (p.pageSlug === slug ? { ...p, ...data } : p)));
      notify(`SEO for ${slug} saved`, 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save', 'error');
    }
  };

  const setGlobalField = <K extends keyof GlobalSeo>(key: K, value: GlobalSeo[K]) => {
    setGlobal((cur) => (cur ? { ...cur, [key]: value } : cur));
  };

  const setPageField = (slug: string, key: keyof PageSeo, value: string | null) => {
    setPages((cur) => cur.map((p) => (p.pageSlug === slug ? { ...p, [key]: value } : p)));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">SEO Management</h1>
          <p className="mt-1 text-sm text-muted">Configure global meta tags, search verification codes, and page-by-page SEO.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {(['global', 'pages'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab === 'global' ? 'Global Settings' : 'Page Metadata'}
          </button>
        ))}
      </div>

      {activeTab === 'global' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Meta templates */}
          <div className="card space-y-4 p-6">
            <h2 className="font-semibold text-ink">Meta Templates</h2>
            <div>
              <label className="label">Title template</label>
              <input
                className="input"
                value={global.metaTitleTemplate ?? ''}
                onChange={(e) => setGlobalField('metaTitleTemplate', e.target.value || null)}
                placeholder="e.g. {page} | CodeDrip"
              />
              <p className="mt-1 text-[10px] text-faint">Use {`{page}`} as a placeholder for the page or product name.</p>
            </div>
            <div>
              <label className="label">Default meta description</label>
              <textarea
                className="input"
                rows={3}
                value={global.defaultMetaDescription ?? ''}
                onChange={(e) => setGlobalField('defaultMetaDescription', e.target.value || null)}
                placeholder="Default description for pages without a custom one"
              />
            </div>
            <div>
              <label className="label">Default OG image URL</label>
              <input
                className="input"
                value={global.ogDefaultImageUrl ?? ''}
                onChange={(e) => setGlobalField('ogDefaultImageUrl', e.target.value || null)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Verification codes */}
          <div className="card space-y-4 p-6">
            <h2 className="font-semibold text-ink">Search & Analytics</h2>
            <div>
              <label className="label">Google Analytics Tracking ID</label>
              <input
                className="input font-mono"
                value={global.gaTrackingId ?? ''}
                onChange={(e) => setGlobalField('gaTrackingId', e.target.value || null)}
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="label">Facebook Pixel ID</label>
              <input
                className="input font-mono"
                value={global.fbPixelId ?? ''}
                onChange={(e) => setGlobalField('fbPixelId', e.target.value || null)}
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className="label">Google Search Console verification meta tag</label>
              <input
                className="input font-mono"
                value={global.searchConsoleMeta ?? ''}
                onChange={(e) => setGlobalField('searchConsoleMeta', e.target.value || null)}
                placeholder='<meta name="google-site-verification" content="..." />'
              />
              <p className="mt-1 text-[10px] text-faint">Paste the full meta tag from Google Search Console.</p>
            </div>
          </div>

          {/* Robots.txt */}
          <div className="card space-y-4 p-6 lg:col-span-2">
            <h2 className="font-semibold text-ink">Robots.txt</h2>
            <textarea
              className="input font-mono text-xs"
              rows={8}
              value={global.robotsTxt ?? ''}
              onChange={(e) => setGlobalField('robotsTxt', e.target.value || null)}
              placeholder={`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api`}
            />
            <div className="flex items-center gap-3">
              <a href={`${SITE_URL}/robots.txt`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                View live robots.txt
              </a>
              <span className="text-[10px] text-faint">Changes take effect after deployment.</span>
            </div>
          </div>

          {/* Sitemap info */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="mb-3 font-semibold text-ink">Sitemap</h2>
            <p className="text-sm text-muted">
              Your sitemap is auto-generated at{' '}
              <a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs">
                {SITE_URL}/sitemap.xml
              </a>
              {' '}and includes all active products and static pages.
            </p>
          </div>

          <div className="lg:col-span-2">
            <Button onClick={saveGlobal} loading={saving}>Save SEO settings</Button>
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="mt-6 space-y-4">
          {pages.length === 0 ? (
            <div className="card p-8 text-center text-muted">No page SEO entries found.</div>
          ) : (
            pages.map((p) => (
              <div key={p.pageSlug} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-ink">/{p.pageSlug}</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => savePage(p.pageSlug, { metaTitle: p.metaTitle, metaDescription: p.metaDescription, ogImageUrl: p.ogImageUrl })}
                  >
                    Save
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Meta title</label>
                    <input
                      className="input text-sm"
                      value={p.metaTitle ?? ''}
                      onChange={(e) => setPageField(p.pageSlug, 'metaTitle', e.target.value || null)}
                    />
                  </div>
                  <div>
                    <label className="label">OG image URL</label>
                    <input
                      className="input text-sm"
                      value={p.ogImageUrl ?? ''}
                      onChange={(e) => setPageField(p.pageSlug, 'ogImageUrl', e.target.value || null)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Meta description</label>
                    <textarea
                      className="input text-sm"
                      rows={2}
                      value={p.metaDescription ?? ''}
                      onChange={(e) => setPageField(p.pageSlug, 'metaDescription', e.target.value || null)}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
