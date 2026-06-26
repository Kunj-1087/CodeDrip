import type { Metadata } from 'next';
import { fetchJSON } from '@/lib/server-api';
import type { StoreSettings } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Contact / File an Issue | CodeDrip',
  description: 'Contact CodeDrip for help with product questions, shipping, orders, refunds, and developer merch.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact / File an Issue | CodeDrip',
    description: 'Contact CodeDrip for help with product questions, shipping, orders, refunds, and developer merch.',
    url: `${SITE_URL}/contact`,
    siteName: 'CodeDrip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact / File an Issue | CodeDrip',
    description: 'Contact CodeDrip for help with product questions, shipping, orders, refunds, and developer merch.',
  },
};

function ContactPageJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact CodeDrip Support',
    description: 'Contact CodeDrip for help with product questions, shipping, orders, refunds, and developer merch.',
    url: `${SITE_URL}/contact`,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// Server component so support details are crawlable and rendered without a client
// round-trip. Details come from the store_settings row (single source of truth).
export default async function ContactPage() {
  const settings = await fetchJSON<StoreSettings>('/store-settings').catch(() => null);
  const email = settings?.supportEmail ?? 'hello@codedrip.dev';
  const phone = settings?.supportPhone;
  const address = settings?.address;

  return (
    <div className="container-px py-12 md:py-16">
      <ContactPageJsonLd />
      <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">Contact &amp; support</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Questions about an order, returns, or a product? We read every message and reply fast during
        business hours (Mon–Sat, 10 AM–7 PM IST).
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <a href={`mailto:${email}`} className="card group p-6 transition-shadow hover:shadow-sm">
          <p className="eyebrow">Email</p>
          <p className="mt-2 font-semibold text-ink transition-colors group-hover:text-primary">{email}</p>
          <p className="mt-1 text-sm text-muted">Best for order and return queries.</p>
        </a>

        {phone && (
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="card group p-6 transition-shadow hover:shadow-sm">
            <p className="eyebrow">Phone</p>
            <p className="mt-2 font-semibold text-ink transition-colors group-hover:text-primary">{phone}</p>
            <p className="mt-1 text-sm text-muted">Mon–Sat, 10 AM–7 PM IST.</p>
          </a>
        )}

        <div className="card p-6">
          <p className="eyebrow">Track an order</p>
          <p className="mt-2 font-semibold text-ink">Order updates</p>
          <p className="mt-1 text-sm text-muted">
            View status anytime under{' '}
            <a href="/orders" className="text-primary hover:underline">
              My orders
            </a>
            .
          </p>
        </div>
      </div>

      {address && (
        <div className="mt-8 max-w-xl">
          <p className="eyebrow">Registered address</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{address}</p>
        </div>
      )}

      <div className="mt-10 rounded-lg border border-border bg-surface-2 p-5 text-sm text-muted">
        Looking for policies? See our{' '}
        <a href="/refund-policy" className="text-primary hover:underline">Return &amp; Refund Policy</a>,{' '}
        <a href="/terms-of-service" className="text-primary hover:underline">Terms</a>, and{' '}
        <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
      </div>
    </div>
  );
}
