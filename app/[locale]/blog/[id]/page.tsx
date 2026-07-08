'use client';

import { useTranslations } from 'next-intl';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { BlogPost } from '@/lib/types/blog';
import { getBlogData, getReadTime } from '@/lib/utils/blogUtils';
import PageBanner from '@/components/layout/PageBanner';
import SectionCard from '@/components/ui/SectionCard';
import TagBadge from '@/components/blog/TagBadge';

export default function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = use(params);
  const t = useTranslations();
  const searchParams = useSearchParams();

  const fromTag = searchParams.get('from');
  const backHref = fromTag
    ? `/${locale}/blog?tag=${encodeURIComponent(fromTag)}`
    : `/${locale}/blog`;

  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      const blogs = await getBlogData(locale);
      const foundBlog = blogs.find((b) => b.id.toString() === id);
      if (foundBlog) {
        const fixedContent = foundBlog.content.replace(
          /<img src=/g,
          '<img referrerPolicy="no-referrer" src='
        );
        setBlog({ ...foundBlog, content: fixedContent });
      }
      setLoading(false);
    };
    loadBlog();
  }, [id, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(0,212,255,0.2)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
        <h1 className="text-3xl font-bold text-[var(--text)] mb-4">{t('SOMETHING_WRONG')}</h1>
        <Link href={backHref} className="text-[var(--accent)] hover:text-[var(--text)] flex items-center gap-2 transition-colors">
          <ArrowLeftOutlined /> {t('BACK')}
        </Link>
      </div>
    );
  }

  const readTime = getReadTime(blog.content);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner title={t('BLOG')} imageSrc="/image/banner3.png" subtitle={blog.title} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link — restores tag filter if navigated from a filtered list */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors text-sm"
        >
          <ArrowLeftOutlined /> {t('BACK')}{fromTag && ` · #${fromTag}`}
        </Link>

        <SectionCard className="overflow-hidden">
          {/* Header */}
          <div className="p-8 phone:p-5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <h1 className="text-3xl phone:text-xl font-bold text-center text-[var(--text)] mb-5 leading-snug">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-[var(--text-dim)]">
                {t('POSTED')} @ <span className="text-[var(--text-muted)]">{blog.time}</span>
              </span>
              <span className="text-[var(--text-dim)] opacity-40">·</span>
              <span className="text-[var(--text-dim)]">
                {readTime} {t('MIN_READ')}
              </span>
              <div className="flex flex-wrap gap-2">
                {blog.type.map((tag, index) => (
                  <TagBadge key={index} tag={tag} />
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className="p-8 phone:p-5 blog-content"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </SectionCard>
      </div>
    </div>
  );
}
