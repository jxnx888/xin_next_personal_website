import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getServerBlogData } from '@/lib/utils/serverData';
import BlogDetailClient from './BlogDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const blogs = getServerBlogData(locale);
  const blog = blogs.find((b) => b.id.toString() === id);
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

  const blogs = getServerBlogData(locale);
  const blog = blogs.find((b) => b.id.toString() === id);
  if (!blog) notFound();

  return <BlogDetailClient blog={blog} locale={locale} fromTag={from ?? null} />;
}
