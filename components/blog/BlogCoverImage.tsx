'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface BlogCoverImageProps {
  src: string;
  alt: string;
  text: string; // drawn on a canvas placeholder when `src` fails to load
  sizes: string;
  priority?: boolean;
  className?: string;
}

// Falls back to a white-background / black-text canvas placeholder when the
// per-tag cover file (public/image/blog/<tag>.jpg) doesn't exist yet, instead
// of a broken-image icon.
export default function BlogCoverImage({ src, alt, text, sizes, priority, className }: BlogCoverImageProps) {
  const [broken, setBroken] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!broken) return;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const draw = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = `700 ${Math.max(14, Math.min(width, height) * 0.2)}px Arial, Helvetica, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [broken, text]);

  if (broken) {
    return (
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className={`absolute inset-0 w-full h-full ${className ?? ''}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
