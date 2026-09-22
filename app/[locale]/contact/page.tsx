import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ContactClient from './ContactClient';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
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

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactClient />;
}
