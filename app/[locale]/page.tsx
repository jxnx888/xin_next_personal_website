import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HomeClient from './HomeClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = t('META_TITLE');
  const description = t('META_DESCRIPTION');
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { 'x-default': '/en', en: '/en', zh: '/zh' },
    },
    openGraph: { url: `/${locale}` },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xin-ning.com';

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: t('MY_NAME'),
    url: `${siteUrl}/${locale}`,
    jobTitle: t('MY_TITLE'),
    sameAs: [
      'https://www.linkedin.com/in/xin-ning-28818b115/',
      'https://www.facebook.com/jxnx888',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('MY_NAME'),
    url: `${siteUrl}/${locale}`,
    inLanguage: locale === 'zh' ? 'zh-CN' : 'en-US',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomeClient />
    </>
  );
}
