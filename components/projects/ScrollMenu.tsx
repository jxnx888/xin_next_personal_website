'use client';

import { useEffect, useState } from 'react';

interface ScrollMenuProps {
  menuItems: { [key: string]: string };
}

const MOBILE_NAV = 56;   // phone/pad-v nav height
const DESKTOP_NAV = 144; // pc/pad target top (nav 80px + gap)

export default function ScrollMenu({ menuItems }: ScrollMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  // viewport-relative top of projects-main, updated on every scroll
  const [sectionTop, setSectionTop] = useState(500);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
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

      // Visible when section enters viewport from below, hide when it has mostly scrolled past
      const visible = top < vh - 80 && bottom > 200;
      setSectionInView(visible);
      if (visible) setSectionTop(top);

      // Track active section
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
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

    update(); // run on mount
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [menuItems]);

  const handleMenuClick = (key: string, index: number) => {
    const el = document.getElementById(key.replace(/ /g, ''));
    if (el) {
      window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  const isPad = viewportWidth >= 1024 && viewportWidth < 1280;

  // top follows sectionTop until it hits the nav floor, then sticks
  const mobileTop = Math.max(MOBILE_NAV, sectionTop);
  const desktopTop = Math.max(DESKTOP_NAV, sectionTop);

  const activeStyle = {
    background: 'linear-gradient(135deg, var(--accent), #0099b5)',
    color: '#fff' as const,
    boxShadow: '0 0 10px rgba(0,212,255,0.2)',
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
        className="pad:hidden pc:hidden z-40"
        style={{
          position: 'fixed',
          top: mobileTop,
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
        className="hidden pad:block pc:block w-32 z-10"
        style={{
          position: 'fixed',
          right: isPad ? '8px' : 'max(16px, calc((100vw - 1200px) / 2 - 50px))',
          top: desktopTop,
          transition: 'top 0.05s linear',
        }}
      >
        {entries.map(([key, label], index) => (
          <div
            key={key}
            onClick={() => handleMenuClick(key, index)}
            className="w-full h-9 leading-9 text-center text-xs font-semibold rounded-lg mb-2.5 cursor-pointer transition-all duration-200"
            style={activeIndex === index ? { ...activeStyle, border: undefined } : inactiveStyle}
            onMouseEnter={(e) => {
              if (activeIndex !== index) {
                (e.currentTarget as HTMLDivElement).style.color = 'var(--text)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeIndex !== index) {
                (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
              }
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </>
  );
}
