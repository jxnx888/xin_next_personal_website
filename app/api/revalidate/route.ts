/**
 * On-demand ISR revalidation endpoint.
 *
 * Requires ?secret=<REVALIDATE_SECRET> on every request.
 *
 * Usage
 * -----
 * Revalidate everything (all pages):
 *   GET /api/revalidate?secret=xxx&type=all
 *
 * Revalidate blog list only (both locales):
 *   GET /api/revalidate?secret=xxx
 *
 * Revalidate one post + its blog list (both locales):
 *   GET /api/revalidate?secret=xxx&slug=<notion-page-id>
 *
 * Supports POST as well for webhook integrations.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { BLOG_CONTENT_TAG, BLOG_INDEX_TAG, blogPostTag } from '@/lib/utils/notionBlog';
import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'zh'];

function authenticate(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret');
  return secret === process.env.REVALIDATE_SECRET;
}

// Article bodies are cached indefinitely (lib/utils/notionBlog.ts), so purging
// the rendered pages is not enough on its own — the cached Notion data has to be
// dropped too, or the rebuilt page just re-renders the same content.
function revalidateBlog(slug?: string) {
  revalidateTag(BLOG_INDEX_TAG, 'max'); // a publish may add or retitle entries
  if (slug) {
    revalidateTag(blogPostTag(slug), 'max');
    for (const locale of LOCALES) {
      revalidatePath(`/${locale}/blog/${slug}`);
      revalidatePath(`/${locale}/blog`);
    }
    return { revalidated: true, slug, locales: LOCALES };
  }
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/blog`);
  }
  return { revalidated: true, type: 'blog-list', locales: LOCALES };
}

function revalidateAll() {
  revalidateTag(BLOG_INDEX_TAG, 'max');
  revalidateTag(BLOG_CONTENT_TAG, 'max'); // drops every cached article body
  revalidatePath('/', 'layout'); // purges every page in the app
  return { revalidated: true, type: 'all' };
}

async function handle(request: NextRequest) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type');
  const slug = request.nextUrl.searchParams.get('slug') ?? undefined;

  const result = type === 'all' ? revalidateAll() : revalidateBlog(slug);
  return NextResponse.json(result);
}

// POST — for webhook integrations (e.g. triggered by a CI script after publishing)
export async function POST(request: NextRequest) {
  return handle(request);
}

// GET — for quick manual revalidation from the browser
export async function GET(request: NextRequest) {
  return handle(request);
}
