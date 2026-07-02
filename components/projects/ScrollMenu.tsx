'use client';

import { useEffect, useState } from 'react';

interface ScrollMenuProps {
  menuItems: { [key: string]: string };
}

export default function ScrollMenu({ menuItems }: ScrollMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFixed, setIsFixed] = useState(false);

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
            if (scrollTop >= elementTop - 120) {
              currentIndex = index;
            }
          }
        });

        setActiveIndex(currentIndex);
      } else {
        setIsFixed(false);
        if (scrollTop < mainTop) {
          setActiveIndex(0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuItems]);

  const handleMenuClick = (key: string, index: number) => {
    const element = document.getElementById(key.replace(/ /g, ''));
    if (element) {
      const top = element.offsetTop - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  return (
    <div
      className={`hidden md:block w-32 ${isFixed ? 'fixed' : 'absolute'} right-0 top-36 z-10`}
      style={{ right: isFixed ? 'calc((100vw - 1200px) / 2 - 50px)' : '-50px' }}
    >
      {Object.entries(menuItems).map(([key, label], index) => (
        <div
          key={key}
          onClick={() => handleMenuClick(key, index)}
          className={`
            w-full h-9 leading-9 text-center text-sm font-bold rounded-full mb-2.5 cursor-pointer
            transition-colors duration-200
            ${activeIndex === index
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-orange-400 hover:text-white'
            }
          `}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
