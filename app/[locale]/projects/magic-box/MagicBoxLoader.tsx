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
        style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(0,212,255,0.15)', borderTopColor: '#00d4ff' }}
      />
    </div>
  ),
});

export default function MagicBoxLoader() {
  return <MagicBoxClient />;
}
