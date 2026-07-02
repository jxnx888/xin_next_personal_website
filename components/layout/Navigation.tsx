'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { menuData } from '@/lib/constants/menuData';
import { useIsMobile } from '@/lib/hooks/useDeviceType';

export default function Navigation() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = params.locale as string;
  const isMobile = useIsMobile();

  const [scrolled, setScrolled] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const navHeight = 100;

      if (currentScrollY >= navHeight) {
        setScrolled(true);
        setHideNav(currentScrollY > lastScrollY);
      } else {
        setScrolled(false);
        setHideNav(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const changeLanguage = (newLocale: string) => {
    const currentPath = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${currentPath}`);
  };

  const isActive = (path: string) => {
    const cleanPath = pathname.replace(`/${locale}`, '');
    if (path === '/') return cleanPath === '' || cleanPath === '/';
    return cleanPath.startsWith(path);
  };

  // Desktop Navigation
  if (!isMobile) {
    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-all duration-200 ${
          scrolled ? (hideNav ? '-translate-y-full' : 'translate-y-0') : ''
        }`}
      >
        <div className="max-w-[1200px] h-[100px] mx-auto flex items-center justify-between px-4">
          {/* Logo */}
          <div className="w-[160px] h-[100px]">
            <Link href={`/${locale}/`}>
              <img src="/image/logo.png" alt="Xin's Website" className="h-full w-full object-contain" />
            </Link>
          </div>

          {/* Menu Items */}
          <div className="flex items-center gap-1">
            {menuData.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}${item.routerLink}`}
                className={`px-3 py-2 text-lg font-bold transition-opacity ${
                  isActive(item.routerLink)
                    ? 'opacity-100 border-b-2 border-blue-500'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {t(item.name)}
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="ml-4 flex items-center gap-2">
              <a
                className={`cursor-pointer text-base transition-colors ${
                  locale === 'zh' ? 'text-blue-500 font-bold' : 'text-gray-600 hover:text-blue-500'
                }`}
                onClick={() => changeLanguage('zh')}
              >
                中文
              </a>
              <span className="text-gray-400">|</span>
              <a
                className={`cursor-pointer text-base transition-colors ${
                  locale === 'en' ? 'text-blue-500 font-bold' : 'text-gray-600 hover:text-blue-500'
                }`}
                onClick={() => changeLanguage('en')}
              >
                English
              </a>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Mobile Navigation
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="h-[60px] flex items-center justify-between px-4">
          <Link href={`/${locale}/`}>
            <img src="/image/logo.png" alt="Xin's Website" className="h-[50px]" />
          </Link>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            size="large"
          />
        </div>
      </nav>

      <Drawer
        title={t('MY_NAME')}
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
      >
        <Menu mode="vertical" selectedKeys={[pathname]}>
          {menuData.map((item) => (
            <Menu.Item key={`/${locale}${item.routerLink}`}>
              <Link
                href={`/${locale}${item.routerLink}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(item.name)}
              </Link>
            </Menu.Item>
          ))}
        </Menu>

        <div className="mt-6 p-4 border-t">
          <div className="text-sm text-gray-600 mb-2">Language / 语言</div>
          <div className="flex gap-4">
            <a
              className={`cursor-pointer ${locale === 'zh' ? 'text-blue-500 font-bold' : 'text-gray-600'}`}
              onClick={() => {
                changeLanguage('zh');
                setMobileMenuOpen(false);
              }}
            >
              中文
            </a>
            <a
              className={`cursor-pointer ${locale === 'en' ? 'text-blue-500 font-bold' : 'text-gray-600'}`}
              onClick={() => {
                changeLanguage('en');
                setMobileMenuOpen(false);
              }}
            >
              English
            </a>
          </div>
        </div>
      </Drawer>
    </>
  );
}
