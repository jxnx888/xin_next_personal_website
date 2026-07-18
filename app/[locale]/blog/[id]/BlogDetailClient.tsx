'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { BlogPost } from '@/lib/types/blog';
import type { TocHeading } from '@/lib/types/blog';
import { getReadTime } from '@/lib/utils/blogUtils';
import PageBanner from '@/components/layout/PageBanner';
import SectionCard from '@/components/ui/SectionCard';
import TagBadge from '@/components/blog/TagBadge';

interface BlogDetailClientProps {
  blog: BlogPost;
  locale: string;
  fromTag: string | null;
  relatedPosts: BlogPost[];
  headings: TocHeading[];
}

// ── Table of Contents ─────────────────────────────────────────

function TocList({ headings }: { headings: TocHeading[] }) {
  const t = useTranslations();
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      // Top edge: 88px nav offset; bottom edge: only the upper 35% of viewport counts
      { rootMargin: '-88px 0px -65% 0px', threshold: 0 }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  };

  return (
    <SectionCard className="overflow-hidden">
      <div
        className="px-5 py-3 text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase"
        style={{ borderBottom: '1px solid var(--border-soft)' }}
      >
        {t('TABLE_OF_CONTENTS')}
      </div>
      <nav className="p-3 space-y-0.5">
        {headings.map(({ id, text, level }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={[
              'block rounded-lg text-sm leading-snug transition-colors duration-150 py-1.5',
              level === 3 ? 'pl-6 pr-3 text-xs' : 'px-3',
              activeId === id
                ? 'text-[var(--accent)] bg-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg)]',
            ].join(' ')}
          >
            {text}
          </a>
        ))}
      </nav>
    </SectionCard>
  );
}

// ── Related posts ─────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────

export default function BlogDetailClient({ blog, locale, fromTag, relatedPosts, headings }: BlogDetailClientProps) {
  const t = useTranslations();
  const backHref = fromTag
    ? `/${locale}/blog?tag=${encodeURIComponent(fromTag)}`
    : `/${locale}/blog`;
  const readTime = getReadTime(blog.content, locale);
  const contentRef = useRef<HTMLDivElement>(null);

  // Syntax highlighting + copy buttons — run together after content mounts.
  useEffect(() => {
    const div = contentRef.current;
    if (!div) return;

    // Syntax highlighting
    const blocks = div.querySelectorAll<HTMLElement>('pre code');
    if (blocks.length) {
      import('highlight.js/lib/common').then(({ default: hljs }) => {
        blocks.forEach((block) => hljs.highlightElement(block));
      });
    }

    // Copy buttons — one per <pre>, skips pre blocks that already have one
    div.querySelectorAll<HTMLElement>('pre').forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code');
      btn.addEventListener('click', () => {
        const text = pre.querySelector('code')?.textContent ?? '';
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
      pre.appendChild(btn);
    });
  }, [blog.content]);

  const hasSidebar = headings.length > 0 || relatedPosts.length > 0;

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

            {/* Mobile: TOC + related posts below article */}
            {hasSidebar && (
              <div className="mt-6 hidden phone:block pad-v:block space-y-4">
                {headings.length > 0 && <TocList headings={headings} />}
                {relatedPosts.length > 0 && <RelatedPostList posts={relatedPosts} locale={locale} />}
              </div>
            )}
          </div>

          {/* Sidebar — desktop only, scrollable if taller than viewport */}
          {hasSidebar && (
            <div className="w-60 shrink-0 sticky top-[88px] max-h-[calc(100vh-108px)] overflow-y-auto phone:hidden pad-v:hidden space-y-4 scrollbar-thin">
              {headings.length > 0 && <TocList headings={headings} />}
              {relatedPosts.length > 0 && <RelatedPostList posts={relatedPosts} locale={locale} />}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
