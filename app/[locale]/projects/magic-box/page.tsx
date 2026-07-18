import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import MagicBoxLoader from './MagicBoxLoader';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const isZh = locale === 'zh';
  return {
    title: `Magic Box — 3D Builder | ${t('MY_NAME')}`,
    description: isZh
      ? '基于 Three.js 的教育类 3D 搭建应用，孩子们可以用几何形状和卡通积木拼建 3D 模型。'
      : 'Educational 3D builder app built with Three.js — kids assemble 3D models using geometric and cartoon shapes.',
    alternates: {
      canonical: `/${locale}/projects/magic-box`,
      languages: { 'x-default': '/en/projects/magic-box', en: '/en/projects/magic-box', zh: '/zh/projects/magic-box' },
    },
    openGraph: { url: `/${locale}/projects/magic-box` },
  };
}

export default function MagicBoxPage() {
  return <MagicBoxLoader />;
}
