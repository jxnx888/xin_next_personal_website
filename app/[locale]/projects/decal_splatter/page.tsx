import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import DecalSplatterLoader from './DecalSplatterLoader';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
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

export default function DecalSplatterPage() {
  return <DecalSplatterLoader />;
}
