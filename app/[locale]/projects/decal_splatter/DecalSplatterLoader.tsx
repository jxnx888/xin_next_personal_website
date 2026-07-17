'use client';

import dynamic from 'next/dynamic';

const DecalSplatterClient = dynamic(() => import('./DecalSplatterClient'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#cce0ff',
    }}>
      <img src="/image/decals/loading.gif" alt="Loading" style={{ width: 64, height: 64 }} />
    </div>
  ),
});

export default function DecalSplatterLoader() {
  return <DecalSplatterClient />;
}
