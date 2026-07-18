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

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'zh'];

function authenticate(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret');
  return secret === process.env.REVALIDATE_SECRET;
}

function revalidateBlog(slug?: string) {
  if (slug) {
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
