'use client';

import { useTranslations } from 'next-intl';
import { use, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { BlogPost } from '@/lib/types/blog';
import { getBlogData } from '@/lib/utils/blogUtils';

export default function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = use(params);
  const t = useTranslations();

  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      const blogs = await getBlogData(locale);
      const foundBlog = blogs.find((b) => b.id.toString() === id);

      if (foundBlog) {
        // Fix image referrer issues
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">{t('SOMETHING_WRONG')}</h1>
        <Link
          href={`/${locale}/blog`}
          className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeftOutlined /> Back to Blog List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner (reduced height for detail page) */}
      <div
        className="h-32 bg-cover bg-center"
        style={{ backgroundImage: 'url(/image/banner3.png)' }}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeftOutlined /> {t('BACK')} to Blog List
        </Link>

        {/* Blog Content */}
        <article className="bg-white rounded-lg shadow-md p-8">
          {/* Title */}
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-900">
            {blog.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-gray-600 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm">{t('POSTED')} @</span>
              <span className="text-sm font-semibold">{blog.time}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {blog.type.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* HTML Content */}
          <div
            id="cnblogs_post_body"
            className="blog-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>
      </div>

      <style jsx global>{`
        .blog-content {
          line-height: 1.8;
          color: #333;
        }

        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .blog-content h2 {
          font-size: 1.875rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .blog-content h3 {
          font-size: 1.5rem;
        }

        .blog-content p {
          margin-bottom: 1rem;
        }

        .blog-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }

        .blog-content pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }

        .blog-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5rem auto;
          display: block;
          border-radius: 0.5rem;
        }

        .blog-content ul,
        .blog-content ol {
          margin-left: 2rem;
          margin-bottom: 1rem;
        }

        .blog-content li {
          margin-bottom: 0.5rem;
        }

        .blog-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #4b5563;
        }

        .blog-content a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .blog-content a:hover {
          color: #2563eb;
        }

        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }

        .blog-content th,
        .blog-content td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }

        .blog-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }

        /* Syntax highlighter styles */
        .cnblogs_code,
        .cnblogs_Highlighter {
          background-color: #1f2937 !important;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }

        .syntaxhighlighter {
          background-color: #1f2937 !important;
        }
      `}</style>
    </div>
  );
}
