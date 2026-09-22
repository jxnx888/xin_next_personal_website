import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getServerBlogData } from '@/lib/utils/serverData';

export const revalidate = 2592000; // 30 days — manually trigger /api/revalidate when content changes
import { getTagCounts } from '@/lib/utils/blogUtils';
import BlogPageClient from './BlogPageClient';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
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
    openGraph: {
      url: `/${locale}/blog`,
      images: [{ url: '/image/banner3.png', width: 1200, height: 630 }],
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const allBlogs = await getServerBlogData(locale);
  const tagCounts = getTagCounts(allBlogs);

  return (
    // BlogPageClient reads useSearchParams() for the tag/search filters. Next 16
    // requires that to sit behind a Suspense boundary, otherwise prerendering
    // this route fails instead of silently bailing out to client rendering.
    <Suspense fallback={null}>
      <BlogPageClient
        blogs={allBlogs}
        tagCounts={tagCounts}
        totalCount={allBlogs.length}
      />
    </Suspense>
  );
}
