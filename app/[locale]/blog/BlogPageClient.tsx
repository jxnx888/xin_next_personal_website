'use client';

import { useRef, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from 'antd';
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
  // Initialize from URL so refresh / shared links restore the selected tag
  const [currentTag, setCurrentTag] = useState<string | null>(searchParams.get('tag'));
  const filteredBlogs = useMemo(() => filterBlogsByTag(blogs, currentTag ?? undefined), [blogs, currentTag]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const sizeChangingRef = useRef(false);

  const startIndex = (currentPage - 1) * pageSize;
  const currentBlogs = filteredBlogs.slice(startIndex, startIndex + pageSize);

  const handleTagChange = (tag: string | null) => {
    // Update state immediately (instant filter, no lag)
    setCurrentTag(tag);
    setCurrentPage(1);
    // Sync URL in the background — server component is ISR so no server round-trip
    const url = tag ? `/${locale}/blog?tag=${encodeURIComponent(tag)}` : `/${locale}/blog`;
    router.replace(url, { scroll: false });
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
              className="mb-6 pb-3 flex items-center justify-between gap-3"
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
