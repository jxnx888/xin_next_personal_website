import fs from 'fs';
import path from 'path';
import type { BlogPost } from '@/lib/types/blog';
import type { ProjectsData } from '@/lib/types/projects';

export async function getServerBlogData(locale: string): Promise<BlogPost[]> {
  if (process.env.NOTION_TOKEN && process.env.NOTION_BLOG_DB_ID) {
    const { getNotionBlogList } = await import('./notionBlog');
    return getNotionBlogList(locale);
  }
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

export async function getServerBlogBySlug(slug: string, locale: string): Promise<BlogPost | null> {
  if (process.env.NOTION_TOKEN && process.env.NOTION_BLOG_DB_ID) {
    const { getNotionBlogBySlug } = await import('./notionBlog');
    return getNotionBlogBySlug(slug, locale);
  }
  const blogs = await getServerBlogData(locale);
  return blogs.find((b) => b.id === slug) ?? null;
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
