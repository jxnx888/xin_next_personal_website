import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getServerProjectsData } from '@/lib/utils/serverData';
import ProjectsPageClient from './ProjectsPageClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
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
    openGraph: { url: `/${locale}/projects` },
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const projectsData = getServerProjectsData(locale);

  const menuItems: Record<string, string> = {};
  Object.entries(projectsData).forEach(([key, career]) => {
    menuItems[key] = career.companySC;
  });

  return <ProjectsPageClient projectsData={projectsData} menuItems={menuItems} />;
}
