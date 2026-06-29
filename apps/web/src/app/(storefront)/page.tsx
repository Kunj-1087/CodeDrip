import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJSON } from '@/lib/server-api';
import { ProductCard } from '@/components/ui/ProductCard';
import { NewsletterForm } from '@/components/ui/NewsletterForm';
import { HomeJsonLd } from '@/components/seo/JsonLd';
import type { Product, Category, StoreSettings } from '@/types';
import { HeroRightSide } from '@/components/product/HeroRightSide';
import { ScrollReveal, ScrollRevealItem } from '@/components/ui/ScrollReveal';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'CodeDrip | Premium Apparel for the Tech-Obsessed',
  description: 'Witty, clever, and uncomfortably relatable premium developer t-shirts. For coders who like their humor compiled and their sleeves rolled up. Free shipping across India.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'CodeDrip | Premium Developer Apparel',
    description: 'Witty, clever, and uncomfortably relatable premium developer t-shirts. For coders who like their humor compiled and their sleeves rolled up.',
    url: SITE_URL,
    siteName: 'CodeDrip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeDrip | Premium Developer Apparel',
    description: 'Witty, clever, and uncomfortably relatable premium developer t-shirts. For coders who like their humor compiled and their sleeves rolled up.',
  },
};

export const dynamic = 'force-dynamic';

const CATEGORY_BLURBS: Record<string, string> = {
  'developer-t-shirts': 'Clever tees for every stack, framework, and inside joke.',
  'limited-drops': 'Small-batch designs — ship before your next merge conflict.',
  'hoodies-outerwear': 'For late-night debugging and chilly server rooms.',
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
];

const TESTIMONIALS = [
  {
    quote: 'I wore "The Middleware" to a code review and my PR passed with zero comments. Correlation? I think not.',
    name: 'Rajat S.',
    role: 'Backend Engineer, Bengaluru',
  },
  {
    quote: 'The async/await shirt is dangerously accurate. I bought one for my entire sprint team.',
    name: 'Priya M.',
    role: 'Full-Stack Dev, Mumbai',
  },
  {
    quote: 'Finally a clothing brand that understands my unhealthy relationship with production deployments.',
    name: 'Amit K.',
    role: 'DevOps Lead, Pune',
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

      {/* Hero Section — Premium Mesh & Floating Mockup */}
      <section className="relative overflow-hidden border-b border-white/5 mesh-bg text-ink min-h-[90vh] md:min-h-[80vh] lg:min-h-screen flex items-center pt-24 pb-12 md:py-20 lg:py-32 noise-overlay">
        {/* Spotlight light beam / mouse glow simulation */}
        <div className="pointer-events-none absolute -left-1/4 -top-1/4 h-[70vw] w-[70vw] rounded-full bg-primary/[0.02] md:bg-primary/10 blur-[150px]" />
        <div className="pointer-events-none absolute -right-1/4 -bottom-1/4 h-[70vw] w-[70vw] rounded-full bg-accent/[0.02] md:bg-accent/5 blur-[150px]" />
        
        <div className="container-px relative z-10 grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="max-w-2xl animate-slide-up lg:col-span-7 text-center lg:text-left mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-xs text-primary shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>v1.0.0 Stable Drop Available</span>
            </div>
            
            <h1 className="mt-6 text-[2.5rem] xs:text-[3rem] sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight font-sans text-ink">
              CodeDrip.<br />
              <span className="text-gradient">Wear Your Code.</span>
            </h1>
            
            <p className="mt-6 max-w-xl text-sm md:text-base md:text-lg text-muted font-sans leading-relaxed line-clamp-2 lg:line-clamp-none mx-auto lg:mx-0">
              Witty, clever, and uncomfortably relatable t-shirts engineered for developers, designer geeks, and system admins. Free shipping across India.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start w-full sm:w-auto max-w-md sm:max-w-none mx-auto lg:mx-0">
              <Link 
                href="/shop" 
                className="btn w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white px-8 py-3.5 text-sm font-mono rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                git checkout shop/
              </Link>
              <Link
                href="/shop?category=limited-drops"
                className="btn w-full sm:w-auto border border-border bg-surface-2 hover:bg-surface-3 text-ink px-8 py-3.5 text-sm font-mono rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                cat drops.json
              </Link>
            </div>
          </div>
          
          {/* Floating Mockup Column */}
          <div className="relative flex justify-center lg:col-span-5">
            <HeroRightSide />
          </div>
        </div>
      </section>

      {/* Premium Bento Grid Categories Section */}
      <section className="container-px py-20">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">// category.list()</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink font-sans sm:text-4xl">Shop by developer stack</h2>
          </div>
        </ScrollReveal>
        
        <ScrollReveal staggerChildren className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.filter(c => CATEGORY_BLURBS[c.slug]).slice(0, 6).map((c, index) => {
            const label = index === 0 ? '01_featured' : `0${index + 1}_drop`;
            
            return (
              <ScrollRevealItem key={c.id}>
                <Link 
                  href={`/shop?category=${c.slug}`} 
                  className="group card glass-panel relative overflow-hidden p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 flex flex-col justify-between min-h-[220px] lg:col-span-1 h-full"
                >
                  {/* Background glow hover */}
                  <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all duration-300" />
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-xl bg-surface-3 p-3 text-ink border border-border group-hover:border-primary/30 transition-all">
                        <CategoryIcon slug={c.slug} />
                      </span>
                      <span className="font-mono text-[10px] text-faint group-hover:text-primary transition-colors">
                        {label}
                      </span>
                    </div>
                    
                    <h3 className="mt-6 text-xl font-bold text-ink font-sans tracking-tight group-hover:text-gradient transition-colors">
                      {c.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted font-sans max-w-md">
                      {CATEGORY_BLURBS[c.slug] ?? c.description}
                    </p>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary group-hover:text-accent transition-colors">
                      Explore namespace →
                    </span>
                    <span className="font-mono text-[10px] text-muted border border-border px-2 py-0.5 rounded">
                      package: {c.slug}
                    </span>
                  </div>
                </Link>
              </ScrollRevealItem>
            );
          })}
        </ScrollReveal>
      </section>

      {/* Featured / Top Sellers Grid */}
      {featured?.products && featured.products.length > 0 && (
        <section className="container-px py-10">
          <ScrollReveal>
            <div className="flex items-end justify-between border-b border-border pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-primary">// fetchFeatured(limit: 4)</p>
                <h2 className="mt-1 text-2xl font-bold text-ink font-sans">Top Sellers</h2>
              </div>
              <Link href="/shop?featured=true" className="font-mono text-xs font-semibold text-primary hover:text-accent transition-colors">
                [view all] →
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal staggerChildren className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.products.slice(0, 4).map((p) => (
              <ScrollRevealItem key={p.id}>
                <ProductCard product={p} />
              </ScrollRevealItem>
            ))}
          </ScrollReveal>
        </section>
      )}

      {/* Trending Grid */}
      {trending?.products && trending.products.length > 0 && (
        <section className="container-px py-10">
          <ScrollReveal>
            <div className="flex items-end justify-between border-b border-border pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-accent">// fetchTrending()</p>
                <h2 className="mt-1 text-2xl font-bold text-ink font-sans">Trending Drops</h2>
              </div>
              <Link href="/shop" className="font-mono text-xs font-semibold text-accent hover:text-primary transition-colors">
                [view all] →
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal staggerChildren className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {trending.products.slice(0, 4).map((p) => (
              <ScrollRevealItem key={p.id}>
                <ProductCard product={p} />
              </ScrollRevealItem>
            ))}
          </ScrollReveal>
        </section>
      )}

      {/* Deployment Pipeline (Trust Strip) */}
      <section className="container-px py-20">
        <ScrollReveal>
          <div className="text-center max-w-xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">// system.workflow</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink font-sans">Deployment Pipeline</h2>
            <p className="mt-2 text-sm text-muted">From staging layout commit straight to your physical closet.</p>
          </div>
        </ScrollReveal>
        
        <ScrollReveal staggerChildren className="mt-12 grid gap-6 sm:grid-cols-3 relative">
          {/* Connecting line */}
          <div className="absolute top-12 left-1/6 right-1/6 h-[1px] bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 hidden sm:block z-0" />
          
          {[
            ['git add', 'Browse our curated drops and stage your favorite commits. Each garment represents clean typography and geek culture.', '1'],
            ['git commit -m "buy"', 'Push to production checkout with details. We merge conflict-free, handle safe payments, and package with care.', '2'],
            ['git push origin main', 'Your shirt is printed, checked, and delivered. Track package route logs right from dashboard.', '3'],
          ].map(([title, desc, step]) => (
            <ScrollRevealItem key={step} className="h-full">
              <div className="card glass-panel relative p-8 text-center flex flex-col items-center hover:border-primary/30 transition-all z-10 h-full">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 border border-primary/30 text-sm font-bold text-primary font-mono animate-pulse-glow shadow-inner">
                  {step}
                </span>
                <h3 className="mt-6 text-lg font-bold text-ink font-sans">{title}</h3>
                <p className="mt-3 text-xs md:text-sm text-muted font-sans leading-relaxed">{desc}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollReveal>
      </section>

      {/* Premium Trust Cards */}
      <section className="container-px py-10">
        <ScrollReveal staggerChildren className="grid gap-6 sm:grid-cols-3">
          {[
            ['Free Shipping above ₹999', 'Flat shipping rate on smaller orders. No hidden fees. We believe in predictable, clear pricing logs.', '🚚'],
            ['100% Premium Cotton', 'Combed ring-spun cotton. Pre-shrunk. Because your code should shrink bugs, not your premium garments.', '🧶'],
            ['Designed by Coders', 'Every graphic is designed and tested by developers who actually write code. No fake code templates.', '💻'],
          ].map(([title, body, icon]) => (
            <ScrollRevealItem key={title} className="h-full">
              <div className="card glass-panel p-6 border-border hover:border-accent/30 transition-all h-full">
                <div className="text-2xl">{icon}</div>
                <h3 className="mt-4 font-bold text-ink font-sans">{title}</h3>
                <p className="mt-2 text-xs md:text-sm text-muted font-sans leading-relaxed">{body}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollReveal>
      </section>

      {/* Testimonials */}
      <section className="container-px py-16">
        <ScrollReveal>
          <div className="max-w-2xl border-l-2 border-primary pl-4">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">// social_proof.log</p>
            <h2 className="text-3xl font-bold tracking-tight text-ink font-sans">Reviews from the console</h2>
          </div>
        </ScrollReveal>
        <ScrollReveal staggerChildren className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <ScrollRevealItem key={t.name} className="h-full">
              <figure className="card glass-panel p-8 border-border hover:border-primary/20 transition-all flex flex-col justify-between h-full">
                <blockquote className="text-sm italic leading-relaxed text-muted font-sans">"{t.quote}"</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent grid place-items-center text-xs font-mono font-bold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <span className="block text-xs font-semibold text-ink font-sans">{t.name}</span>
                    <span className="block text-[10px] text-faint font-mono">{t.role}</span>
                  </div>
                </figcaption>
              </figure>
            </ScrollRevealItem>
          ))}
        </ScrollReveal>
      </section>

      {/* Newsletter capture */}
      <section className="container-px py-16">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-8 text-center md:p-12 glass-panel shadow-2xl relative overflow-hidden">
            <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />
            
            <p className="font-mono text-xs uppercase tracking-wider text-accent">~/subscribe-changelog</p>
            <h2 className="mt-2 text-2xl font-bold text-ink font-sans sm:text-3xl">Subscribe to the changelog</h2>
            <p className="mt-3 text-xs md:text-sm text-muted font-sans max-w-lg mx-auto">
              Get notified about small-batch drop announcements, restocks, and exclusive API keys (discount codes) before anyone else.
            </p>
            <NewsletterForm />
            <p className="mt-4 text-[10px] text-faint font-mono">No spam. We respect your inbox like we respect semicolons.</p>
          </div>
        </ScrollReveal>
      </section>

      {/* FAQ Section */}
      <section className="container-px py-16">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">// man codedrip</p>
            <h2 className="mt-1 text-2xl font-bold text-ink font-sans sm:text-3xl">Frequently Asked Questions</h2>
          </div>
        </ScrollReveal>
        
        <ScrollReveal staggerChildren className="mx-auto mt-8 max-w-3xl divide-y divide-border border-t border-b border-border">
          {FAQS.map((f) => (
            <ScrollRevealItem key={f.q}>
              <details className="group py-5">
                <summary className="cursor-pointer list-none font-medium text-ink marker:content-none font-mono text-sm">
                  <span className="flex items-center justify-between gap-4">
                    <span className="hover:text-primary transition-colors">$ man {f.q.slice(0, -1).toLowerCase()}</span>
                    <span className="text-muted transition-transform group-open:rotate-45 font-mono text-lg">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-xs md:text-sm leading-relaxed text-muted font-sans pl-2 border-l border-primary/20">{f.a}</p>
              </details>
            </ScrollRevealItem>
          ))}
        </ScrollReveal>
      </section>
    </>
  );
}

// Minimal line icons per category
function CategoryIcon({ slug }: { slug: string }) {
  const common = { className: 'h-6 w-6', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75 } as const;
  switch (slug) {
    case 'developer-t-shirts':
      return (
        <svg {...common}>
          <path d="M20.38 3.46L16 2.14 11.62 3.46c-.37.11-.62.45-.62.83v2.8c0 1.94-.93 3.75-2.5 4.9L3.5 15.5c-.32.24-.5.62-.5 1.02V20c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-3.48c0-.4-.18-.78-.5-1.02l-5-3.69c-1.57-1.16-2.5-2.96-2.5-4.9V4.29c0-.38-.25-.72-.62-.83z" />
          <path d="M9 16h6M12 12v8" />
        </svg>
      );
    case 'limited-drops':
      return (
        <svg {...common}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
        </svg>
      );
    case 'hoodies-outerwear':
      return (
        <svg {...common}>
          <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
          <path d="M12 4v4M12 12h.01M3 8h18" />
        </svg>
      );
    default:
      return (
        <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>
      );
  }
}
