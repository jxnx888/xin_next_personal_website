import fs from 'fs';
import path from 'path';
import type { BlogIndexItem, BlogPost, BlogSummary } from '@/lib/types/blog';
import type { Career, ProjectsData } from '@/lib/types/projects';
import type { RobloxGamesData } from '@/lib/types/games';
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

/** "YYYY/MM" → months since year 0; anything else ("Present", "至今") → this month. */
function toMonthIndex(date: string): number {
  const match = /^(\d{4})\/(\d{2})$/.exec(date);
  if (match) return Number(match[1]) * 12 + Number(match[2]) - 1;
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

/** Length of a role, e.g. "1 yr 10 mos" / "1 年 10 个月". */
function formatDuration(startDate: string, endDate: string, locale: string): string {
  const total = Math.max(0, toMonthIndex(endDate) - toMonthIndex(startDate));
  const years = Math.floor(total / 12);
  const months = total % 12;
  if (locale === 'zh') {
    if (total === 0) return '不到 1 个月';
    return [years && `${years} 年`, months && `${months} 个月`].filter(Boolean).join(' ');
  }
  if (total === 0) return '< 1 mo';
  return [
    years && `${years} ${years === 1 ? 'yr' : 'yrs'}`,
    months && `${months} ${months === 1 ? 'mo' : 'mos'}`,
  ].filter(Boolean).join(' ');
}

export function getServerProjectsData(locale: string): ProjectsData {
  try {
    const filename = locale === 'zh' ? 'projectsCN.json' : 'projects.json';
    const filePath = path.join(process.cwd(), 'public', 'mock', filename);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (raw.code !== 200) return {};
    // duration is derived from the dates, never stored, so it can't go stale
    const data = raw.data as Record<string, Omit<Career, 'duration'>>;
    return Object.fromEntries(
      Object.entries(data).map(([key, career]) => [
        key,
        { ...career, duration: formatDuration(career.startDate, career.endDate, locale) },
      ]),
    );
  } catch {
    return {};
  }
}

export function getServerRobloxGames(locale: string): RobloxGamesData | null {
  try {
    const filename = locale === 'zh' ? 'robloxGamesCN.json' : 'robloxGames.json';
    const filePath = path.join(process.cwd(), 'public', 'mock', filename);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return raw.code === 200 ? raw.data : null;
  } catch {
    return null;
  }
}
