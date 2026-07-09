'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Menu, Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { menuData } from '@/lib/constants/menuData';
import { useTheme } from '@/components/ThemeProvider';

const SunIcon = () => (
  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

export default function Navigation() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();

  const [scrolled, setScrolled] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const lastScrollYRef = useRef(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY >= 80) {
        setScrolled(true);
        setHideNav(currentScrollY > lastScrollYRef.current);
      } else {
        setScrolled(false);
        setHideNav(false);
      }
      lastScrollYRef.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const localePrefix = useMemo(() => new RegExp(`^/${locale}`), [locale]);

  const changeLanguage = (newLocale: string) => {
    const currentPath = pathname.replace(localePrefix, '');
    const qs = window.location.search;
    router.push(`/${newLocale}${currentPath}${qs}`);
  };

  const isActive = (path: string) => {
    const cleanPath = pathname.replace(localePrefix, '');
    if (path === '/') return cleanPath === '' || cleanPath === '/';
    return cleanPath.startsWith(path);
  };

  return (
    <>
      <a href="#main-content" className="skip-to-content">{t('SKIP_TO_CONTENT')}</a>
      {/* scroll-hide only on desktop (pad+pc); phone/pad-v always visible */}
      <nav
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          scrolled && hideNav
            ? '-translate-y-full phone:translate-y-0 pad-v:translate-y-0'
            : 'translate-y-0'
        }`}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        {/* Default: desktop height + padding; phone/pad-v: compact */}
        <div className="h-[80px] phone:h-[56px] pad-v:h-[56px] max-w-[1200px] mx-auto flex items-center justify-between px-6 phone:px-4 pad-v:px-4">

          {/* Logo */}
          <Link href={`/${locale}/`}>
            <Image
              src="/image/logo.png"
              alt="Xin's Website"
              width={180}
              height={60}
              priority
              className="h-[60px] phone:h-[44px] pad-v:h-[44px] w-auto object-contain"
              style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)', opacity: 0.9 }}
            />
          </Link>

          {/* Desktop menu — default flex, hidden on phone + pad-v */}
          <div className="flex items-center gap-1 phone:hidden pad-v:hidden">
            {menuData.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}${item.routerLink}`}
                className={`relative px-4 py-2 text-base font-semibold transition-colors duration-200 ${
                  isActive(item.routerLink)
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {t(item.name)}
                {isActive(item.routerLink) && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                    style={{
                      width: '60%',
                      background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                      boxShadow: '0 0 6px var(--accent-glow)',
                    }}
                  />
                )}
              </Link>
            ))}

            {/* Language switcher */}
            <div
              className="ml-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm"
              style={{ border: '1px solid var(--border-input)' }}
            >
              <button
                aria-label="Switch to Chinese"
                className={`bg-transparent border-0 p-0 cursor-pointer transition-colors ${locale === 'zh' ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                onClick={() => changeLanguage('zh')}
              >
                中文
              </button>
              <span className="text-[var(--text-dim)]">|</span>
              <button
                aria-label="Switch to English"
                className={`bg-transparent border-0 p-0 cursor-pointer transition-colors ${locale === 'en' ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                onClick={() => changeLanguage('en')}
              >
                EN
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="ml-2 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
              style={{ border: '1px solid var(--border-input)', color: 'var(--text-muted)' }}
              aria-label={theme === 'dark' ? t('NAV_LIGHT_MODE') : t('NAV_DARK_MODE')}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>

          {/* Mobile hamburger — default hidden, shown on phone + pad-v */}
          <div className="hidden phone:flex pad-v:flex">
            <Button
              type="text"
              aria-label={t('NAV_OPEN_MENU')}
              icon={<MenuOutlined style={{ color: 'var(--text-muted)', fontSize: '18px' }} />}
              onClick={() => setMobileMenuOpen(true)}
            />
          </div>

        </div>
      </nav>

      {/* Mobile Drawer */}
      <Drawer
        title={<span style={{ color: 'var(--text)', letterSpacing: '2px', fontWeight: 700 }}>XIN NING</span>}
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={240}
      >
        <Menu
          mode="vertical"
          selectedKeys={menuData
            .filter(item => isActive(item.routerLink))
            .map(item => `/${locale}${item.routerLink === '/' ? '' : item.routerLink}`)
          }
          items={menuData.map((item) => ({
            key: `/${locale}${item.routerLink === '/' ? '' : item.routerLink}`,
            label: (
              <Link href={`/${locale}${item.routerLink}`} onClick={() => setMobileMenuOpen(false)}>
                {t(item.name)}
              </Link>
            ),
          }))}
        />

        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="text-xs text-[var(--text-muted)] mb-3 tracking-widest uppercase">{t('NAV_LANGUAGE')}</div>
          <div className="flex gap-4 mb-5">
            <button
              aria-label="Switch to Chinese"
              className={`bg-transparent border-0 p-0 cursor-pointer text-sm transition-colors ${locale === 'zh' ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)]'}`}
              onClick={() => { changeLanguage('zh'); setMobileMenuOpen(false); }}
            >
              中文
            </button>
            <button
              aria-label="Switch to English"
              className={`bg-transparent border-0 p-0 cursor-pointer text-sm transition-colors ${locale === 'en' ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)]'}`}
              onClick={() => { changeLanguage('en'); setMobileMenuOpen(false); }}
            >
              English
            </button>
          </div>
          <div className="text-xs text-[var(--text-muted)] mb-3 tracking-widest uppercase">{t('NAV_THEME')}</div>
          <button
            onClick={toggleTheme}
            className="bg-transparent border-0 p-0 flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors"
          >
            <span
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ border: '1px solid var(--border-input)', color: 'var(--text-muted)' }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </span>
            {theme === 'dark' ? t('NAV_LIGHT_MODE') : t('NAV_DARK_MODE')}
          </button>
        </div>
      </Drawer>
    </>
  );
}
