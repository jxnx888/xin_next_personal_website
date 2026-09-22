import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import DecalSplatterLoader from './DecalSplatterLoader';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const isZh = locale === 'zh';
  return {
    title: `Decal Splatter — 3D Customizer | ${t('MY_NAME')}`,
    description: isZh
      ? '交互式 3D 贴纸定制工具 — 点击行李箱贴上专属贴纸，可调整大小和旋转角度。'
      : 'Interactive 3D decal placement tool — click the luggage to apply stickers, adjust size and rotation.',
    alternates: {
      canonical: `/${locale}/projects/decal-splatter`,
      languages: { 'x-default': '/en/projects/decal-splatter', en: '/en/projects/decal-splatter', zh: '/zh/projects/decal-splatter' },
    },
    openGraph: { url: `/${locale}/projects/decal-splatter` },
  };
}

export default async function DecalSplatterPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DecalSplatterLoader />;
}
