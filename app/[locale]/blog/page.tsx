import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getServerBlogData } from '@/lib/utils/serverData';
import { getTagCounts, filterBlogsByTag } from '@/lib/utils/blogUtils';
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
    description: t('META_DESCRIPTION'),
    alternates: { canonical: `/${locale}/blog` },
    openGraph: { url: `/${locale}/blog` },
  };
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { locale } = await params;
  const { tag } = await searchParams;

  const allBlogs = getServerBlogData(locale);
  const tagCounts = getTagCounts(allBlogs);
  const filteredBlogs = filterBlogsByTag(allBlogs, tag);

  return (
    <BlogPageClient
      key={tag ?? 'all'}
      blogs={filteredBlogs}
      tagCounts={tagCounts}
      totalCount={allBlogs.length}
      currentTag={tag ?? null}
    />
  );
}
