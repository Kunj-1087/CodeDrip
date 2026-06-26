import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FocusKit Launch Campaign | FocusKit',
  description: 'Join the launch of FocusKit — the productivity marketplace for students, creators, and freelancers.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LaunchCampaignPage() {
  return (
    <div className="container-px py-16 max-w-5xl mx-auto">
      {/* Product Hunt / Launch Badge */}
      <div className="flex justify-center mb-8">
        <a
          href="https://www.producthunt.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-full border border-[#FF6154] bg-[#FF6154]/10 px-5 py-2.5 text-[#FF6154] hover:bg-[#FF6154]/15 transition-all group scale-105"
        >
          <svg className="h-6 w-6 fill-[#FF6154] group-hover:scale-110 transition-transform" viewBox="0 0 40 40">
            <path d="M20 0C9.0 0 0 9.0 0 20s9.0 20 20 20 20-9.0 20-20S31.0 0 20 0zm0 29.3c-1.3 0-2.3-1.0-2.3-2.3s1.0-2.3 2.3-2.3 2.3 1.0 2.3 2.3-1.0 2.3-2.3 2.3zm4.5-9.3c-1.0 1.2-2.5 1.9-4.5 1.9H16V12h4c2.0 0 3.5.7 4.5 1.9 1.0 1.2 1.5 2.8 1.5 4.6.0 1.8-.5 3.4-1.5 4.5z" />
          </svg>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider leading-none">Featured on</p>
            <p className="text-sm font-extrabold leading-tight">Product Hunt</p>
          </div>
        </a>
      </div>

      <header className="mb-16 text-center max-w-3xl mx-auto">
        <span className="text-xs uppercase font-extrabold tracking-widest text-primary bg-primary-light px-3 py-1.5 rounded-full">
          Special PH Launch Offer
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight mt-4 leading-tight">
          FocusKit: Digital Planners, Stationery & Desk Tools for Focused Days
        </h1>
        <p className="mt-6 text-lg text-muted leading-relaxed">
          Notion templates, student planners, printable stationery, journals, and desk accessories — curated for
          students, creators, freelancers, and anyone who wants a more organized day.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="btn-primary px-8 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all">
            Explore Catalog
          </Link>
          <Link href="/shop?category=productivity-bundles" className="btn border border-border-strong px-8 py-3 rounded-xl font-semibold hover:bg-surface-3 transition-all">
            View Bundle Deals
          </Link>
        </div>
      </header>

      {/* Stats Counter */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {[
          { count: '30+', label: 'Curated Products' },
          { count: 'Instant', label: 'Digital Downloads' },
          { count: '100%', label: 'Student-Friendly' },
          { count: '7-Day', label: 'Easy Returns' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm hover:border-primary/30 transition-colors">
            <p className="text-3xl font-extrabold text-primary tracking-tight">{stat.count}</p>
            <p className="text-xs text-muted font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Highlights Grid */}
      <section className="border-t border-border pt-16">
        <h2 className="text-2xl font-bold text-ink text-center mb-12">What makes FocusKit different?</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center text-primary mb-4 font-bold">✦</div>
            <h3 className="font-bold text-ink text-lg mb-2">Digital + Physical</h3>
            <p className="text-sm text-muted leading-relaxed">
              We curate both digital templates and physical desk essentials — so you can organize your workflow
              and your workspace from one place.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center text-primary mb-4 font-bold">✦</div>
            <h3 className="font-bold text-ink text-lg mb-2">Student-First Pricing</h3>
            <p className="text-sm text-muted leading-relaxed">
              All our products are priced with students and freelancers in mind. Digital templates start at just ₹999
              and bundles offer up to 37% savings.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center text-primary mb-4 font-bold">✦</div>
            <h3 className="font-bold text-ink text-lg mb-2">Instant Downloads</h3>
            <p className="text-sm text-muted leading-relaxed">
              All digital products are available as instant downloads. Start using your Notion templates,
              spreadsheets, or printable planners within minutes of purchase.
            </p>
          </div>
        </div>
      </section>

      {/* Footer / Backlink */}
      <footer className="mt-20 border-t border-border pt-8 text-center text-xs text-faint">
        <p>This launch campaign is active for Product Hunt backers. Excluded from generic search engine indices.</p>
        <p className="mt-2">Made by FocusKit India 🇮🇳</p>
      </footer>
    </div>
  );
}
