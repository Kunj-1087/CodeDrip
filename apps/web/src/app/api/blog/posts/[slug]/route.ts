import { NextResponse } from 'next/server';
import { starterPosts } from '@/lib/blog-seed';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const post = starterPosts.find((p) => p.slug === params.slug);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  return NextResponse.json({ post });
}
