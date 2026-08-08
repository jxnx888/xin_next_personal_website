import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { marked } from 'marked';
import hljs from 'highlight.js/lib/common';
import type { BlogPost } from '@/lib/types/blog';
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

function pageToPost(page: PageObjectResponse, locale: string, content = ''): BlogPost {
  const p = page.properties;
  const titleZH = getRichText(p, 'TitleZH') || getTitle(p);
  const titleEN = getRichText(p, 'TitleEN') || titleZH;
  return {
    id: page.id,
    title: locale === 'zh' ? titleZH : titleEN,
    time: getDate(p, 'Publish Date'),
    type: getMultiSelect(p, 'Tags'),
    abstract: excerptFromHtml(content),
    content,
  };
}

export async function getNotionBlogList(locale: string): Promise<BlogPost[]> {
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

  const pages = res.results.filter((p): p is PageObjectResponse => p.object === 'page' && 'properties' in p);
  return Promise.all(
    pages.map(async (p) => pageToPost(p, locale, await renderLocaleContent(p.id, locale)))
  );
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

    const html = await renderLocaleContent(pageId, locale);
    return pageToPost(page, locale, html);
  } catch {
    return null;
  }
}
