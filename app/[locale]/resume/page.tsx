import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ResumeClient from './ResumeClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('RESUME')} | ${t('MY_NAME')}`,
    description: t('RESUME_META_DESCRIPTION'),
    alternates: {
      canonical: `/${locale}/resume`,
      languages: { 'x-default': '/en/resume', en: '/en/resume', zh: '/zh/resume' },
    },
    openGraph: { url: `/${locale}/resume` },
  };
}

export default function ResumePage() {
  return <ResumeClient />;
}
