'use client';

import { TAG_COLORS } from '@/lib/types/blog';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TagBadge({ tag }: { tag: string }) {
  const hex = TAG_COLORS[tag];

  if (!hex) {
    return (
      <span
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{ background: 'var(--accent-dim)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        {tag}
      </span>
    );
  }

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{
        background: hexToRgba(hex, 0.13),
        color: hex,
        border: `1px solid ${hexToRgba(hex, 0.27)}`,
      }}
    >
      {tag}
    </span>
  );
}
