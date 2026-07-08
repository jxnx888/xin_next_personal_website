import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  linkHref?: string;
  linkLabel?: string;
}

export default function SectionHeader({ title, linkHref, linkLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span
          style={{
            color: 'var(--accent)',
            fontFamily: "'Courier New', monospace",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            opacity: 0.7,
          }}
        >
          {'//'}
        </span>
        <h2 className="text-base font-bold uppercase tracking-widest text-[var(--text)]">
          {title}
        </h2>
      </div>
      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="text-xs font-semibold tracking-wider transition-opacity duration-200 hover:opacity-100"
          style={{ color: 'var(--accent)', opacity: 0.7 }}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
