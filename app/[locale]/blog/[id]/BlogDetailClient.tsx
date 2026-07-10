'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { BlogPost } from '@/lib/types/blog';
import { getReadTime } from '@/lib/utils/blogUtils';
import PageBanner from '@/components/layout/PageBanner';
import SectionCard from '@/components/ui/SectionCard';
import TagBadge from '@/components/blog/TagBadge';

interface BlogDetailClientProps {
  blog: BlogPost;
  locale: string;
  fromTag: string | null;
}

export default function BlogDetailClient({ blog, locale, fromTag }: BlogDetailClientProps) {
  const t = useTranslations();
  const backHref = fromTag
    ? `/${locale}/blog?tag=${encodeURIComponent(fromTag)}`
    : `/${locale}/blog`;
  const readTime = getReadTime(blog.content, locale);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner title={t('BLOG')} imageSrc="/image/banner3.png" subtitle={blog.title} titleAs="p" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors text-sm"
        >
          <ArrowLeftOutlined /> {t('BACK')}{fromTag && ` · #${fromTag}`}
        </Link>

        <SectionCard className="overflow-hidden">
          <div className="p-8 phone:p-5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <h1 className="text-3xl phone:text-xl font-bold text-center text-[var(--text)] mb-5 leading-snug">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-[var(--text-dim)]">
                {t('POSTED_AT', { time: blog.time })}
              </span>
              <span className="text-[var(--text-dim)] opacity-40">·</span>
              <span className="text-[var(--text-dim)]">
                {readTime} {t('MIN_READ')}
              </span>
              <div className="flex flex-wrap gap-2">
                {blog.type.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>
            </div>
          </div>

          <div
            className="p-8 phone:p-5 blog-content"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </SectionCard>
      </div>
    </div>
  );
}
