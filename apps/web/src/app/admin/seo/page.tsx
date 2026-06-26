'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function SeoAdminPage() {
  const { notify } = useToast();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve product count from the public paginated catalogue
    api.get<{ pagination: { total: number } }>('/products?limit=1')
      .then((res) => {
        setProductCount(res.pagination.total);
      })
      .catch(() => {
        setProductCount(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    notify(message, 'success');
  };

  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  const robotsUrl = `${SITE_URL}/robots.txt`;
  const launchUrl = `${SITE_URL}/launch`;

  const robotsTxtPreview = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /checkout
Disallow: /profile
Disallow: /orders

Sitemap: ${sitemapUrl}
Crawl-delay: 1`;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">SEO & Search Console Diagnostics</h1>
          <p className="text-sm text-muted">Manage sitemap indices, crawl configurations, and campaign launch metrics.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Sitemap Diagnostics */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Sitemap Indices</h2>
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Sitemap XML URL</p>
              <div className="mt-1 flex items-center justify-between gap-4 rounded-md border border-border bg-surface-3 p-2.5">
                <a
                  href={sitemapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-mono text-primary hover:underline"
                >
                  {sitemapUrl}
                </a>
                <button
                  onClick={() => copyToClipboard(sitemapUrl, 'Sitemap URL copied')}
                  className="btn-secondary h-8 px-3 text-xs whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <p className="eyebrow">Dynamic Products</p>
                <p className="mt-1.5 text-2xl font-bold text-ink">
                  {loading ? '...' : productCount}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <p className="eyebrow">Static Pages</p>
                <p className="mt-1.5 text-2xl font-bold text-ink">10</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={sitemapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 text-center justify-center py-2 text-sm"
              >
                View Sitemap XML
              </a>
            </div>
          </div>
        </div>

        {/* Robots.txt Configuration */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Robots.txt Output</h2>
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Live Configuration Preview</p>
              <pre className="mt-2 block rounded-lg border border-border bg-surface-3 p-3.5 font-mono text-xs text-muted overflow-x-auto leading-relaxed">
                {robotsTxtPreview}
              </pre>
            </div>
            <div className="flex gap-2">
              <a
                href={robotsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 text-center justify-center py-2 text-sm"
              >
                View Live Robots.txt
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Launch Campaign */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-ink mb-2">Campaign Launch Landing Page</h2>
        <p className="text-sm text-muted mb-4">
          A dedicated standalone landing page designed for Product Hunt launches, newsletter backlinks, and social media campaigns.
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between rounded-md border border-border bg-surface-3 p-3">
          <div className="truncate">
            <p className="eyebrow">Launch Page Link</p>
            <a
              href={launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-primary hover:underline truncate block mt-0.5"
            >
              {launchUrl}
            </a>
          </div>
          <div className="flex gap-2 whitespace-nowrap">
            <button
              onClick={() => copyToClipboard(launchUrl, 'Launch URL copied')}
              className="btn-secondary h-9 px-4 text-sm"
            >
              Copy Link
            </button>
            <a
              href={launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary h-9 px-4 text-sm flex items-center justify-center"
            >
              View Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
