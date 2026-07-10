'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pagination } from 'antd';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import PageBanner from '@/components/layout/PageBanner';
import type { BlogPost, TagCount } from '@/lib/types/blog';

interface BlogPageClientProps {
  blogs: BlogPost[];
  tagCounts: TagCount;
  totalCount: number;
  currentTag: string | null;
}

export default function BlogPageClient({ blogs, tagCounts, totalCount, currentTag }: BlogPageClientProps) {
  const t = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const sizeChangingRef = useRef(false);

  const startIndex = (currentPage - 1) * pageSize;
  const currentBlogs = blogs.slice(startIndex, startIndex + pageSize);

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
                <span className="text-[var(--text-dim)] text-sm">({blogs.length})</span>
              </div>
              <div className="hidden phone:block pad-v:block">
                <BlogSidebar tagCounts={tagCounts} totalCount={totalCount} variant="mobile" currentTag={currentTag} />
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

            {blogs.length > pageSize && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={blogs.length}
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
            <BlogSidebar tagCounts={tagCounts} totalCount={totalCount} variant="desktop" currentTag={currentTag} />
          </div>

        </div>
      </div>
    </div>
  );
}
