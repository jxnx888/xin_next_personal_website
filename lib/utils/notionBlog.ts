import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { marked } from 'marked';
import type { BlogPost } from '@/lib/types/blog';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

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

// Language select values in Notion: 'Both' | 'English' | 'Chinese'
const LANGUAGE_FOR_LOCALE: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
};

function pageToPost(page: PageObjectResponse, locale: string, content = ''): BlogPost {
  const p = page.properties;
  const titleZH = getRichText(p, 'TitleZH') || getTitle(p);
  const titleEN = getRichText(p, 'TitleEN') || titleZH;
  return {
    id: page.id,
    title: locale === 'zh' ? titleZH : titleEN,
    time: getDate(p, 'Publish Date'),
    type: getMultiSelect(p, 'Tags'),
    abstract: getRichText(p, 'Abstract'),
    content,
  };
}

export async function getNotionBlogList(locale: string): Promise<BlogPost[]> {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_BLOG_DB_ID!,
    filter: {
      and: [
        { property: 'Status', status: { equals: 'Published' } },
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
    .map((p) => pageToPost(p, locale));
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

export async function getNotionBlogBySlug(pageId: string, locale: string): Promise<BlogPost | null> {
  try {
    const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;

    // Render only the children of the locale-specific toggle block
    const toggleId = await getLocaleToggleId(pageId, locale);
    const mdBlocks = await n2m.pageToMarkdown(toggleId ?? pageId);
    const mdString = n2m.toMarkdownString(mdBlocks);
    // Add referrerpolicy="no-referrer" to bypass hotlink protection on external image hosts (e.g. cnblogs)
    const html = (marked.parse(mdString.parent) as string)
      .replace(/<img /g, '<img referrerpolicy="no-referrer" ');

    return pageToPost(page, locale, html);
  } catch {
    return null;
  }
}
