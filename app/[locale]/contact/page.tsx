import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ContactClient from './ContactClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('CONTACT')} | ${t('MY_NAME')}`,
    description: t('CONTACT_META_DESCRIPTION'),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { 'x-default': '/en/contact', en: '/en/contact', zh: '/zh/contact' },
    },
    openGraph: { url: `/${locale}/contact` },
  };
}

export default function ContactPage() {
  return <ContactClient />;
}
