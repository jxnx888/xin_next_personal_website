'use client';

import { useEffect, useRef } from 'react';
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
  relatedPosts: BlogPost[];
}

function RelatedPostList({ posts, locale }: { posts: BlogPost[]; locale: string }) {
  const t = useTranslations();
  return (
    <SectionCard className="overflow-hidden">
      <div
        className="px-5 py-3 text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase"
        style={{ borderBottom: '1px solid var(--border-soft)' }}
      >
        {t('RELATED_POSTS')}
      </div>
      <div className="p-3 space-y-1">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/${locale}/blog/${post.id}`}
            className="block px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors duration-150 leading-snug"
          >
            <div className="font-medium line-clamp-2 mb-1">{post.title}</div>
            <div className="text-xs text-[var(--text-dim)]">{post.time}</div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

export default function BlogDetailClient({ blog, locale, fromTag, relatedPosts }: BlogDetailClientProps) {
  const t = useTranslations();
  const backHref = fromTag
    ? `/${locale}/blog?tag=${encodeURIComponent(fromTag)}`
    : `/${locale}/blog`;
  const readTime = getReadTime(blog.content, locale);
  const contentRef = useRef<HTMLDivElement>(null);

  // Client-side syntax highlighting — runs after HTML is injected into DOM,
  // covers cases where the server-side marked renderer didn't add hljs classes.
  useEffect(() => {
    const div = contentRef.current;
    if (!div) return;
    const blocks = div.querySelectorAll<HTMLElement>('pre code');
    if (!blocks.length) return;
    import('highlight.js/lib/common').then(({ default: hljs }) => {
      blocks.forEach((block) => hljs.highlightElement(block));
    });
  }, [blog.content]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner title={t('BLOG')} imageSrc="/image/banner3.png" subtitle={blog.title} titleAs="p" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors text-sm"
        >
          <ArrowLeftOutlined /> {t('BACK')}{fromTag && ` · #${fromTag}`}
        </Link>

        <div className="flex gap-6 items-start">

          {/* Main article */}
          <div className="flex-1 min-w-0">
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
                ref={contentRef}
                className="p-8 phone:p-5 blog-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </SectionCard>

            {/* Related posts — mobile only (below article) */}
            {relatedPosts.length > 0 && (
              <div className="mt-6 hidden phone:block pad-v:block">
                <RelatedPostList posts={relatedPosts} locale={locale} />
              </div>
            )}
          </div>

          {/* Sidebar — desktop only */}
          {relatedPosts.length > 0 && (
            <div className="w-56 shrink-0 sticky top-[88px] phone:hidden pad-v:hidden">
              <RelatedPostList posts={relatedPosts} locale={locale} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
