import { ImageResponse } from 'next/og';
import { getServerBlogBySlug } from '@/lib/utils/serverData';

export const runtime = 'nodejs';
export const revalidate = 2592000;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const blog = await getServerBlogBySlug(id, locale).catch(() => null);
  const title = blog?.title ?? 'Blog';
  const tags = blog?.type?.slice(0, 3) ?? [];
  const date = blog?.time ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#080c18',
          padding: '64px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Accent bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
          <div style={{ width: '48px', height: '4px', background: '#00d4ff', borderRadius: '2px' }} />
          <span style={{ color: '#00d4ff', fontSize: '18px', letterSpacing: '0.1em' }}>ning-xin.com</span>
        </div>

        {/* Title */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-start',
            fontSize: title.length > 60 ? 42 : 52,
            fontWeight: 700,
            color: '#e2e8f0',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        {/* Footer: tags + date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  padding: '5px 16px',
                  background: 'rgba(0,212,255,0.1)',
                  border: '1px solid rgba(0,212,255,0.3)',
                  borderRadius: '20px',
                  color: '#00d4ff',
                  fontSize: '16px',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          {date && (
            <span style={{ color: '#4a5568', fontSize: '16px' }}>{date}</span>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
