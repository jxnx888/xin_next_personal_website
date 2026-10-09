'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import ProjectCard from '@/components/projects/ProjectCard';
import ScrollMenu from '@/components/projects/ScrollMenu';
import PageBanner from '@/components/layout/PageBanner';
import type { ProjectsData } from '@/lib/types/projects';
import type { RobloxGamesData } from '@/lib/types/games';

interface ProjectsPageClientProps {
  projectsData: ProjectsData;
  menuItems: Record<string, string>;
  robloxGames: RobloxGamesData | null;
}

export default function ProjectsPageClient({ projectsData, menuItems, robloxGames }: ProjectsPageClientProps) {
  const t = useTranslations('projects');
  const tg = useTranslations();
  const tr = useTranslations('robloxGames');
  const locale = useLocale();

  if (Object.keys(projectsData).length === 0) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <PageBanner title={t('title')} subtitle={t('topInfo')} imageSrc="/image/banner2.png" />
        <div className="flex items-center justify-center py-24">
          <p className="text-[var(--text-muted)]">{tg('SOMETHING_WRONG')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner title={t('title')} subtitle={t('topInfo')} imageSrc="/image/banner2.png" />

      <div className="relative max-w-6xl mx-auto py-12 phone:py-8 projects-main">
        <ScrollMenu menuItems={menuItems} />

        <div className="max-w-5xl mx-auto px-4 pad:pr-40">
          {/* Side project — currently learning Roblox game development */}
          {robloxGames && (
            <div
              className="mb-16 phone:mb-12 rounded-xl border border-[var(--border)] p-8 phone:p-5"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <span
                className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase mb-3"
                style={{ color: 'var(--accent)' }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                {tr('learningBadge')}
              </span>
              <h2 className="text-2xl phone:text-xl font-bold text-[var(--text)] mb-4" style={{ letterSpacing: '0.03em' }}>
                {tr('ctaTitle')}
              </h2>
              <div className="space-y-3 mb-6">
                {robloxGames.intro.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-[var(--text-muted)]">{p}</p>
                ))}
              </div>

              <p className="font-semibold mb-2 text-[var(--text)] text-xs tracking-widest uppercase">
                {tr('learningPath')}
              </p>
              <ul className="space-y-1.5 ml-4 phone:ml-2 mb-6">
                {robloxGames.learnings.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-[var(--text-muted)] flex gap-2">
                    <span style={{ color: 'var(--accent)', opacity: 0.6 }}>›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                {robloxGames.games.map((game) => (
                  <Link
                    key={game.id}
                    href={`/${locale}/projects/roblox#${game.id}`}
                    className="btn-glow-outline inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
                  >
                    <span className="relative w-6 h-6 rounded overflow-hidden">
                      <Image src={game.icon} alt="" fill sizes="24px" className="object-cover" />
                    </span>
                    {game.title}
                  </Link>
                ))}
                <Link
                  href={`/${locale}/projects/roblox`}
                  className="btn-glow-primary px-5 py-2 rounded-lg text-sm font-semibold"
                >
                  {tr('ctaButton')}
                </Link>
              </div>
            </div>
          )}

          {Object.entries(projectsData).map(([key, career]) => (
            <div key={key} id={key.replace(/ /g, '')} className="mb-16 phone:mb-12">
              <div
                className="mb-8 phone:mb-6 pb-6"
                style={{ borderBottom: '1px solid var(--border-soft)' }}
              >
                <h2
                  className="text-2xl phone:text-xl font-bold text-[var(--text)] mb-1"
                  style={{ letterSpacing: '0.03em' }}
                >
                  {career.jobtitle}
                </h2>
                <h3 className="text-base text-[var(--accent)] mb-4 opacity-80">
                  {career.companyName}
                </h3>
                <div className="text-[var(--text-muted)] text-sm">
                  <p className="font-semibold mb-2 text-[var(--text)] text-xs tracking-widest uppercase">
                    {t('responsibilities')}
                  </p>
                  <ul className="space-y-1.5 ml-4 phone:ml-2">
                    {career.responsibilities.map((resp, index) => (
                      <li key={index} className="leading-relaxed flex gap-2">
                        <span style={{ color: 'var(--accent)', opacity: 0.6 }}>›</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {career.projects.map((project) => (
                <ProjectCard key={project.title} project={project} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
