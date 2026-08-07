import type { MetadataRoute } from 'next';
import { getServerBlogData } from '@/lib/utils/serverData';

export const revalidate = 86400; // rebuild sitemap daily

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ning-xin.com';
const LOCALES = ['en', 'zh'] as const;

const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: '', priority: 1.0 },
  { path: '/projects', priority: 0.8 },
  { path: '/blog', priority: 0.9 },
  { path: '/contact', priority: 0.6 },
  { path: '/resume', priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap(({ path, priority }) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority,
    }))
  );

  // Blog posts — each locale has its own visible set (a post can be English-only,
  // Chinese-only, or Both), so fetch both lists rather than assuming they match.
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const [enPosts, zhPosts] = await Promise.all([
      getServerBlogData('en'),
      getServerBlogData('zh'),
    ]);
    blogEntries = [
      ...enPosts.map((post) => ({
        url: `${BASE_URL}/en/blog/${post.id}`,
        lastModified: post.time ? new Date(post.time) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...zhPosts.map((post) => ({
        url: `${BASE_URL}/zh/blog/${post.id}`,
        lastModified: post.time ? new Date(post.time) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // Sitemap still works for static routes if blog fetch fails
  }

  return [...staticEntries, ...blogEntries];
}
