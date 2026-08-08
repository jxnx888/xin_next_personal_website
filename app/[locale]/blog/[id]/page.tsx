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
  const ogImage = `/${locale}/blog/${id}/opengraph-image`;
  return {
    title: `${blog.title} | ${t('MY_NAME')}`,
    description: blog.abstract,
    alternates: {
      canonical: `/${locale}/blog/${id}`,
      languages: { 'x-default': `/en/blog/${id}`, en: `/en/blog/${id}`, zh: `/zh/blog/${id}` },
    },
    openGraph: {
      url: `/${locale}/blog/${id}`,
      title: blog.title,
      description: blog.abstract,
      type: 'article',
      publishedTime: blog.time || undefined,
      authors: ['Xin Ning'],
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.abstract,
      images: [ogImage],
    },
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

  const [blog, allBlogs, t] = await Promise.all([
    getServerBlogBySlug(id, locale),
    getServerBlogData(locale),
    getTranslations({ locale }),
  ]);
  if (!blog) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ning-xin.com';
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('HOME'), item: `${siteUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: t('BLOG'), item: `${siteUrl}/${locale}/blog` },
      { '@type': 'ListItem', position: 3, name: blog.title, item: `${siteUrl}/${locale}/blog/${id}` },
    ],
  };
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.abstract,
    url: `${siteUrl}/${locale}/blog/${id}`,
    mainEntityOfPage: `${siteUrl}/${locale}/blog/${id}`,
    inLanguage: locale === 'zh' ? 'zh-CN' : 'en-US',
    keywords: blog.type.join(', '),
    datePublished: blog.time || undefined,
    dateModified: blog.time || undefined,
    image: [`${siteUrl}/${locale}/blog/${id}/opengraph-image`],
    author: {
      '@type': 'Person',
      name: 'Xin Ning',
      url: `${siteUrl}/${locale}`,
    },
    publisher: {
      '@type': 'Person',
      name: 'Xin Ning',
      url: `${siteUrl}/${locale}`,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon-512.png`,
      },
    },
  };

  // Posts sharing at least one tag, fallback to most recent
  const related = allBlogs.filter(b => b.id !== blog.id && b.type.some(t => blog.type.includes(t)));
  const sidebarPosts = (related.length > 0 ? related : allBlogs.filter(b => b.id !== blog.id)).slice(0, 5);
  const headings = extractHeadings(blog.content);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogDetailClient blog={blog} locale={locale} fromTag={from ?? null} relatedPosts={sidebarPosts} headings={headings} />
    </>
  );
}
