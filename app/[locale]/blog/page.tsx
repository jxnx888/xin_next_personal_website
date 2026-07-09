'use client';

import { Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Pagination } from 'antd';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import PageBanner from '@/components/layout/PageBanner';
import { BlogPost } from '@/lib/types/blog';
import { getBlogData, getTagCounts, filterBlogsByTag } from '@/lib/utils/blogUtils';

function BlogPageContent() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [tagCounts, setTagCounts] = useState<{ [key: string]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(true);

  // Prevents onChange scroll when triggered by a page-size change
  const sizeChangingRef = useRef(false);

  const currentTag = searchParams.get('tag');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const loadBlogs = async () => {
      setLoading(true);
      try {
        const data = await getBlogData(locale, controller.signal);
        if (!cancelled) {
          setBlogs(data);
          setTagCounts(getTagCounts(data));
          setLoading(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        if (!cancelled) setLoading(false);
      }
    };
    loadBlogs();
    return () => { cancelled = true; controller.abort(); };
  }, [locale]);

  useEffect(() => {
    setFilteredBlogs(filterBlogsByTag(blogs, currentTag || undefined));
    setCurrentPage(1);
  }, [blogs, currentTag]);

  const startIndex = (currentPage - 1) * pageSize;
  const currentBlogs = filteredBlogs.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (sizeChangingRef.current) {
      sizeChangingRef.current = false;
      return; // suppress scroll triggered by Ant Design firing onChange after onShowSizeChange
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
        {/* Default: flex-row (desktop); phone/pad-v: flex-col */}
        <div className="flex flex-row phone:flex-col pad-v:flex-col gap-6">

          {/* Blog List */}
          <div className="flex-1">
            {/* Header row: title + mobile tag dropdown */}
            <div
              className="mb-6 pb-3 flex items-center justify-between gap-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-bold text-[var(--text)]">{t('ARTICLES')}</h2>
                {currentTag && <span className="text-[var(--text-muted)] text-base">#{currentTag}</span>}
                <span className="text-[var(--text-dim)] text-sm">({filteredBlogs.length})</span>
              </div>
              {!loading && (
                <div className="hidden phone:block pad-v:block">
                  <BlogSidebar tagCounts={tagCounts} variant="mobile" />
                </div>
              )}
            </div>

            {loading && (
              <div className="text-center py-16">
                <div
                  className="inline-block w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'var(--accent-dim)', borderTopColor: 'var(--accent)' }}
                />
              </div>
            )}

            {!loading && currentBlogs.length > 0 && (
              <div>{currentBlogs.map((post) => <BlogCard key={post.id} post={post} currentTag={currentTag} />)}</div>
            )}

            {!loading && currentBlogs.length === 0 && (
              <div className="text-center py-16 text-[var(--text-dim)]">
                {t('NO_POSTS')}
              </div>
            )}

            {!loading && filteredBlogs.length > 0 && (
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
            {!loading && <BlogSidebar tagCounts={tagCounts} variant="desktop" />}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--accent-dim)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      }
    >
      <BlogPageContent />
    </Suspense>
  );
}
