'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: '#0a0a0f',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e2e2e7', margin: 0 }}>
            Something went wrong
          </h2>
          <button
            onClick={reset}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: '1px solid #7c5cfc',
              background: 'transparent',
              color: '#7c5cfc',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
