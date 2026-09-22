import type { TagCount, TocHeading } from '@/lib/types/blog';

// Generic over the post shape: these only read `type`, so they work on the
// metadata index and the summary list alike, not just full posts.
export function getTagCounts(blogs: ReadonlyArray<{ type: string[] }>): TagCount {
  const tagCounts: TagCount = {};
  blogs.forEach((blog) => {
    blog.type.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return tagCounts;
}

export function filterBlogsByTag<T extends { type: string[] }>(blogs: T[], tag?: string): T[] {
  if (!tag) return blogs;
  return blogs.filter((blog) => blog.type.includes(tag));
}

export function getBlogImagePath(tag: string): string {
  // Strip non-alphanumeric chars (including / and spaces) to prevent path injection
  return `/image/blog/${tag.toLowerCase().replace(/[^a-z0-9]/g, '')}.jpg`;
}

// Extract h2/h3 headings that have id attributes (injected by the Notion marked renderer)
export function extractHeadings(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const pattern = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h[23]>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const id = match[2];
    const text = match[3].replace(/<[^>]+>/g, '').trim();
    if (id && text) headings.push({ id, text, level });
  }
  return headings;
}

export function getReadTime(content: string, locale?: string): number {
  const text = content
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (locale === 'zh') {
    // Chinese reading speed ~350 characters per minute
    const charCount = text.replace(/\s/g, '').length;
    return Math.max(1, Math.ceil(charCount / 350));
  }
  const words = text.split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
