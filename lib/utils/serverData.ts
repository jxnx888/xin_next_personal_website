import fs from 'fs';
import path from 'path';
import type { BlogIndexItem, BlogPost, BlogSummary } from '@/lib/types/blog';
import type { ProjectsData } from '@/lib/types/projects';
import { getReadTime } from '@/lib/utils/blogUtils';

function hasNotionConfig(): boolean {
  return Boolean(process.env.NOTION_TOKEN && process.env.NOTION_BLOG_DB_ID);
}

/** Local JSON fallback. Returns full posts; callers narrow from there. */
function readLocalPosts(locale: string): BlogPost[] {
  try {
    const filename = locale === 'zh' ? 'blogCN.json' : 'blogEN.json';
    const filePath = path.join(process.cwd(), 'public', 'mock', filename);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (raw.code !== 200) return [];
    return (raw.data as Array<BlogPost & { id: number }>).map((post) => ({
      ...post,
      id: String(post.id),
      content: post.content.replace(/<div class="cnblogs_code_toolbar">[\s\S]*?<\/div>/g, ''),
    }));
  } catch {
    return [];
  }
}

function toIndexItem({ id, title, time, type }: BlogPost): BlogIndexItem {
  return { id, title, time, type };
}

/**
 * Titles, dates and tags only — no article bodies.
 *
 * Use this wherever the body is not rendered. It used to be the same call as
 * the full list, which meant the sitemap (rebuilt daily) and every blog detail
 * page pulled all 40 articles' content just to read ids, dates and tags.
 */
export async function getServerBlogIndex(locale: string): Promise<BlogIndexItem[]> {
  if (hasNotionConfig()) {
    const { getNotionBlogIndex } = await import('./notionBlog');
    return getNotionBlogIndex(locale);
  }
  return readLocalPosts(locale).map(toIndexItem);
}

/** Index plus excerpt and read time — what the blog list and cards render. */
export async function getServerBlogSummaries(locale: string): Promise<BlogSummary[]> {
  if (hasNotionConfig()) {
    const { getNotionBlogSummaries } = await import('./notionBlog');
    return getNotionBlogSummaries(locale);
  }
  return readLocalPosts(locale).map((post) => ({
    ...toIndexItem(post),
    abstract: post.abstract,
    readTime: getReadTime(post.content, locale),
  }));
}

export async function getServerBlogBySlug(slug: string, locale: string): Promise<BlogPost | null> {
  if (hasNotionConfig()) {
    const { getNotionBlogBySlug } = await import('./notionBlog');
    return getNotionBlogBySlug(slug, locale);
  }
  return readLocalPosts(locale).find((b) => b.id === slug) ?? null;
}

export function getServerProjectsData(locale: string): ProjectsData {
  try {
    const filename = locale === 'zh' ? 'projectsCN.json' : 'projects.json';
    const filePath = path.join(process.cwd(), 'public', 'mock', filename);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return raw.code === 200 ? raw.data : {};
  } catch {
    return {};
  }
}
