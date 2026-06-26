import Link from 'next/link';
import type { Metadata } from 'next';
import { starterPosts } from '@/lib/blog-seed';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Productivity Guides, Notion Tips & Desk Setup Ideas | CodeDrip Blog',
  description:
    'Read the latest productivity guides, Notion template tutorials, desk setup inspiration, and student life tips from the CodeDrip team.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    title: 'Productivity Guides, Notion Tips & Desk Setup Ideas | CodeDrip Blog',
    description: 'Read the latest productivity guides, Notion template tutorials, desk setup inspiration, and student life tips from the CodeDrip team.',
  },
};

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Notion Guides', value: 'Notion Guides' },
  { label: 'Productivity Tips', value: 'Productivity Tips' },
  { label: 'Desk Setup', value: 'Desk Setup' },
  { label: 'Student Life', value: 'Student Life' },
  { label: 'Planner Guides', value: 'Planner Guides' },
];

interface Props {
  searchParams: {
    category?: string;
    page?: string;
  };
}

export default function BlogPage({ searchParams }: Props) {
  const selectedCategory = searchParams.category || '';
  const currentPage = parseInt(searchParams.page || '1', 10);
  const postsPerPage = 12;

  const filteredPosts = selectedCategory
    ? starterPosts.filter((post) => post.category === selectedCategory)
    : starterPosts;

  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <div className="container-px py-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink">CodeDrip Blog</h1>
        <p className="mt-3 text-lg text-muted">
          Productivity guides, Notion template tutorials, desk setup ideas, and tips for organized student life.
        </p>
      </div>

      <div className="mt-8 border-b border-border">
        <div className="flex flex-wrap gap-1 -mb-px">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            const queryParams = cat.value
              ? `?category=${encodeURIComponent(cat.value)}`
              : '';
            return (
              <Link
                key={cat.label}
                href={`/blog${queryParams}`}
                className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:border-border hover:text-ink'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>

      {paginatedPosts.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
            >
              <div className="aspect-[16/9] w-full bg-surface-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-surface-3 to-border flex items-center justify-center text-muted font-bold text-lg select-none">
                  {post.category}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted">{post.readTime}</span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-ink group-hover:text-primary transition-colors leading-tight">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted line-clamp-3 leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <div className="mt-5 border-t border-border pt-4 flex items-center justify-between text-xs text-muted">
                  <span>By {post.author.split(' (')[0]}</span>
                  <time dateTime={post.date}>{post.date}</time>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center text-muted">No posts found in this category.</div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const catParam = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : '';
            return (
              <Link
                key={pageNum}
                href={`/blog?page=${pageNum}${catParam}`}
                className={`grid h-10 w-10 place-items-center rounded-md border text-sm font-semibold transition-colors ${
                  currentPage === pageNum
                    ? 'border-primary bg-primary text-white'
                    : 'border-border text-ink hover:bg-surface-2'
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
