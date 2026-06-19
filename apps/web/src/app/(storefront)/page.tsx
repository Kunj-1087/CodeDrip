import Link from 'next/link';
import { fetchJSON } from '@/lib/server-api';
import { ProductCard } from '@/components/ui/ProductCard';
import { HomeJsonLd } from '@/components/seo/JsonLd';
import type { Product, Category, StoreSettings } from '@/types';

// Home is a Server Component: catalog data is fetched server-side for fast first
// paint and crawlable content. Interactive bits (add-to-cart) are client islands.
export const dynamic = 'force-dynamic';

const CATEGORY_BLURBS: Record<string, string> = {
  ram: 'DDR4 and DDR5 kits with the timings and capacities on the label — not a mystery.',
  ssd: 'NVMe and SATA drives rated by real sequential speed, not best-case marketing.',
  hdd: 'High-capacity drives for backups, NAS, and media — CMR where it matters.',
  accessories: 'The cables, paste, and enclosures that quietly make the build work.',
};

const FAQS = [
  {
    q: 'Will this RAM actually run at its rated speed on my board?',
    a: 'Rated speeds need XMP (Intel) or EXPO (AMD) enabled in BIOS, and your motherboard has to support that frequency. Every kit lists its profile and form factor — match those to your board’s QVL and you’re set.',
  },
  {
    q: 'NVMe or SATA SSD — does it matter for me?',
    a: 'For boot drives and big file transfers, NVMe (PCIe) is several times faster. For reviving an old laptop with a 2.5" bay, SATA is the right fit. We label interface and form factor on every drive so you don’t guess.',
  },
  {
    q: 'Are these genuine, warrantied parts?',
    a: 'Yes. Everything is sourced direct or through authorized distribution, with the manufacturer’s warranty intact. The warranty term is listed in each product’s specs.',
  },
  {
    q: 'How fast does it ship?',
    a: 'In-stock orders placed before 3 PM ship the same business day, with delivery typically in 2–5 days depending on your pin code.',
  },
  {
    q: 'Can I return a part if it’s not compatible?',
    a: 'Unopened parts can be returned within 7 days. If a sealed item arrives DOA, we cross-ship a replacement — you shouldn’t wait on an RMA to get your machine running.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Ordered a 990 PRO at 9 AM, it shipped the same day, and it benchmarked exactly at the rated 7450 MB/s. No drama.',
    name: 'Karthik R.',
    role: 'Built a Ryzen 7 editing rig',
  },
  {
    quote: 'The spec sheet told me the SODIMM was the right form factor for my ThinkPad before I bought it. It just worked.',
    name: 'Meera S.',
    role: 'Upgraded a ThinkPad T14',
  },
  {
    quote: 'Bought 4 Red Plus drives for a NAS. All CMR as listed, all healthy in SMART. Exactly what I needed.',
    name: 'Devendra P.',
    role: 'Home NAS, 32TB raw',
  },
];

export default async function HomePage() {
  const [featured, trending, categoriesRes, settings] = await Promise.all([
    fetchJSON<{ products: Product[] }>('/products/featured'),
    fetchJSON<{ products: Product[] }>('/products/trending'),
    fetchJSON<{ categories: Category[] }>('/categories'),
    fetchJSON<StoreSettings>('/store-settings'),
  ]);

  const categories = categoriesRes?.categories ?? [];

  return (
    <>
      <HomeJsonLd settings={settings} />

      {/* Hero — dark "deep space" panel with a subtle circuit-trace pattern. */}
      <section className="relative overflow-hidden bg-secondary text-white">
        <CircuitPattern />
        <div className="container-px relative py-20 md:py-28">
          <div className="max-w-2xl animate-slide-up">
            <p className="eyebrow text-white/55">RAM · SSD · HDD · Accessories</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              The parts your build has been waiting for.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">
              RAM, SSDs, and HDDs from brands that don’t cut corners. Precision-engineered storage and memory for
              uncompromised performance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop?category=ram" className="btn-primary px-6 py-3 text-base">
                Shop RAM <span aria-hidden>→</span>
              </Link>
              <Link href="/shop" className="btn border border-white/25 px-6 py-3 text-base text-white hover:bg-white/10">
                Browse all parts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category strip — icon tiles with live product counts. */}
      <section className="container-px relative z-10 -mt-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="card group flex items-center gap-3 p-5 transition-[box-shadow,border-color] hover:border-primary/40 hover:shadow-card-hover"
            >
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-md bg-surface-2 text-muted group-hover:text-primary">
                <CategoryIcon slug={c.slug} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink">{c.name}</span>
                <span className="block text-sm text-muted">{c.productCount ?? 0} products</span>
              </span>
              <span className="ml-auto text-muted transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Category blurbs */}
      <section className="container-px py-14">
        <h2 className="text-2xl font-bold text-ink">Shop by what you’re building</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="card p-6 transition-shadow hover:shadow-card-hover">
              <h3 className="text-lg font-semibold text-ink">{c.name}</h3>
              <p className="mt-2 text-sm text-muted">{CATEGORY_BLURBS[c.slug] ?? c.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">Browse {c.name} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured?.products && featured.products.length > 0 && (
        <section className="container-px py-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-ink">Featured this week</h2>
            <Link href="/shop?featured=true" className="text-sm font-medium text-primary">
              See all →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="container-px py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            ['Specs on the label', 'Capacity, speed, interface and form factor on every product — no decoding required.'],
            ['Genuine & warrantied', 'Authorized stock with the manufacturer warranty intact, term listed per item.'],
            ['Same-day dispatch', 'Order in-stock parts before 3 PM and they leave the same business day.'],
          ].map(([title, body]) => (
            <div key={title} className="card p-6">
              <h3 className="font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      {trending?.products && trending.products.length > 0 && (
        <section className="container-px py-6">
          <h2 className="text-2xl font-bold text-ink">What builders are buying</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {trending.products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="container-px py-14">
        <h2 className="text-2xl font-bold text-ink">From people who read the spec sheet</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card p-6">
              <blockquote className="text-sm leading-relaxed text-ink">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold text-ink">{t.name}</span>
                <span className="block text-muted">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-px py-14">
        <h2 className="text-2xl font-bold text-ink">Questions worth answering before you buy</h2>
        <div className="mx-auto mt-6 max-w-3xl divide-y divide-border">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none font-medium text-ink marker:content-none">
                <span className="flex items-center justify-between">
                  {f.q}
                  <span className="text-muted transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

// Subtle circuit-trace background for the hero — pure SVG, low opacity, not a photo.
function CircuitPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.07]"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="circuit" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M0 32h20m0 0v20m0-20a4 4 0 1 0 8 0 4 4 0 0 0-8 0m12 0h32M48 0v20m0 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0 8v36"
            fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)" />
    </svg>
  );
}

// Minimal line icons per category, so the strip reads as hardware, not clip-art.
function CategoryIcon({ slug }: { slug: string }) {
  const common = { className: 'h-5 w-5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75 } as const;
  switch (slug) {
    case 'ram':
      return (
        <svg {...common}><rect x="2" y="7" width="20" height="10" rx="1" /><path d="M6 17v2M10 17v2M14 17v2M18 17v2M6 10v4M10 10v4M14 10v4M18 10v4" /></svg>
      );
    case 'ssd':
      return (
        <svg {...common}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h6" /><circle cx="17" cy="14" r="1" /></svg>
      );
    case 'hdd':
      return (
        <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" /><path d="m16 16 3 3" /></svg>
      );
    default:
      return (
        <svg {...common}><path d="M4 9a3 3 0 0 1 3-3h2a3 3 0 0 1 0 6H7" /><path d="M20 15a3 3 0 0 1-3 3h-2a3 3 0 0 1 0-6h2" /><path d="M9 12h6" /></svg>
      );
  }
}
