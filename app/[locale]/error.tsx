'use client';

import { useTranslations } from 'next-intl';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--bg)' }}
    >
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        {t('SOMETHING_WRONG')}
      </h2>
      <button
        onClick={reset}
        className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
        style={{
          background: 'transparent',
          border: '1px solid var(--accent)',
          color: 'var(--accent)',
          cursor: 'pointer',
        }}
      >
        {t('TRY_AGAIN')}
      </button>
    </div>
  );
}
