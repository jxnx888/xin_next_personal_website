'use client';

import dynamic from 'next/dynamic';

const MagicBoxClient = dynamic(() => import('./MagicBoxClient'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div
        className="animate-spin"
        style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--accent-dim)', borderTopColor: 'var(--accent)' }}
      />
    </div>
  ),
});

export default function MagicBoxLoader() {
  return <MagicBoxClient />;
}
