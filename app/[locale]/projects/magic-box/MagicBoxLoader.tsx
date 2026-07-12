'use client';

import dynamic from 'next/dynamic';

const MagicBoxClient = dynamic(() => import('./MagicBoxClient'), { ssr: false });

export default function MagicBoxLoader() {
  return <MagicBoxClient />;
}
