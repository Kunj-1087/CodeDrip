import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchJSON } from '@/lib/server-api';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { ImageGallery } from '@/components/product/ImageGallery';
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel';
import { ReviewList } from '@/components/product/ReviewList';
import { StickyBottomBar } from '@/components/product/StickyBottomBar';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Product, StoreSettings } from '@/types';

import ShareButtonsClient from '../../blog/[slug]/ShareButtonsClient';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function getProduct(slug: string) {
  const res = await fetchJSON<{ product: Product }>(`/products/${slug}`);
  return res?.product ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product Not Found | FocusKit' };

  // Generate dynamic description based on product type
  const productType = product.specs?.product_type ?? '';
  const descExtras = productType ? ` Type: ${productType}.` : '';
  const description = `Buy ${product.name} online in India${descExtras} Price: ₹${product.basePrice}. Fast shipping. Student-friendly productivity tools.`;

  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(product.name)}&price=${product.basePrice}&image=${encodeURIComponent(product.imageUrl || '')}`;
  const canonicalUrl = `${SITE_URL}/shop/${product.slug}`;

  return {
    title: `${product.name} | FocusKit`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: `${product.name} | FocusKit`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${product.name} — Buy Online | FocusKit`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — Buy Online | FocusKit`,
      description,
      images: [ogImageUrl],
      creator: '@focuskit',
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [product, settings] = await Promise.all([
    getProduct(params.slug),
    fetchJSON<StoreSettings>('/store-settings'),
  ]);
  if (!product) notFound();

  // Fetch related products of the same category, excluding the current product
  const relatedProductsRes = product.categorySlug
    ? await fetchJSON<{ products: Product[] }>(`/products?category=${product.categorySlug}&limit=5`).catch(() => null)
    : null;
  const relatedProducts = relatedProductsRes?.products.filter((p) => p.id !== product.id).slice(0, 4) ?? [];

  const specs = Object.entries(product.specs ?? {});
  const productType = product.specs?.product_type ?? '';
  const useCase = product.specs?.use_case ?? '';
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    ...(product.categorySlug && product.categoryName
      ? [{ name: product.categoryName, url: `/shop?category=${product.categorySlug}` }]
      : []),
    { name: product.name, url: `/shop/${product.slug}` },
  ];

  return (
    <div className="container-px py-10">
      <ProductJsonLd product={product} currency={settings?.currency ?? 'INR'} />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <nav className="mb-8 text-xs text-muted font-mono tracking-wider whitespace-nowrap overflow-x-auto scrollbar-none flex items-center" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary transition-colors">~</Link>
        <span className="mx-2 text-faint">/</span>
        <Link href="/shop" className="hover:text-primary transition-colors">shop</Link>
        {product.categorySlug && (
          <>
            <span className="mx-2 text-faint">/</span>
            <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-primary transition-colors">
              {product.categorySlug}
            </Link>
          </>
        )}
        <span className="mx-2 text-faint">/</span>
        <span className="text-white">{product.slug}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ImageGallery images={product.images ?? []} name={product.name} />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <ProductPurchasePanel product={product} />

          {/* Product type badges */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            {productType && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-[10px] font-bold text-primary uppercase tracking-wide">
                type: {productType}
              </span>
            )}
            {useCase && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 font-mono text-[10px] font-bold text-accent uppercase tracking-wide">
                scope: {useCase}
              </span>
            )}
          </div>

          <div className="border-t border-white/5 pt-4">
            <ShareButtonsClient title={product.name} />
          </div>
        </div>
      </div>

      {/* Description + specs as VS Code Editors */}
      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        {product.description && (
          <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden shadow-lg">
            {/* Editor Top Bar */}
            <div className="flex items-center gap-1.5 border-b border-border bg-surface/50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] opacity-80" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] opacity-80" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] opacity-80" />
              <span className="ml-2.5 font-mono text-xs text-muted">README.md</span>
            </div>
            
            <div className="p-6">
              <div className="whitespace-pre-line leading-relaxed text-sm text-muted font-mono">{product.description}</div>

              {/* Deployment/Shipping status box */}
              <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
                <div className="pointer-events-none absolute -right-6 -bottom-6 h-16 w-16 rounded-full bg-primary/10 blur-xl" />
                <div className="flex items-center gap-2 text-sm font-semibold text-primary font-mono">
                  <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                  status: compiled & shipped
                </div>
                <p className="mt-2.5 text-xs text-muted font-sans leading-relaxed">
                  In-stock sizes ship within 2–3 business days. Delivery typically takes 5–8 days across India.
                </p>
                <p className="mt-2 text-[10px] text-faint font-mono">// unworn items eligible for 7-day returns</p>
              </div>
            </div>
          </div>
        )}
        
        {specs.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden shadow-lg">
            {/* Editor Top Bar */}
            <div className="flex items-center gap-1.5 border-b border-border bg-surface/50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] opacity-80" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] opacity-80" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] opacity-80" />
              <span className="ml-2.5 font-mono text-xs text-muted">package.json</span>
            </div>
            
            {/* Syntax Highlighted JSON display */}
            <div className="p-6 font-mono text-xs md:text-sm overflow-x-auto text-ink bg-surface/20">
              <span className="text-danger">{`{`}</span>
              <div className="pl-4 space-y-1.5 my-1">
                {specs.map(([key, value], idx) => (
                  <div key={key}>
                    <span className="text-success">"{key.replace(/_/g, '_')}"</span>
                    <span className="text-ink">: </span>
                    <span className="text-info">"{String(value)}"</span>
                    {idx < specs.length - 1 && <span className="text-ink">,</span>}
                  </div>
                ))}
              </div>
              <span className="text-danger">{`}`}</span>
            </div>
          </div>
        )}
      </div>

      {/* FAQ Accordion styled as terminal */}
      <section className="mt-16 mx-auto max-w-3xl rounded-2xl border border-border bg-surface-2 overflow-hidden shadow-lg">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between border-b border-border bg-surface/50 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56] opacity-80" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e] opacity-80" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f] opacity-80" />
            <span className="ml-2.5 font-mono text-xs text-muted">bash --login</span>
          </div>
          <span className="font-mono text-[9px] text-faint">v1.2.0</span>
        </div>
        
        <div className="p-6 divide-y divide-border">
          <p className="font-mono text-xs text-faint mb-4">$ man ./product_faq</p>
          {[
            {
              q: 'How fast will this ship?',
              a: 'In-stock sizes ship within 2–3 business days. Delivery typically takes 5–8 days across India.',
            },
            {
              q: 'Can I return this?',
              a: 'Unworn shirts can be returned within 7 days of delivery in original condition. See our returns page.',
            },
            {
              q: 'What material is this?',
              a: 'Material details are listed in the specs above. All our tees are premium cotton.',
            },
          ].map((faq) => (
            <details key={faq.q} className="group py-4">
              <summary className="cursor-pointer list-none text-xs md:text-sm font-semibold text-white marker:content-none font-mono">
                <span className="flex items-center justify-between gap-4">
                  <span className="hover:text-primary transition-colors">$ get_info --query "{faq.q.toLowerCase().slice(0, -1)}"</span>
                  <span className="shrink-0 text-muted transition-transform group-open:rotate-45 text-base">+</span>
                </span>
              </summary>
              <p className="mt-3 text-xs md:text-sm leading-relaxed text-muted font-sans pl-3 border-l border-primary/30">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <ReviewList productId={product.id} />

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-white/5 pt-10">
          <p className="font-mono text-xs uppercase tracking-wider text-primary">// related.dependencies</p>
          <h2 className="text-xl font-bold font-sans text-white mb-6">Related Products</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {relatedProducts.map((p) => (
              <div key={p.id} className="w-[280px] shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <StickyBottomBar product={product} />
    </div>
  );
}
