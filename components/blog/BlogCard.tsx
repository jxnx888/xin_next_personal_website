'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { BlogPost, TAG_COLORS } from '@/lib/types/blog';
import { getBlogImagePath } from '@/lib/utils/blogUtils';
import { useIsMobile } from '@/lib/hooks/useDeviceType';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const isMobile = useIsMobile();

  const imagePath = getBlogImagePath(post.type[0]);

  return (
    <Link href={`/${locale}/blog/${post.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden mb-6 cursor-pointer">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
          {/* Image */}
          {!isMobile && (
            <div className="w-full md:w-1/3 relative h-48 md:h-auto">
              <img
                src={imagePath}
                alt={post.type[0]}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/image/blog/default.jpg';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className={`p-6 ${isMobile ? 'w-full' : 'w-2/3'}`}>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 hover:text-blue-600 transition-colors">
              {post.title}
            </h3>

            <p className="text-gray-600 mb-4 line-clamp-3">
              {post.abstract}
            </p>

            {/* Tags and Date */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-start ${isMobile ? 'items-start' : 'md:items-center'} justify-between gap-2`}>
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {post.type.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: TAG_COLORS[tag] || '#999',
                      color: '#fff',
                      opacity: 0.9,
                    }}
                  >
                    <span className="mr-1">📌</span>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Date */}
              <div className={`text-sm text-gray-500 whitespace-nowrap ${isMobile ? 'mt-2' : ''}`}>
                {t('POSTED')} @ {post.time}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
