'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { BlogPost } from '@/lib/types/blog';
import { getBlogImagePath, getReadTime } from '@/lib/utils/blogUtils';
import TagBadge from '@/components/blog/TagBadge';

interface BlogCardProps {
  post: BlogPost;
  currentTag?: string | null;
  isPriority?: boolean;
}

export default function BlogCard({ post, currentTag, isPriority }: BlogCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const primaryTag = post.type[0];
  const imagePath = primaryTag ? getBlogImagePath(primaryTag) : '/image/blog/default.jpg';
  const coverAlt = primaryTag ? t('BLOG_COVER_ALT', { tag: primaryTag }) : '';
  const readTime = useMemo(() => getReadTime(post.content, locale), [post.content, locale]);
  const href = `/${locale}/blog/${post.id}${currentTag ? `?from=${encodeURIComponent(currentTag)}` : ''}`;

  return (
    <Link href={href}>
      <div className="blog-card group">
        <div className="flex flex-row phone:flex-col pad-v:flex-col">

          {/* Mobile top cover — shown on phone+pad-v */}
          <div className="hidden phone:block pad-v:block relative overflow-hidden h-32">
            <Image
              src={imagePath}
              alt={coverAlt}
              fill
              sizes="100vw"
              priority={isPriority}
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--bg-secondary))' }} />
          </div>

          {/* Desktop side image */}
          <div className="shrink-0 relative overflow-hidden phone:hidden pad-v:hidden" style={{ width: '200px', minHeight: '155px' }}>
            <Image
              src={imagePath}
              alt={coverAlt}
              fill
              sizes="200px"
              priority={isPriority}
              className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
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
                {post.type.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
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
