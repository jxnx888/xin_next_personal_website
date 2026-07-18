'use client';

import { useRef, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from 'antd';
import Fuse from 'fuse.js';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import PageBanner from '@/components/layout/PageBanner';
import { filterBlogsByTag } from '@/lib/utils/blogUtils';
import type { BlogPost, TagCount } from '@/lib/types/blog';

interface BlogPageClientProps {
  blogs: BlogPost[];
  tagCounts: TagCount;
  totalCount: number;
}

export default function BlogPageClient({ blogs, tagCounts, totalCount }: BlogPageClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentTag, setCurrentTag] = useState<string | null>(searchParams.get('tag'));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const sizeChangingRef = useRef(false);

  // Fuse instance — rebuilt only when blogs change
  const fuse = useMemo(
    () =>
      new Fuse(blogs, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'abstract', weight: 1.5 },
          { name: 'type', weight: 1 },
        ],
        threshold: 0.35,
        includeScore: true,
      }),
    [blogs]
  );

  // Apply search then tag filter
  const searchedBlogs = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return blogs;
    return fuse.search(q).map((r) => r.item);
  }, [fuse, searchQuery, blogs]);

  const filteredBlogs = useMemo(
    () => filterBlogsByTag(searchedBlogs, currentTag ?? undefined),
    [searchedBlogs, currentTag]
  );

  const startIndex = (currentPage - 1) * pageSize;
  const currentBlogs = filteredBlogs.slice(startIndex, startIndex + pageSize);

  // Build URL with both tag and q params
  const buildUrl = (tag: string | null, q: string) => {
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (q.trim()) params.set('q', q.trim());
    const qs = params.toString();
    return `/${locale}/blog${qs ? '?' + qs : ''}`;
  };

  const handleTagChange = (tag: string | null) => {
    setCurrentTag(tag);
    setCurrentPage(1);
    router.replace(buildUrl(tag, searchQuery), { scroll: false });
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
    router.replace(buildUrl(currentTag, q), { scroll: false });
  };

  const handlePageChange = (page: number) => {
    if (sizeChangingRef.current) {
      sizeChangingRef.current = false;
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSizeChange = (_current: number, size: number) => {
    sizeChangingRef.current = true;
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner title={t('BLOG')} imageSrc="/image/banner3.png" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-row phone:flex-col pad-v:flex-col gap-6">

          {/* Blog List */}
          <div className="flex-1">
            <div
              className="mb-4 pb-3 flex items-center justify-between gap-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-bold text-[var(--text)]">{t('ARTICLES')}</h2>
                {currentTag && <span className="text-[var(--text-muted)] text-base">#{currentTag}</span>}
                <span className="text-[var(--text-dim)] text-sm">({filteredBlogs.length})</span>
              </div>
              <div className="hidden phone:block pad-v:block">
                <BlogSidebar tagCounts={tagCounts} totalCount={totalCount} variant="mobile" currentTag={currentTag} onTagChange={handleTagChange} />
              </div>
            </div>

            {/* Search input */}
            <div className="relative mb-5">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)] pointer-events-none"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('SEARCH_PLACEHOLDER')}
                className="w-full pl-9 pr-9 py-2 rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none transition-colors"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-input)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-glow)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-input)')}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  aria-label={t('SEARCH_CLEAR')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text)] text-xs leading-none"
                >
                  ✕
                </button>
              )}
            </div>

            {currentBlogs.length > 0 && (
              <div>
                {currentBlogs.map((post, index) => (
                  <BlogCard key={post.id} post={post} currentTag={currentTag} isPriority={index === 0} />
                ))}
              </div>
            )}

            {currentBlogs.length === 0 && (
              <div className="text-center py-16 text-[var(--text-dim)]">
                {t('NO_POSTS')}
              </div>
            )}

            {filteredBlogs.length > pageSize && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredBlogs.length}
                  onChange={handlePageChange}
                  onShowSizeChange={handleSizeChange}
                  pageSizeOptions={[5, 10, 20, 40]}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => t('POSTS_TOTAL', { count: total })}
                />
              </div>
            )}
          </div>

          {/* Desktop sidebar */}
          <div className="w-56 shrink-0 phone:hidden pad-v:hidden">
            <BlogSidebar tagCounts={tagCounts} totalCount={totalCount} variant="desktop" currentTag={currentTag} onTagChange={handleTagChange} />
          </div>

        </div>
      </div>
    </div>
  );
}
