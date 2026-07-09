import { BlogPost, TagCount } from '@/lib/types/blog';

// Cache the Promise itself to prevent duplicate in-flight requests (cache stampede)
const blogCachePromise: Record<string, Promise<BlogPost[]>> = {};

export function getBlogData(locale: string, signal?: AbortSignal): Promise<BlogPost[]> {
  if (!blogCachePromise[locale]) {
    const url = locale === 'zh' ? '/mock/blogCN.json' : '/mock/blogEN.json';
    blogCachePromise[locale] = fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.code !== 200) return [];
        return (data.data as BlogPost[]).map((post: BlogPost) => ({
          ...post,
          // Strip cnblogs copy-code toolbar buttons (onclick="copyCnblogsCode" is undefined here)
          content: post.content.replace(/<div class="cnblogs_code_toolbar">[\s\S]*?<\/div>/g, ''),
        }));
      })
      .catch(err => {
        delete blogCachePromise[locale]; // allow retry on error
        console.error('Error loading blog data:', err);
        return [];
      });
  }
  // If the caller provides a signal, race it against the shared promise
  if (signal) {
    return Promise.race([
      blogCachePromise[locale],
      new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      }),
    ]);
  }
  return blogCachePromise[locale];
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
