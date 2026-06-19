import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchJSON } from '@/lib/server-api';
import { ProductJsonLd } from '@/components/seo/JsonLd';
import { ImageGallery } from '@/components/product/ImageGallery';
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel';
import { ReviewList } from '@/components/product/ReviewList';
import type { Product, StoreSettings } from '@/types';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  const res = await fetchJSON<{ product: Product }>(`/products/${slug}`);
  return res?.product ?? null;
}

// Per-page dynamic SEO (Phase 6): title/description/canonical/OG from product data.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product not found' };
  const description = product.shortDescription ?? product.description ?? `${product.name} — genuine, warrantied.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [product, settings] = await Promise.all([
    getProduct(params.slug),
    fetchJSON<StoreSettings>('/store-settings'),
  ]);
  if (!product) notFound();

  const specs = Object.entries(product.specs ?? {});

  return (
    <div className="container-px py-8">
      <ProductJsonLd product={product} currency={settings?.currency ?? 'INR'} />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link> ·{' '}
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {product.categorySlug && (
          <>
            {' '}·{' '}
            <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-ink">
              {product.categoryName}
            </Link>
          </>
        )}{' '}
        · <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ImageGallery images={product.images ?? []} name={product.name} />
        <ProductPurchasePanel product={product} />
      </div>

      {/* Description + specs */}
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {product.description && (
          <div>
            <h2 className="text-xl font-bold text-ink">About this part</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{product.description}</p>
          </div>
        )}
        {specs.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-ink">Specifications</h2>
            <dl className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {specs.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 px-4 py-3 odd:bg-surface-2">
                  <dt className="text-sm font-medium capitalize text-muted">{key.replace(/_/g, ' ')}</dt>
                  <dd className="text-sm text-ink">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <ReviewList productId={product.id} />
    </div>
  );
}
