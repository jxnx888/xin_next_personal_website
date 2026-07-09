'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ProjectCard from '@/components/projects/ProjectCard';
import ScrollMenu from '@/components/projects/ScrollMenu';
import PageBanner from '@/components/layout/PageBanner';
import { ProjectsResponse, ProjectsData } from '@/lib/types/projects';

export default function ProjectsPage() {
  const locale = useLocale();
  const t = useTranslations('projects');
  const tg = useTranslations();
  const [projectsData, setProjectsData] = useState<ProjectsData | null>(null);
  const [menuItems, setMenuItems] = useState<{ [key: string]: string }>({});
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const url = locale === 'zh' ? '/mock/projectsCN.json' : '/mock/projects.json';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: ProjectsResponse = await response.json();
        if (data.code === 200) {
          setProjectsData(data.data);
          const menu: { [key: string]: string } = {};
          Object.entries(data.data).forEach(([key, value]) => { menu[key] = value.companySC; });
          setMenuItems(menu);
        } else {
          setLoadError(true);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        setLoadError(true);
      }
    };
    fetchProjects();
  }, [locale]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="text-[var(--text-muted)]">{tg('SOMETHING_WRONG')}</p>
      </div>
    );
  }

  if (!projectsData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent-dim)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner title={t('title')} subtitle={t('topInfo')} imageSrc="/image/banner2.png" />

      {/* Projects Content */}
      <div className="relative max-w-6xl mx-auto py-12 phone:py-8 projects-main">
        <ScrollMenu menuItems={menuItems} />

        <div className="max-w-5xl mx-auto px-4 pad:pr-40">
          {Object.entries(projectsData).map(([key, career]) => (
            <div key={key} id={key.replace(/ /g, '')} className="mb-16 phone:mb-12">
              {/* Career Header */}
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
                <div className="text-[var(--text-muted)] phone:text-sm text-sm">
                  <p
                    className="font-semibold mb-2 text-[var(--text)] text-xs tracking-widest uppercase"
                  >
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
