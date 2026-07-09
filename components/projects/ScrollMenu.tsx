'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ScrollMenuProps {
  menuItems: { [key: string]: string };
}

const MOBILE_NAV = 56;
const DESKTOP_NAV = 144;

export default function ScrollMenu({ menuItems }: ScrollMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1280);

  // Refs for direct DOM writes — avoids setState (and re-render) on every scroll tick
  const mobileBarRef = useRef<HTMLDivElement>(null);
  const desktopBarRef = useRef<HTMLDivElement>(null);
  const lastTopRef = useRef(500);

  // Sync initial top immediately after bars mount (prevents top:auto flash)
  useLayoutEffect(() => {
    if (!sectionInView) return;
    if (mobileBarRef.current) mobileBarRef.current.style.top = `${Math.max(MOBILE_NAV, lastTopRef.current)}px`;
    if (desktopBarRef.current) desktopBarRef.current.style.top = `${Math.max(DESKTOP_NAV, lastTopRef.current)}px`;
  }, [sectionInView]);

  useEffect(() => {
    setViewportWidth(window.innerWidth);
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const update = () => {
      const section = document.querySelector('.projects-main') as HTMLElement | null;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const top = rect.top;
      const bottom = rect.bottom;
      const vh = window.innerHeight;

      const visible = top < vh - 80 && bottom > 200;
      setSectionInView(visible);

      if (visible) {
        lastTopRef.current = top;
        // Direct DOM write: no setState, no React re-render for smooth top tracking
        if (mobileBarRef.current) mobileBarRef.current.style.top = `${Math.max(MOBILE_NAV, top)}px`;
        if (desktopBarRef.current) desktopBarRef.current.style.top = `${Math.max(DESKTOP_NAV, top)}px`;
      }

      // Track active section
      const scrollTop = window.scrollY;
      const entries = Object.keys(menuItems);
      let cur = 0;
      entries.forEach((key, i) => {
        const el = document.getElementById(key.replace(/ /g, ''));
        if (el) {
          const elTop = el.getBoundingClientRect().top + scrollTop;
          if (scrollTop >= elTop - 120) cur = i;
        }
      });
      setActiveIndex(cur);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [menuItems]);

  const handleMenuClick = (key: string, index: number) => {
    const el = document.getElementById(key.replace(/ /g, ''));
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  const isPad = viewportWidth >= 1024 && viewportWidth < 1280;

  const activeStyle = {
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
    color: 'var(--btn-text)' as const,
    boxShadow: '0 0 10px var(--accent-glow)',
    border: 'none',
  };

  const inactiveStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)' as const,
  };

  const entries = Object.entries(menuItems);

  if (!sectionInView) return null;

  return (
    <>
      {/* Mobile: follows section top then sticks — phone and pad-v only */}
      <div
        ref={mobileBarRef}
        className="pad:hidden pc:hidden z-40"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border-soft)',
          transition: 'top 0.05s linear',
        }}
      >
        <div className="flex flex-wrap gap-2 px-4 py-2">
          {entries.map(([key, label], index) => (
            <button
              key={key}
              onClick={() => handleMenuClick(key, index)}
              aria-current={activeIndex === index ? 'true' : undefined}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap bg-transparent cursor-pointer transition-all duration-200"
              style={activeIndex === index ? activeStyle : inactiveStyle}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: follows section top then sticks — pad and pc only */}
      <div
        ref={desktopBarRef}
        className="hidden pad:block pc:block w-32 z-10"
        style={{
          position: 'fixed',
          right: isPad ? '8px' : 'max(16px, calc((100vw - 1200px) / 2 - 50px))',
          transition: 'top 0.05s linear',
        }}
      >
        {entries.map(([key, label], index) => (
          <button
            type="button"
            key={key}
            onClick={() => handleMenuClick(key, index)}
            aria-current={activeIndex === index ? 'true' : undefined}
            className="w-full h-9 leading-9 text-center text-xs font-semibold rounded-lg mb-2.5 cursor-pointer transition-all duration-200"
            style={activeIndex === index ? { ...activeStyle, border: undefined } : inactiveStyle}
            onMouseEnter={(e) => {
              if (activeIndex !== index) {
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.borderColor = 'var(--accent-glow)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeIndex !== index) {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }
            }}
            onFocus={(e) => {
              if (activeIndex !== index) {
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.borderColor = 'var(--accent-glow)';
              }
            }}
            onBlur={(e) => {
              if (activeIndex !== index) {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
