import { BlogPost, TagCount } from '@/lib/types/blog';

const blogCache: Record<string, BlogPost[]> = {};

export async function getBlogData(locale: string, signal?: AbortSignal): Promise<BlogPost[]> {
  if (blogCache[locale]) return blogCache[locale];

  const url = locale === 'zh' ? '/mock/blogCN.json' : '/mock/blogEN.json';
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.code === 200) {
      blogCache[locale] = data.data;
      return data.data;
    }
    return [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    console.error('Error loading blog data:', error);
    return [];
  }
}

export function getTagCounts(blogs: BlogPost[]): TagCount {
  const tagCounts: TagCount = {};
  blogs.forEach((blog) => {
    blog.type.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return tagCounts;
}

export function filterBlogsByTag(blogs: BlogPost[], tag?: string): BlogPost[] {
  if (!tag) return blogs;
  return blogs.filter((blog) => blog.type.includes(tag));
}

export function getBlogImagePath(tag: string): string {
  // Strip non-alphanumeric chars (including / and spaces) to prevent path injection
  return `/image/blog/${tag.toLowerCase().replace(/[^a-z0-9]/g, '')}.jpg`;
}

export function getReadTime(content: string, locale?: string): number {
  const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (locale === 'zh') {
    // Chinese reading speed ~350 characters per minute
    const charCount = text.replace(/\s/g, '').length;
    return Math.max(1, Math.ceil(charCount / 350));
  }
  const words = text.split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
