'use client';

import Link from 'next/link';
import { ReactNode, CSSProperties } from 'react';

interface GlowButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline';
  href?: string;
  download?: boolean;
  external?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function GlowButton({
  children,
  variant = 'primary',
  href,
  download,
  external,
  type = 'button',
  disabled,
  onClick,
  className = '',
  style,
}: GlowButtonProps) {
  const cls = `btn-glow-${variant} inline-flex items-center gap-2 rounded-lg font-bold tracking-wider transition-all duration-200 ${className}`;
  const baseStyle: CSSProperties = { padding: '11px 28px', fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', ...style };

  if (download && href)
    return <a href={href} download className={cls} style={baseStyle}>{children}</a>;

  if (href && (external || href.startsWith('http')))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={baseStyle}>
        {children}
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    );

  if (href)
    return <Link href={href} className={cls} style={baseStyle}>{children}</Link>;

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls} style={baseStyle}>
      {children}
    </button>
  );
}
