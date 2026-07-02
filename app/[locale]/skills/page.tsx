'use client';

import { useTranslations } from 'next-intl';
import SkillProgressBar from '@/components/skills/SkillProgressBar';
import { developerSkills, softSkillsKeys } from '@/lib/constants/skillsData';

export default function SkillsPage() {
  const t = useTranslations('skills');

  // Convert soft skills to use translations
  const softSkills = Object.entries(softSkillsKeys).map(([key, value]) => ({
    name: t(`softSkillName.${key}`),
    value
  }));

  return (
    <div
      className="min-h-screen relative py-12 px-4 phone:px-6 phone:py-8"
      style={{
        background: "url('/image/meteorshower.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content Container */}
      <div className="relative max-w-6xl mx-auto">
        {/* Page Title */}
        <h1 className="text-5xl phone:text-3xl text-white font-bold text-center mb-4">
          {t('title')}
        </h1>

        {/* Info Paragraphs */}
        <div className="text-white text-center mb-12 phone:mb-8 max-w-4xl mx-auto space-y-4 phone:space-y-3">
          {t.raw('infor').slice(1).map((info: string, index: number) => (
            <p key={index} className="text-xl phone:text-base leading-relaxed phone:text-left">
              {info}
            </p>
          ))}
        </div>

        {/* Developer Skills Section */}
        <div className="mb-16 phone:mb-12">
          <h2 className="text-4xl phone:text-2xl text-white font-bold mb-8 phone:mb-6">
            {t('devSkill')}
          </h2>
          <div className="grid grid-cols-2 phone:grid-cols-1 gap-x-8 gap-y-4">
            {Object.entries(developerSkills).map(([skill, percentage], index) => (
              <SkillProgressBar
                key={skill}
                skillName={skill}
                percentage={percentage}
                delay={index * 100}
              />
            ))}
          </div>
        </div>

        {/* Soft Skills Section */}
        <div className="mb-16 phone:mb-12">
          <h2 className="text-4xl phone:text-2xl text-white font-bold mb-8 phone:mb-6">
            {t('SoftSkill')}
          </h2>
          <div className="grid grid-cols-2 phone:grid-cols-1 gap-x-8 gap-y-4">
            {softSkills.map((skill, index) => (
              <SkillProgressBar
                key={skill.name}
                skillName={skill.name}
                percentage={skill.value}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
