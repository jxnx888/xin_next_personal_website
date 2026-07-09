'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BlogPost } from '@/lib/types/blog';
import { getBlogImagePath, getReadTime } from '@/lib/utils/blogUtils';
import TagBadge from '@/components/blog/TagBadge';

interface BlogCardProps {
  post: BlogPost;
  currentTag?: string | null;
}

export default function BlogCard({ post, currentTag }: BlogCardProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const imagePath = getBlogImagePath(post.type[0]);
  const readTime = getReadTime(post.content);
  const href = `/${locale}/blog/${post.id}${currentTag ? `?from=${encodeURIComponent(currentTag)}` : ''}`;

  return (
    <Link href={href}>
      <div className="blog-card group">
        <div className="flex flex-row phone:flex-col pad-v:flex-col">

          {/* Mobile top cover — shown on phone+pad-v */}
          <div className="hidden phone:block pad-v:block relative overflow-hidden h-32">
            <img
              src={imagePath}
              alt={post.type[0]}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = '/image/blog/default.jpg'; }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--bg-secondary))' }} />
          </div>

          {/* Desktop side image */}
          <div className="shrink-0 relative overflow-hidden phone:hidden pad-v:hidden" style={{ width: '200px', minHeight: '155px' }}>
            <img
              src={imagePath}
              alt={post.type[0]}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500 absolute inset-0"
              onError={(e) => { (e.target as HTMLImageElement).src = '/image/blog/default.jpg'; }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent, var(--bg-secondary))' }} />
          </div>

          {/* Content */}
          <div className="p-6 flex-1">
            <h3 className="text-lg font-bold mb-2 text-[var(--text)] group-hover:text-[var(--accent)] transition-colors duration-200">
              {post.title}
            </h3>
            <p className="text-[var(--text-muted)] mb-4 line-clamp-2 text-sm leading-relaxed">
              {post.abstract}
            </p>
            <div className="flex items-center justify-between phone:flex-col phone:items-start phone:gap-3 pad-v:flex-col pad-v:items-start pad-v:gap-3">
              <div className="flex flex-wrap gap-2">
                {post.type.map((tag, index) => (
                  <TagBadge key={index} tag={tag} />
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-dim)] whitespace-nowrap">
                <span>{readTime} {t('MIN_READ')}</span>
                <span className="opacity-40">·</span>
                <span>{t('POSTED_AT', { time: post.time })}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
