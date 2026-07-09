'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { TagCount } from '@/lib/types/blog';
import SectionCard from '@/components/ui/SectionCard';

interface BlogSidebarProps {
  tagCounts: TagCount;
  totalCount: number;
  variant: 'mobile' | 'desktop';
}

export default function BlogSidebar({ tagCounts, totalCount, variant }: BlogSidebarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get('tag');

  const goToTag = (tag: string) => {
    if (currentTag === tag) return;
    router.push(`/${locale}/blog?tag=${encodeURIComponent(tag)}`);
  };
  const clearTag = () => router.push(`/${locale}/blog`);

  const tagList = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  if (variant === 'desktop') {
    // top = nav(80px) + 8px gap
    return (
      <div className="sticky top-[88px]">
        <SectionCard className="overflow-hidden">
          <div
            className="px-5 py-3 text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase"
            style={{ borderBottom: '1px solid var(--border-soft)' }}
          >
            {t('MY_TAGS')}
          </div>
          <div className="p-3 space-y-1">
            <button type="button" className={`tag-item ${!currentTag ? 'tag-active' : ''}`} onClick={clearTag}>
              {t('ALL_TAGS')} <span className="opacity-60 text-xs">({totalCount})</span>
            </button>
            {tagList.map(([tag, count]) => (
              <button
                type="button"
                key={tag}
                className={`tag-item ${currentTag === tag ? 'tag-active' : ''}`}
                onClick={() => goToTag(tag)}
              >
                {tag} <span className="opacity-60 text-xs">({count})</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  // Mobile dropdown — use item-level onClick for keyboard accessibility
  const menuItems = [
    { key: 'all', label: `${t('ALL_TAGS')} (${totalCount})`, onClick: clearTag },
    ...tagList.map(([tag, count]) => ({
      key: tag,
      label: `${tag} (${count})`,
      onClick: () => goToTag(tag),
    })),
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <button
        type="button"
        className="px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-[var(--text-muted)] whitespace-nowrap"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <span className="font-semibold text-sm">
          {currentTag || t('MY_TAGS')}
        </span>
        <DownOutlined style={{ fontSize: '11px' }} />
      </button>
    </Dropdown>
  );
}
