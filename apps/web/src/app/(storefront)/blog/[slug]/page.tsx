import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { starterPosts } from '@/lib/blog-seed';
import { fetchJSON } from '@/lib/server-api';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Product } from '@/types';
import ShareButtonsClient from './ShareButtonsClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface Props {
  params: {
    slug: string;
  };
}

async function getPost(slug: string) {
  return starterPosts.find((p) => p.slug === slug) || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post Not Found | CodeDrip' };

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: `${post.title} | CodeDrip Blog`,
    description: post.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: `${post.title} | CodeDrip Blog`,
      description: post.excerpt,
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | CodeDrip Blog`,
      description: post.excerpt,
    },
  };
}

function parseHeadings(body: string) {
  const headings: { text: string; id: string; level: number }[] = [];
  const lines = body.split('\n');
  lines.forEach((line) => {
    const match = line.trim().match(/^(##|###)\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ text, id, level });
    }
  });
  return headings;
}

function renderBodyContent(body: string) {
  return body.split('\n\n').map((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('## ')) {
      const text = trimmed.substring(3).trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return (
        <h2 key={index} id={id} className="text-2xl font-bold text-ink mt-8 mb-4 border-b border-border pb-2 scroll-mt-20">
          {text}
        </h2>
      );
    }
    if (trimmed.startsWith('### ')) {
      const text = trimmed.substring(4).trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return (
        <h3 key={index} id={id} className="text-xl font-bold text-ink mt-6 mb-3 scroll-mt-20">
          {text}
        </h3>
      );
    }
    if (trimmed.match(/^\d+\.\s+/)) {
      const items = trimmed.split('\n').map((li) => li.replace(/^\d+\.\s+/, '').trim());
      return (
        <ol key={index} className="list-decimal pl-6 my-4 space-y-2 text-muted leading-relaxed">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    }
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const items = trimmed.split('\n').map((li) => li.replace(/^[\*\-]\s+/, '').trim());
      return (
        <ul key={index} className="list-disc pl-6 my-4 space-y-2 text-muted leading-relaxed">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={index} className="text-muted leading-relaxed my-4 whitespace-pre-wrap">
        {trimmed}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const headings = parseHeadings(post.body);

  // Map Blog Category to store product category queries
  let queryCategory = '';
  if (post.category === 'Notion Guides') queryCategory = 'notion-templates';
  else if (post.category === 'Desk Setup') queryCategory = 'desk-accessories';
  else if (post.category === 'Student Life') queryCategory = 'student-planners';
  else if (post.category === 'Planner Guides') queryCategory = 'printable-planners';
  else if (post.category === 'Productivity Tips') queryCategory = 'journals-notebooks';

  const relatedProductsRes = await fetchJSON<{ products: Product[] }>(
    `/products?category=${queryCategory}&limit=4`
  );
  const relatedProducts = relatedProductsRes?.products ?? [];

  const relatedPosts = starterPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ];

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: new Date(post.date).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CodeDrip',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <div className="container-px py-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />

      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link> ·{' '}
        <Link href="/blog" className="hover:text-ink">Blog</Link> ·{' '}
        <span className="text-ink truncate max-w-[200px] inline-block align-bottom">{post.title}</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
            {post.category}
          </span>
          <span className="text-xs text-muted">{post.readTime}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink max-w-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted max-w-3xl leading-relaxed">{post.excerpt}</p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{post.author}</span>
            <span className="text-muted text-sm">·</span>
            <time className="text-sm text-muted" dateTime={post.date}>
              {post.date}
            </time>
          </div>
          <ShareButtonsClient title={post.title} />
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-4">
        <aside className="lg:col-span-1 lg:sticky lg:top-24 h-fit max-h-[80vh] overflow-y-auto">
          {headings.length > 0 && (
            <div className="rounded-xl border border-border bg-surface-2 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">
                Table of Contents
              </h4>
              <nav className="space-y-2">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block text-sm text-muted hover:text-primary transition-colors leading-snug ${
                      h.level === 3 ? 'pl-4 text-xs' : ''
                    }`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </aside>

        <main className="lg:col-span-3 prose dark:prose-invert max-w-none">
          <div className="markdown-body">{renderBodyContent(post.body)}</div>
        </main>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-border pt-12">
          <h3 className="text-2xl font-bold text-ink mb-6">Related Products</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section className="mt-16 border-t border-border pt-12">
          <h3 className="text-2xl font-bold text-ink mb-6">Recommended Reading</h3>
          <div className="grid gap-6 sm:grid-cols-3">
            {relatedPosts.map((rp) => (
              <div
                key={rp.slug}
                className="rounded-xl border border-border bg-surface p-5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                    {rp.category}
                  </span>
                  <h4 className="font-bold text-ink mt-2 leading-snug hover:text-primary transition-colors">
                    <Link href={`/blog/${rp.slug}`}>{rp.title}</Link>
                  </h4>
                  <p className="text-xs text-muted mt-2 line-clamp-3 leading-relaxed">
                    {rp.excerpt}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted">
                  <span>{rp.readTime}</span>
                  <time>{rp.date}</time>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
