import { APIResponseError, Client, isNotionClientError } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { marked } from 'marked';
import hljs from 'highlight.js/lib/common';
import { unstable_cache } from 'next/cache';
import type { BlogIndexItem, BlogPost, BlogSummary } from '@/lib/types/blog';
import { getReadTime } from '@/lib/utils/blogUtils';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

function slugify(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-');
}

// Configure marked: syntax-highlight code blocks and inject id attributes on headings
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(text, { language: validLang }).value;
      return `<div class="code-block-wrap"><pre><code class="hljs language-${validLang}">${highlighted}</code></pre></div>`;
    },
    heading({ text, depth }: { text: string; depth: number }) {
      const id = slugify(text);
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
  },
});

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ── Notion rate limiting ─────────────────────────────────────────────────────
// Notion's public API allows roughly 3 requests/second. getNotionBlogList below
// renders the full content of every post, and notion-to-md issues one request
// per nested block, so a 40-post build fans out into hundreds of requests. Sent
// unthrottled they all land at once and Notion replies 429 — which fails the
// production build outright, because /[locale]/blog is statically generated.
//
// Two guards. First, every request retries on 429/5xx, honouring Retry-After.
// Patching `request` on the instance is what makes this reach notion-to-md's
// internal calls, which we have no other handle on: the SDK's endpoint helpers
// are arrow functions that resolve `this.request` at call time.
const MAX_ATTEMPTS = 5;
// Cap only runaway values; never cap below what Notion asks for, or we retry
// too early, get 429 again and burn the attempt budget for nothing.
const MAX_BACKOFF_MS = 90_000;
// Notion's documented average is 3 requests/second. Capping concurrency alone
// does not achieve that — three post renders each issuing sequential requests
// still peaks well above it — so requests are spaced out globally.
const MIN_REQUEST_INTERVAL_MS = 350;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Serialises only the *scheduling* of requests, not their execution: each call
// waits its turn to start, then runs concurrently with whatever is in flight.
let scheduleChain: Promise<void> = Promise.resolve();
let lastStart = 0;

function schedule<T>(run: () => Promise<T>): Promise<T> {
  const slot = scheduleChain.then(async () => {
    const wait = lastStart + MIN_REQUEST_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();
  });
  scheduleChain = slot.catch(() => {});
  return slot.then(run);
}

/** The SDK types response headers as `unknown`; at runtime it is a Headers. */
function retryAfterMs(headers: unknown): number | null {
  const get = (headers as { get?: unknown })?.get;
  if (typeof get !== 'function') return null;
  const seconds = Number((headers as { get(name: string): string | null }).get('retry-after'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
}

/** Milliseconds to wait before retrying, or null if the error is not retryable. */
function retryDelay(error: unknown, attempt: number): number | null {
  if (!isNotionClientError(error) || !(error instanceof APIResponseError)) return null;
  const { status } = error;
  if (status !== 429 && (status < 500 || status >= 600)) return null;

  const delay = retryAfterMs(error.headers) ?? 2 ** attempt * 500;
  return Math.min(delay, MAX_BACKOFF_MS);
}

const rawRequest = notion.request.bind(notion);
notion.request = async function retryingRequest<T>(args: Parameters<typeof rawRequest>[0]): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return (await schedule(() => rawRequest(args))) as T;
    } catch (error) {
      const delay = attempt < MAX_ATTEMPTS - 1 ? retryDelay(error, attempt) : null;
      if (delay === null) throw error;
      await sleep(delay);
    }
  }
} as typeof notion.request;

// Second guard: bound how many posts are rendered at once. Each one is itself
// several sequential requests, so this caps the burst rather than the total.
const POST_CONCURRENCY = 3;

/** Promise.all with a concurrency cap. Results keep the input order. */
async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
// ─────────────────────────────────────────────────────────────────────────────

const n2m = new NotionToMarkdown({ notionClient: notion });

type Props = PageObjectResponse['properties'];

function getRichText(props: Props, name: string): string {
  const prop = props[name];
  if (!prop || prop.type !== 'rich_text') return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prop as any).rich_text[0]?.plain_text ?? '';
}

function getTitle(props: Props): string {
  for (const prop of Object.values(props)) {
    if (prop.type === 'title') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (prop as any).title[0]?.plain_text ?? '';
    }
  }
  return '';
}

function getMultiSelect(props: Props, name: string): string[] {
  const prop = props[name];
  if (!prop || prop.type !== 'multi_select') return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prop as any).multi_select.map((s: { name: string }) => s.name);
}

function getDate(props: Props, name: string): string {
  const prop = props[name];
  if (!prop || prop.type !== 'date') return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prop as any).date?.start ?? '';
}

function getStatus(props: Props, name: string): string {
  const prop = props[name];
  if (!prop || prop.type !== 'status') return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prop as any).status?.name ?? '';
}

// Mirrors the getNotionBlogList filter: hides drafts and posts scheduled for the future
// so a direct link to an unpublished/scheduled page id doesn't leak its content early.
function isPubliclyVisible(page: PageObjectResponse): boolean {
  const p = page.properties;
  if (getStatus(p, 'Status') !== 'Published') return false;
  const publishDate = getDate(p, 'Publish Date');
  if (!publishDate) return false;
  return new Date(publishDate) <= new Date();
}

// Language select values in Notion: 'Both' | 'English' | 'Chinese'
const LANGUAGE_FOR_LOCALE: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
};

// Meta descriptions max out around 160 chars before search engines truncate them.
function excerptFromHtml(html: string, maxLen = 160): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const cut = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, cut > 0 ? cut : maxLen)}…`;
}

function pageToIndexItem(page: PageObjectResponse, locale: string): BlogIndexItem {
  const p = page.properties;
  const titleZH = getRichText(p, 'TitleZH') || getTitle(p);
  const titleEN = getRichText(p, 'TitleEN') || titleZH;
  return {
    id: page.id,
    title: locale === 'zh' ? titleZH : titleEN,
    time: getDate(p, 'Publish Date'),
    type: getMultiSelect(p, 'Tags'),
  };
}

function pageToPost(page: PageObjectResponse, locale: string, content = ''): BlogPost {
  return { ...pageToIndexItem(page, locale), abstract: excerptFromHtml(content), content };
}

// ── Caching ──────────────────────────────────────────────────────────────────
// Published posts are append-only here: existing articles do not change, only
// new ones appear. So article bodies are cached indefinitely per post, and only
// the index needs refreshing to pick up new entries. Both are purged on demand
// through /api/revalidate, which is how edits are published.
//
// This is Next's Data Cache, not a module-level Map: build runs each page in a
// separate worker process and Vercel serves from separate instances, so nothing
// in memory is shared between the blog list and a post opened from a search
// result. The Data Cache is, and it also survives in .next/cache between
// deployments.
export const BLOG_INDEX_TAG = 'blog-index';
export const BLOG_CONTENT_TAG = 'blog-content';
export const blogPostTag = (pageId: string) => `blog-post-${pageId}`;

async function fetchBlogIndex(locale: string): Promise<BlogIndexItem[]> {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_BLOG_DB_ID!,
    filter: {
      and: [
        { property: 'Status', status: { equals: 'Published' } },
        // Hide scheduled posts: only show entries whose Publish Date has already arrived.
        { property: 'Publish Date', date: { on_or_before: new Date().toISOString() } },
        {
          or: [
            { property: 'Language', select: { equals: 'Both' } },
            { property: 'Language', select: { equals: LANGUAGE_FOR_LOCALE[locale] ?? 'English' } },
          ],
        },
      ],
    },
    sorts: [{ property: 'Publish Date', direction: 'descending' }],
  });

  return res.results
    .filter((p): p is PageObjectResponse => p.object === 'page' && 'properties' in p)
    .map((p) => pageToIndexItem(p, locale));
}

/** Titles, dates and tags for every published post. One request, then cached. */
export function getNotionBlogIndex(locale: string): Promise<BlogIndexItem[]> {
  return unstable_cache(() => fetchBlogIndex(locale), ['notion-blog-index', locale], {
    tags: [BLOG_INDEX_TAG],
    revalidate: false,
  })();
}

/** One article's HTML. Tagged per post so a single edit does not evict the rest. */
function getPostContent(pageId: string, locale: string): Promise<string> {
  return unstable_cache(
    () => renderLocaleContent(pageId, locale),
    ['notion-post-content', pageId, locale],
    { tags: [BLOG_CONTENT_TAG, blogPostTag(pageId)], revalidate: false }
  )();
}

/** List view: index plus the excerpt and read time, both derived from the body. */
export async function getNotionBlogSummaries(locale: string): Promise<BlogSummary[]> {
  const index = await getNotionBlogIndex(locale);
  return mapLimit(index, POST_CONCURRENCY, async (item) => {
    const content = await getPostContent(item.id, locale);
    return { ...item, abstract: excerptFromHtml(content), readTime: getReadTime(content, locale) };
  });
}

// Find the toggle block ID for the current locale.
// Toggle labels: "🇺🇸 English" for en, "🇨🇳 中文" for zh.
async function getLocaleToggleId(pageId: string, locale: string): Promise<string | null> {
  const label = locale === 'zh' ? '中文' : 'English';
  const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 20 });
  for (const block of blocks.results) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = block as any;
    if (b.type !== 'toggle') continue;
    const text: string = b.toggle?.rich_text?.[0]?.plain_text ?? '';
    if (text.includes(label)) return b.id;
  }
  return null;
}

// Renders only the children of the locale-specific toggle block into HTML.
async function renderLocaleContent(pageId: string, locale: string): Promise<string> {
  const toggleId = await getLocaleToggleId(pageId, locale);
  const mdBlocks = await n2m.pageToMarkdown(toggleId ?? pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);
  // Add referrerpolicy="no-referrer" to bypass hotlink protection on external image hosts (e.g. cnblogs)
  return (marked.parse(mdString.parent) as string).replace(/<img /g, '<img referrerpolicy="no-referrer" ');
}

export async function getNotionBlogBySlug(pageId: string, locale: string): Promise<BlogPost | null> {
  try {
    const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;
    if (!isPubliclyVisible(page)) return null;

    const html = await getPostContent(pageId, locale);
    return pageToPost(page, locale, html);
  } catch {
    return null;
  }
}
