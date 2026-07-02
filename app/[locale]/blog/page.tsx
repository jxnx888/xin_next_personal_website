'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Pagination } from 'antd';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import { BlogPost } from '@/lib/types/blog';
import { getBlogData, getTagCounts, filterBlogsByTag } from '@/lib/utils/blogUtils';
import { useIsMobile } from '@/lib/hooks/useDeviceType';

export default function BlogPage() {
  const t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isMobile = useIsMobile();

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [tagCounts, setTagCounts] = useState<{ [key: string]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(true);

  const currentTag = searchParams.get('tag');

  // Load blog data
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

  // Filter blogs by tag
  useEffect(() => {
    const filtered = filterBlogsByTag(blogs, currentTag || undefined);
    setFilteredBlogs(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [blogs, currentTag]);

  // Get current page blogs
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentBlogs = filteredBlogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div
        className="h-48 bg-cover bg-center"
        style={{ backgroundImage: 'url(/image/banner3.png)' }}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Blog List */}
          <div className={`${isMobile ? 'w-full' : 'w-full md:w-2/3 lg:w-3/4'}`}>
            {/* Header */}
            <div className="mb-6 pb-3 border-b-2 border-gray-300">
              <h1 className="text-3xl font-bold">
                {t('ARTICLES')}{' '}
                {currentTag && (
                  <span className="text-xl text-gray-600 font-normal">
                    ({currentTag})
                  </span>
                )}{' '}
                ({filteredBlogs.length})
              </h1>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Blog Cards */}
            {!loading && currentBlogs.length > 0 && (
              <div>
                {currentBlogs.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && currentBlogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-xl">No blog posts found.</p>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredBlogs.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredBlogs.length}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  pageSizeOptions={['5', '10', '20', '40']}
                  showSizeChanger={!isMobile}
                  showQuickJumper={!isMobile}
                  size={isMobile ? 'small' : 'default'}
                  showTotal={(total) => `Total ${total} posts`}
                />
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className={`${isMobile ? 'w-full' : 'w-full md:w-1/3 lg:w-1/4'}`}>
            {!loading && <BlogSidebar tagCounts={tagCounts} />}
          </div>
        </div>
      </div>
    </div>
  );
}
