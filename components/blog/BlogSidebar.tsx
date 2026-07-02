'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { TagCount } from '@/lib/types/blog';
import { useIsMobile } from '@/lib/hooks/useDeviceType';

interface BlogSidebarProps {
  tagCounts: TagCount;
}

export default function BlogSidebar({ tagCounts }: BlogSidebarProps) {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const isMobile = useIsMobile();

  const currentTag = searchParams.get('tag');

  const goToTag = (tag: string) => {
    if (currentTag === tag) return;
    router.push(`/${locale}/blog?tag=${tag}`);
  };

  const clearTag = () => {
    router.push(`/${locale}/blog`);
  };

  // Desktop sidebar
  if (!isMobile) {
    return (
      <div className="sticky top-[120px]">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-xl font-bold mb-4 pb-2 border-b border-gray-300">
            {t('MY_TAGS')}
          </div>
          <div className="space-y-2">
            <div
              className={`cursor-pointer px-3 py-2 rounded transition-colors ${
                !currentTag ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
              }`}
              onClick={clearTag}
            >
              All ({Object.values(tagCounts).reduce((a, b) => a + b, 0)})
            </div>
            {Object.entries(tagCounts)
              .sort((a, b) => b[1] - a[1]) // Sort by count desc
              .map(([tag, count]) => (
                <div
                  key={tag}
                  className={`cursor-pointer px-3 py-2 rounded transition-colors ${
                    currentTag === tag
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => goToTag(tag)}
                >
                  {tag} ({count})
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Mobile dropdown
  const menuItems = [
    {
      key: 'all',
      label: (
        <div onClick={clearTag}>
          All ({Object.values(tagCounts).reduce((a, b) => a + b, 0)})
        </div>
      ),
    },
    ...Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({
        key: tag,
        label: (
          <div onClick={() => goToTag(tag)}>
            {tag} ({count})
          </div>
        ),
      })),
  ];

  return (
    <div className="mb-4">
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomLeft"
      >
        <div className="bg-white px-4 py-2 rounded shadow cursor-pointer flex items-center justify-between">
          <span className="font-semibold">{t('MY_TAGS')}</span>
          <DownOutlined />
        </div>
      </Dropdown>
    </div>
  );
}
