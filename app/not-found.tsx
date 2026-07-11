import GlowButton from '@/components/ui/GlowButton';
import GridBackground from '@/components/ui/GridBackground';

export default function NotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, background: '#0d1117', color: '#e6edf3', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
<div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', position: 'relative', overflow: 'hidden' }}>
          <GridBackground />

          <div style={{ position: 'relative' }}>
            <p style={{ fontFamily: "'Courier New', monospace", color: '#00d4ff', fontSize: '11px', letterSpacing: '0.3em', marginBottom: '12px', opacity: 0.65 }}>
              {'// ERROR_CODE: 404'}
            </p>

            <h1 style={{ fontSize: 'clamp(100px, 18vw, 180px)', fontWeight: 900, lineHeight: 1, color: 'transparent', WebkitTextStroke: '1.5px rgba(0,212,255,0.25)', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              404
            </h1>

            <h2 style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#e6edf3', margin: '0 0 12px' }}>
              Page Not Found
            </h2>

            <p style={{ color: '#8b949e', fontSize: '14px', margin: '0 auto 36px', maxWidth: '360px' }}>
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>

            <GlowButton href="/">← Back to Home</GlowButton>
          </div>
        </div>
      </body>
    </html>
  );
}
