'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { TagCount } from '@/lib/types/blog';
import SectionCard from '@/components/ui/SectionCard';

interface BlogSidebarProps {
  tagCounts: TagCount;
  variant: 'mobile' | 'desktop';
}

export default function BlogSidebar({ tagCounts, variant }: BlogSidebarProps) {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const currentTag = searchParams.get('tag');

  const goToTag = (tag: string) => {
    if (currentTag === tag) return;
    router.push(`/${locale}/blog?tag=${tag}`);
  };
  const clearTag = () => router.push(`/${locale}/blog`);

  const tagList = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const total = Object.values(tagCounts).reduce((a, b) => a + b, 0);

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
            <div className={`tag-item ${!currentTag ? 'tag-active' : ''}`} onClick={clearTag}>
              All <span className="opacity-60 text-xs">({total})</span>
            </div>
            {tagList.map(([tag, count]) => (
              <div
                key={tag}
                className={`tag-item ${currentTag === tag ? 'tag-active' : ''}`}
                onClick={() => goToTag(tag)}
              >
                {tag} <span className="opacity-60 text-xs">({count})</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  // Mobile dropdown
  const menuItems = [
    { key: 'all', label: <div onClick={clearTag}>All ({total})</div> },
    ...tagList.map(([tag, count]) => ({
      key: tag,
      label: <div onClick={() => goToTag(tag)}>{tag} ({count})</div>,
    })),
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <div
        className="px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-[var(--text-muted)] whitespace-nowrap"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <span className="font-semibold text-sm">
          {currentTag || t('MY_TAGS')}
        </span>
        <DownOutlined style={{ fontSize: '11px' }} />
      </div>
    </Dropdown>
  );
}
