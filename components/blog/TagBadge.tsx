import { TAG_COLORS } from '@/lib/types/blog';

export default function TagBadge({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] || '#8b949e';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {tag}
    </span>
  );
}
