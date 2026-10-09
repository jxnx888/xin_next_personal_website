import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getServerProjectsData, getServerRobloxGames } from '@/lib/utils/serverData';
import ProjectsPageClient from './ProjectsPageClient';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects' });
  const tg = await getTranslations({ locale });
  return {
    title: `${t('title')} | ${tg('MY_NAME')}`,
    description: t('topInfo'),
    alternates: {
      canonical: `/${locale}/projects`,
      languages: { 'x-default': '/en/projects', en: '/en/projects', zh: '/zh/projects' },
    },
    openGraph: {
      url: `/${locale}/projects`,
      images: [{ url: '/image/banner2.png', width: 1200, height: 630 }],
    },
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const projectsData = getServerProjectsData(locale);
  const robloxGames = getServerRobloxGames(locale);

  // The Roblox section sits above the careers, so it leads the scroll menu too
  const menuItems: Record<string, string> = robloxGames ? { Roblox: 'Roblox' } : {};
  Object.entries(projectsData).forEach(([key, career]) => {
    menuItems[key] = career.companySC;
  });

  return <ProjectsPageClient projectsData={projectsData} menuItems={menuItems} robloxGames={robloxGames} />;
}
