import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getServerRobloxGames } from '@/lib/utils/serverData';
import RobloxGamesClient from './RobloxGamesClient';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'robloxGames' });
  const tg = await getTranslations({ locale });
  return {
    title: `${t('title')} | ${tg('MY_NAME')}`,
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/projects/roblox`,
      languages: {
        'x-default': '/en/projects/roblox',
        en: '/en/projects/roblox',
        zh: '/zh/projects/roblox',
      },
    },
    openGraph: {
      url: `/${locale}/projects/roblox`,
      images: [{ url: '/image/games/slayers-cover.webp', width: 1280, height: 722 }],
    },
  };
}

export default async function RobloxGamesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = getServerRobloxGames(locale);

  return <RobloxGamesClient data={data} />;
}
