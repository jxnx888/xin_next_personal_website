'use client';

import { useEffect, useRef } from 'react';

interface AnimatedNameProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedName({ name, className = '', style }: AnimatedNameProps) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    letterRefs.current.forEach((span, i) => {
      if (!span) return;
      ids.push(setTimeout(() => {
        span.style.animation = 'bounceIn 1s both';
      }, i * 100));
    });
    return () => ids.forEach(clearTimeout);
  }, [name]);

  const handleHover = (e: React.MouseEvent<HTMLSpanElement>) => {
    const el = e.currentTarget;
    el.style.opacity = '1';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'rubberBand 1s both';
  };

  return (
    <h1 className={className} style={style} aria-label={name}>
      {name.split('').map((char, i) => (
        <span
          key={`${char}_${i}`}
          aria-hidden="true"
          ref={el => { letterRefs.current[i] = el; }}
          style={{ opacity: 0, display: 'inline-block', minWidth: char === ' ' ? '0.3em' : undefined }}
          className="cursor-default transition-colors duration-300"
          onMouseEnter={handleHover}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </h1>
  );
}
