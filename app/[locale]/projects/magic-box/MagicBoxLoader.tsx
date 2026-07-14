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
      background: 'rgba(79,147,240,.7)',
    }}>
      <img src="/image/3dBuilder/loading.gif" alt="Loading" style={{ width: 64, height: 64 }} />
    </div>
  ),
});

export default function MagicBoxLoader() {
  return <MagicBoxClient />;
}
