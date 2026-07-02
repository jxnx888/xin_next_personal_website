'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import ProjectCard from '@/components/projects/ProjectCard';
import ScrollMenu from '@/components/projects/ScrollMenu';
import { ProjectsResponse, ProjectsData } from '@/lib/types/projects';

export default function ProjectsPage() {
  const locale = useLocale();
  const t = useTranslations('projects');
  const [projectsData, setProjectsData] = useState<ProjectsData | null>(null);
  const [menuItems, setMenuItems] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const url = locale === 'zh'
          ? '/mock/projectsCN.json'
          : '/mock/projects.json';

        const response = await fetch(url);
        const data: ProjectsResponse = await response.json();

        if (data.code === 200) {
          setProjectsData(data.data);

          // Build menu items
          const menu: { [key: string]: string } = {};
          Object.entries(data.data).forEach(([key, value]) => {
            menu[key] = value.companySC;
          });
          setMenuItems(menu);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    fetchProjects();
  }, [locale]);

  if (!projectsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-64 phone:h-48 bg-gradient-to-r from-blue-600 to-purple-600">
        <Image
          src="/image/banner2.png"
          alt="Projects Banner"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl phone:text-2xl font-bold text-white mb-4">
              {t('bannerInfo')}
            </h1>
          </div>
        </div>
      </div>

      {/* Projects Main Content */}
      <div className="relative max-w-6xl mx-auto py-12 phone:py-8 projects-main">
        {/* Scroll Menu (Desktop only) */}
        <ScrollMenu menuItems={menuItems} />

        {/* Projects List */}
        <div className="max-w-5xl mx-auto px-4">
          {Object.entries(projectsData).map(([key, career]) => (
            <div key={key} id={key.replace(/ /g, '')} className="mb-16 phone:mb-12">
              {/* Career Header */}
              <div className="mb-8 phone:mb-6">
                <h2 className="text-3xl phone:text-2xl font-bold text-gray-800 mb-2">
                  {career.jobtitle}
                </h2>
                <h3 className="text-xl phone:text-lg text-gray-600 mb-4">
                  -- {career.companyName}
                </h3>

                {/* Responsibilities */}
                <div className="text-gray-700 phone:text-sm">
                  <p className="font-semibold mb-2">-- {t('responsibilities')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 phone:ml-2">
                    {career.responsibilities.map((resp, index) => (
                      <li key={index} className="leading-relaxed">{resp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Projects for this career */}
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
