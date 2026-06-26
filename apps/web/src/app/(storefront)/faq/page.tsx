import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'FAQ | Shipping, Returns & Products | CodeDrip',
  description:
    'Find answers about CodeDrip developer t-shirts, shipping pipeline latency, revert/return logs, and global api deployments.',
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: 'FAQ | Shipping, Returns & Products | CodeDrip',
    description:
      'Find answers about CodeDrip developer t-shirts, shipping pipeline latency, revert/return logs, and global api deployments.',
    url: `${SITE_URL}/faq`,
    siteName: 'CodeDrip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Shipping, Returns & Products | CodeDrip',
    description:
      'Find answers about CodeDrip developer t-shirts, shipping pipeline latency, revert/return logs, and global api deployments.',
  },
};

const FAQS = [
  {
    q: 'Are these actual physical threads, or are you selling me NFTs?',
    a: 'No cap, these are 100% real, high-quality physical cotton tees. Zero digital wearables, zero gas fees, and absolutely no NFTs. Just premium 180 GSM cotton delivered straight to your real-world coordinates.',
  },
  {
    q: 'What is the latency on the shipping pipeline?',
    a: 'We optimize for low latency. In-stock sizes get dispatched within 48-72 hours (faster than you can fix a merge conflict). Delivery takes 5-8 business days across India. Check your email for the tracking endpoint.',
  },
  {
    q: 'Can I git revert / rollback my order?',
    a: 'If the fit is buggy, you can initiate a rollback (return) within 7 days of delivery. Just keep it in pristine, un-deployed condition (unworn, tags attached) and we will process the refund API.',
  },
  {
    q: 'Is your shipping API globally deployed?',
    a: 'Right now, our delivery pipeline is geo-restricted to India. Global distribution is currently sitting in the backlog, but we are working on scaling our shipping cluster soon.',
  },
  {
    q: 'How do I tail the logs for my package status?',
    a: 'Easy. As soon as your package drops, we\'ll email you a tracking URL. You can stream the real-time shipping logs directly from the "Orders" tab in your profile.',
  },
  {
    q: 'How is the checkout shipping fee calculated?',
    a: 'Free tier starts at orders above ₹500. Otherwise, there\'s a flat rate of ₹199 for lower-value carts. No hidden subscription fees or microtransactions.',
  },
  {
    q: 'What is the packaging spec?',
    a: 'We ship zero-plastic packages. Every tee is wrapped in eco-friendly kraft paper and sealed with plastic-free cardboard padding because we care about the environment stack.',
  },
];

function FAQPageJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function FAQPage() {
  return (
    <div className="container-px py-12 md:py-16">
      <FAQPageJsonLd />
      <div className="mx-auto max-w-3xl animate-slide-up">
        <p className="font-mono text-xs uppercase tracking-wider text-primary">// man codedrip</p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl font-sans mt-1">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted font-sans">
          Everything you need to know about our threads, shipping latency, and revert rollbacks.
        </p>

        <div className="mt-10 divide-y divide-white/5 border-t border-b border-white/5">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="cursor-pointer list-none font-medium text-white marker:content-none font-mono text-sm sm:text-base">
                <span className="flex items-center justify-between gap-4">
                  <span className="hover:text-primary transition-colors">$ man {faq.q.slice(0, -1).toLowerCase()}</span>
                  <span className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-45 font-mono text-lg">+</span>
                </span>
              </summary>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-muted font-sans pl-2 border-l border-primary/20">{faq.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-6 text-center glass-panel">
          <h2 className="text-lg font-semibold text-white font-sans">Still have questions?</h2>
          <p className="mt-1 text-xs md:text-sm text-muted font-sans">
            Our support pipeline is open. Open an issue or drop us a query and we will patch a response back within 24 hours.
          </p>
          <Link href="/contact" className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white px-6 py-2.5 text-xs font-mono rounded-xl shadow-md transition-all active:scale-[0.98] mt-4 inline-flex">
            ~/contact-support
          </Link>
        </div>
      </div>
    </div>
  );
}
