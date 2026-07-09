'use client';

import { useEffect, useState } from 'react';

interface ScrollMenuProps {
  menuItems: { [key: string]: string };
}

export default function ScrollMenu({ menuItems }: ScrollMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFixed, setIsFixed] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const mainSection = document.querySelector('.projects-main');
      if (!mainSection) return;

      const mainTop = mainSection.getBoundingClientRect().top + scrollTop;
      const mainHeight = mainSection.clientHeight;
      const menuHeight = 400;

      if (scrollTop >= mainTop - 140 && scrollTop <= mainTop + mainHeight - menuHeight) {
        setIsFixed(true);
        const entries = Object.keys(menuItems);
        let currentIndex = 0;
        entries.forEach((key, index) => {
          const element = document.getElementById(key.replace(/ /g, ''));
          if (element) {
            const elementTop = element.getBoundingClientRect().top + scrollTop;
            if (scrollTop >= elementTop - 120) currentIndex = index;
          }
        });
        setActiveIndex(currentIndex);
      } else {
        setIsFixed(false);
        if (scrollTop < mainTop) setActiveIndex(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuItems]);

  const handleMenuClick = (key: string, index: number) => {
    const element = document.getElementById(key.replace(/ /g, ''));
    if (element) {
      window.scrollTo({ top: element.offsetTop - 120, behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  // pad: 1024–1279px, pc: 1280px+
  const isPad = viewportWidth >= 1024 && viewportWidth < 1280;

  const activeItemStyle = {
    background: 'linear-gradient(135deg, var(--accent), #0099b5)',
    color: '#fff' as const,
    boxShadow: '0 0 10px rgba(0,212,255,0.2)',
  };

  const inactiveItemStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)' as const,
  };

  const menuItems_entries = Object.entries(menuItems);

  return (
    <>
      {/* Mobile: fixed tab bar — phone and pad-v only, visible when in projects section */}
      <div
        className="pad:hidden pc:hidden z-40"
        style={{
          display: !isFixed ? 'none' : undefined,
          position: 'fixed',
          top: '56px',
          left: 0,
          right: 0,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <div className="flex flex-wrap gap-2 px-4 py-2">
          {menuItems_entries.map(([key, label], index) => (
            <button
              key={key}
              onClick={() => handleMenuClick(key, index)}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap bg-transparent cursor-pointer transition-all duration-200"
              style={activeIndex === index ? { ...activeItemStyle, border: 'none' } : inactiveItemStyle}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: fixed right-side menu — pad and pc, visible only when scrolled into projects section */}
      <div
        className="hidden pad:block pc:block w-32 z-10"
        style={{
          // Use display:none to hide (not negative right) — avoids visibility issues at wide viewports
          display: !isFixed ? 'none' : undefined,
          position: 'fixed',
          right: isPad ? '8px' : 'max(16px, calc((100vw - 1200px) / 2 - 50px))',
          top: '144px',
        }}
      >
        {menuItems_entries.map(([key, label], index) => (
          <div
            key={key}
            onClick={() => handleMenuClick(key, index)}
            className="w-full h-9 leading-9 text-center text-xs font-semibold rounded-lg mb-2.5 cursor-pointer transition-all duration-200"
            style={activeIndex === index ? activeItemStyle : inactiveItemStyle}
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
