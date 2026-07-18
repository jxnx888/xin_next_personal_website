'use client';

import { useTranslations } from 'next-intl';
import { Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { TagCount } from '@/lib/types/blog';
import SectionCard from '@/components/ui/SectionCard';

interface BlogSidebarProps {
  tagCounts: TagCount;
  totalCount: number;
  variant: 'mobile' | 'desktop';
  currentTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export default function BlogSidebar({ tagCounts, totalCount, variant, currentTag, onTagChange }: BlogSidebarProps) {
  const t = useTranslations();
  const tagList = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  if (variant === 'desktop') {
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
            <button type="button" className={`tag-item ${!currentTag ? 'tag-active' : ''}`} onClick={() => onTagChange(null)}>
              {t('ALL_TAGS')} <span className="opacity-60 text-xs">({totalCount})</span>
            </button>
            {tagList.map(([tag, count]) => (
              <button
                type="button"
                key={tag}
                className={`tag-item ${currentTag === tag ? 'tag-active' : ''}`}
                onClick={() => onTagChange(tag)}
              >
                {tag} <span className="opacity-60 text-xs">({count})</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  const menuItems = [
    { key: 'all', label: `${t('ALL_TAGS')} (${totalCount})`, onClick: () => onTagChange(null) },
    ...tagList.map(([tag, count]) => ({
      key: tag,
      label: `${tag} (${count})`,
      onClick: () => onTagChange(tag),
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
