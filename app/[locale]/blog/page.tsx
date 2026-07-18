import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getServerBlogData } from '@/lib/utils/serverData';

export const revalidate = 2592000; // 30 days — manually trigger /api/revalidate when content changes
import { getTagCounts } from '@/lib/utils/blogUtils';
import BlogPageClient from './BlogPageClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('BLOG')} | ${t('MY_NAME')}`,
    description: t('BLOG_META_DESCRIPTION'),
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { 'x-default': '/en/blog', en: '/en/blog', zh: '/zh/blog' },
    },
    openGraph: { url: `/${locale}/blog` },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const allBlogs = await getServerBlogData(locale);
  const tagCounts = getTagCounts(allBlogs);

  return (
    <BlogPageClient
      blogs={allBlogs}
      tagCounts={tagCounts}
      totalCount={allBlogs.length}
    />
  );
}
