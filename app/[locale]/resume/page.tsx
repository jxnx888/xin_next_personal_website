'use client';

import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import PageBanner from '@/components/layout/PageBanner';
import SectionCard from '@/components/ui/SectionCard';

const PdfViewer = dynamic(
  () => import('@/components/resume/MobilePdfViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-16">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent-dim)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    ),
  }
);

export default function ResumePage() {
  const t = useTranslations();
  const locale = useLocale();

  const pdfUrl = locale === 'zh'
    ? '/file/XinNing-Resume-CN.pdf'
    : '/file/XinNing-Resume-EN.pdf';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner
        title={t('RESUME')}
        subtitle={`${t('MY_NAME')} — ${t('MY_TITLE')}`}
      />

      <div className="max-w-[860px] mx-auto p-4">
        <div className="flex justify-end mb-3">
          <a
            href={pdfUrl}
            download
            className="btn-glow-primary flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('DOWNLOAD_RESUME')}
          </a>
        </div>

        <SectionCard className="overflow-hidden">
          <PdfViewer pdfUrl={pdfUrl} />
        </SectionCard>
      </div>
    </div>
  );
}
