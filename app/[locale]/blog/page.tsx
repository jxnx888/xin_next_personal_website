'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Pagination } from 'antd';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import PageBanner from '@/components/layout/PageBanner';
import { BlogPost } from '@/lib/types/blog';
import { getBlogData, getTagCounts, filterBlogsByTag } from '@/lib/utils/blogUtils';
export default function BlogPage() {
  const t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [tagCounts, setTagCounts] = useState<{ [key: string]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(true);

  const currentTag = searchParams.get('tag');

  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);
      const data = await getBlogData(locale);
      setBlogs(data);
      setTagCounts(getTagCounts(data));
      setLoading(false);
    };
    loadBlogs();
  }, [locale]);

  useEffect(() => {
    setFilteredBlogs(filterBlogsByTag(blogs, currentTag || undefined));
    setCurrentPage(1);
  }, [blogs, currentTag]);

  const startIndex = (currentPage - 1) * pageSize;
  const currentBlogs = filteredBlogs.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                /*Mobile dropdown — hidden on desktop, shown on phone+pad-v*/
                <div className="hidden phone:block pad-v:block">
                  <BlogSidebar tagCounts={tagCounts} variant="mobile" />
                </div>
              )}
            </div>

            {loading && (
              <div className="text-center py-16">
                <div
                  className="inline-block w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }}
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
                  onShowSizeChange={handlePageChange}
                  pageSizeOptions={[5, 10, 20, 40]}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => t('POSTS_TOTAL', { count: total })}
                />
              </div>
            )}
          </div>

          {/* Desktop sidebar — shown by default, hidden on phone+pad-v */}
          <div className="w-56 shrink-0 phone:hidden pad-v:hidden">
            {!loading && <BlogSidebar tagCounts={tagCounts} variant="desktop" />}
          </div>

        </div>
      </div>
    </div>
  );
}
