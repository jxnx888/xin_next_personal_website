'use client';

import { TAG_COLORS } from '@/lib/types/blog';
import { useTheme } from '@/components/ThemeProvider';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darken(hex: string, factor: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function TagBadge({ tag }: { tag: string }) {
  const { theme } = useTheme();
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

  // Darken text color in light mode for WCAG AA contrast
  const textColor = theme === 'light' ? darken(hex, 0.65) : hex;
  const bgAlpha = theme === 'light' ? 0.1 : 0.13;
  const borderAlpha = theme === 'light' ? 0.2 : 0.27;

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{
        background: hexToRgba(hex, bgAlpha),
        color: textColor,
        border: `1px solid ${hexToRgba(hex, borderAlpha)}`,
      }}
    >
      {tag}
    </span>
  );
}
