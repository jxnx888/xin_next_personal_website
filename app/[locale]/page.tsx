import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getServerProjectsData, getServerRobloxGames } from '@/lib/utils/serverData';
import HomeClient from './HomeClient';
import type { Locale } from '@/i18n/config';
import type { ProjectsData } from '@/lib/types/projects';
import type { RobloxGamesData } from '@/lib/types/games';

/**
 * Home-page stat values, derived from the projects/games data so they never go stale.
 * Computed at render time — on a statically built page that means at build, so the
 * year count advances on the next deploy after an anniversary.
 */
function getHomeStats(projects: ProjectsData, robloxGames: RobloxGamesData | null) {
  const careers = Object.values(projects);
  // startDate is "YYYY/MM"; years are counted from the earliest one, in whole years.
  const startMonths = careers.map((c) => {
    const [y, m] = c.startDate.split('/').map(Number);
    return y * 12 + (m - 1);
  });
  const now = new Date();
  const years = startMonths.length
    ? Math.floor((now.getFullYear() * 12 + now.getMonth() - Math.min(...startMonths)) / 12)
    : 0;
  const projectCount =
    careers.reduce((n, c) => n + c.projects.length, 0) + (robloxGames?.games.length ?? 0);
  return { years, projects: projectCount, companies: careers.length };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
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
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const robloxGames = getServerRobloxGames(locale);
  const stats = getHomeStats(getServerProjectsData(locale), robloxGames);
  const t = await getTranslations({ locale });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ning-xin.com';

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
      <HomeClient robloxGames={robloxGames} stats={stats} />
    </>
  );
}
