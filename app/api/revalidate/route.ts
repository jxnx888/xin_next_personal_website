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
  // Revalidates every page in the application
  revalidatePath('/', 'layout');
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

// POST — intended for Notion webhooks / CI scripts
export async function POST(request: NextRequest) {
  return handle(request);
}

// GET — convenient for manual browser testing
export async function GET(request: NextRequest) {
  return handle(request);
}
