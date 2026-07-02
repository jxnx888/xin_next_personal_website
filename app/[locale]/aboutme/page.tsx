'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

export default function AboutMePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [pdfLang, setPdfLang] = useState<'en' | 'cn'>(locale === 'zh' ? 'cn' : 'en');

  const pdfUrl = pdfLang === 'cn'
    ? '/file/XinNing-Resume-CN.pdf'
    : '/file/XinNing-Resume-EN.pdf';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl phone:text-2xl font-bold text-gray-800 mb-2">
            {t('ABOUT_ME')}
          </h1>
          <p className="text-gray-500 text-lg phone:text-base">
            {t('MY_NAME')} — {t('MY_TITLE')}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setPdfLang('en')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                pdfLang === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPdfLang('cn')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                pdfLang === 'cn'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              中文
            </button>
          </div>

          {/* Download Button */}
          <a
            href={pdfUrl}
            download
            className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('RESUME')}
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            key={pdfUrl}
            src={pdfUrl}
            className="w-full phone:hidden"
            style={{ height: '85vh', minHeight: '600px', border: 'none' }}
            title={`${t('MY_NAME')} Resume`}
          />
          {/* Mobile fallback */}
          <div className="hidden phone:flex flex-col items-center justify-center py-16 px-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-6 text-base">
              {locale === 'zh' ? '点击下方按钮查看简历' : 'Click below to view the resume'}
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              {locale === 'zh' ? '查看简历' : 'View Resume'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
