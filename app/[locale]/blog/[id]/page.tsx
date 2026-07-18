import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getServerBlogBySlug, getServerBlogData } from '@/lib/utils/serverData';
import { extractHeadings } from '@/lib/utils/blogUtils';

export const revalidate = 2592000; // 30 days
import BlogDetailClient from './BlogDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const blog = await getServerBlogBySlug(id, locale);
  if (!blog) return {};
  const t = await getTranslations({ locale });
  return {
    title: `${blog.title} | ${t('MY_NAME')}`,
    description: blog.abstract,
    alternates: { canonical: `/${locale}/blog/${id}` },
    openGraph: { url: `/${locale}/blog/${id}`, title: blog.title, description: blog.abstract },
  };
}

export default async function BlogDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale, id } = await params;
  const { from } = await searchParams;

  const [blog, allBlogs] = await Promise.all([
    getServerBlogBySlug(id, locale),
    getServerBlogData(locale),
  ]);
  if (!blog) notFound();

  // Posts sharing at least one tag, fallback to most recent
  const related = allBlogs.filter(b => b.id !== blog.id && b.type.some(t => blog.type.includes(t)));
  const sidebarPosts = (related.length > 0 ? related : allBlogs.filter(b => b.id !== blog.id)).slice(0, 5);
  const headings = extractHeadings(blog.content);

  return <BlogDetailClient blog={blog} locale={locale} fromTag={from ?? null} relatedPosts={sidebarPosts} headings={headings} />;
}
