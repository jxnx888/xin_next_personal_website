import { ReactNode, CSSProperties } from 'react';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function SectionCard({ children, className = '', style }: SectionCardProps) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', ...style }}
    >
      {children}
    </div>
  );
}
