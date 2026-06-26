import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchJSON } from '@/lib/server-api';
import { BundleCardClient } from './BundleCardClient';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Productivity Bundles for Students & Freelancers | FocusKit',
  description:
    'Save with curated student, freelancer, budgeting, and desk setup bundles that combine digital templates, stationery, and desk tools from FocusKit.',
  alternates: { canonical: `${SITE_URL}/bundles` },
  openGraph: {
    title: 'Productivity Bundles for Students & Freelancers | FocusKit',
    description:
      'Save with curated student, freelancer, budgeting, and desk setup bundles that combine digital templates, stationery, and desk tools from FocusKit.',
    url: `${SITE_URL}/bundles`,
    siteName: 'FocusKit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Productivity Bundles for Students & Freelancers | FocusKit',
    description:
      'Save with curated student, freelancer, budgeting, and desk setup bundles that combine digital templates, stationery, and desk tools from FocusKit.',
  },
};

const BUNDLE_SLUGS = [
  'student-starter-kit',
  'freelancer-admin-kit',
  'budget-reset-kit',
  'desk-reset-kit',
  'wfh-setup-kit',
];

const BUNDLE_INFO: Record<string, { title: string; description: string; idealFor: string[]; savings: string }> = {
  'student-starter-kit': {
    title: 'Student Starter Kit',
    description: 'Kickstart your semester with a Notion Student Dashboard, Habit Tracker Printables, and a Student Planner Notebook — all in one curated kit.',
    idealFor: ['College students', 'University learners', 'Anyone starting a new semester'],
    savings: '33%',
  },
  'freelancer-admin-kit': {
    title: 'Freelancer Admin Kit',
    description: 'Run your freelance business with confidence — Invoice Pack, Content Calendar, and Canva Instagram Templates in one bundle.',
    idealFor: ['Freelancers', 'Solo business owners', 'Content creators'],
    savings: '29%',
  },
  'budget-reset-kit': {
    title: 'Budget Reset Kit',
    description: 'Take control of your money with the Notion Finance Tracker, Budget Spreadsheet, and Printable Expense Tracker.',
    idealFor: ['Students on a budget', 'Freelancers tracking income', 'Anyone wanting to save more'],
    savings: '37%',
  },
  'desk-reset-kit': {
    title: 'Desk Reset Kit',
    description: 'Transform your workspace with a Cable Management Box, Phone Stand, and Keyboard Cleaning Kit.',
    idealFor: ['Remote workers', 'Students with messy desks', 'Anyone working from home'],
    savings: '26%',
  },
  'wfh-setup-kit': {
    title: 'Work-from-Home Setup Kit',
    description: 'Upgrade your home office with a Desk Tray, Memo Board, Quote Mug, and Productivity Journal.',
    idealFor: ['Work-from-home professionals', 'Remote employees', 'Home office upgraders'],
    savings: '25%',
  },
};

async function getBundleProduct(slug: string) {
  const res = await fetchJSON<{ product: Product }>(`/products/${slug}`);
  return res?.product ?? null;
}

export default async function BundlesPage() {
  const bundleProducts = await Promise.all(BUNDLE_SLUGS.map(getBundleProduct));
  const validBundles = bundleProducts.filter(Boolean) as Product[];

  return (
    <div className="container-px py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Productivity bundles
        </h1>
        <p className="mt-3 text-lg text-muted">
          Save money with curated kits that combine our best digital templates, printables, and desk accessories.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {validBundles.map((bundle) => {
          const info = BUNDLE_INFO[bundle.slug];
          const specs = bundle.specs ?? {};
          const includes = Array.isArray(specs.includes) ? (specs.includes as string[]) : [];
          const discount = bundle.compareAtPrice && bundle.compareAtPrice > bundle.basePrice
            ? Math.round(((bundle.compareAtPrice - bundle.basePrice) / bundle.compareAtPrice) * 100)
            : 0;

          return (
            <article
              key={bundle.id}
              className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="inline-block rounded-full bg-primary/15 px-4 py-1 text-xs font-semibold text-primary">
                      Bundle Deal
                    </span>
                    {discount > 0 && (
                      <span className="ml-2 inline-block rounded-full bg-success/15 px-4 py-1 text-xs font-semibold text-success">
                        Save {info?.savings}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <Link href={`/shop/${bundle.slug}`}>
                  <h2 className="text-xl font-bold text-ink transition-colors group-hover:text-primary">
                    {bundle.name}
                  </h2>
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {bundle.shortDescription || info?.description}
                </p>

                {includes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-faint">Includes</p>
                    <ul className="mt-2 space-y-1.5">
                      {includes.map((item: string) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-muted">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {info?.idealFor && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-faint">Ideal for</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {info.idealFor.map((tag) => (
                        <span key={tag} className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">{formatCurrency(bundle.basePrice)}</span>
                    {bundle.compareAtPrice && bundle.compareAtPrice > bundle.basePrice && (
                      <span className="text-sm text-faint line-through">{formatCurrency(bundle.compareAtPrice)}</span>
                    )}
                  </div>
                  <BundleCardClient bundle={bundle} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
