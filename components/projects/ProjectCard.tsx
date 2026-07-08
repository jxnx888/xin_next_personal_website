'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Project } from '@/lib/types/projects';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations('projects');
  const [showQr, setShowQr] = useState(false);

  const handleCardClick = () => {
    if (project.url && !project.storeUrlQr) {
      window.open(project.url, '_blank');
    }
  };

  return (
    <div
      id={project.title.replaceAll(' ', '')}
      className="mb-6 rounded-xl overflow-hidden transition-all duration-300 group"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(0,212,255,0.2)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 24px rgba(0,212,255,0.06)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = '1px solid var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div className="md:flex">
        {/* Image */}
        <div className="md:w-2/5 relative overflow-hidden" style={{ minHeight: '220px' }}>
          <Image
            src={project.img}
            alt={project.title}
            fill
            className="object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500 cursor-pointer"
            onClick={handleCardClick}
          />
          <div className="absolute inset-0 phone:hidden" style={{ background: 'linear-gradient(to right, transparent, var(--bg-secondary))' }} />
        </div>

        {/* Content */}
        <div className="md:w-3/5 p-6">
          <h3
            className="text-xl phone:text-lg font-bold text-[var(--text)] mb-3"
            style={{ letterSpacing: '0.02em' }}
          >
            {project.title}
          </h3>
          <p className="text-[var(--text-muted)] mb-4 phone:text-sm leading-relaxed text-sm">
            {project.desc}
          </p>
          <div className="mb-5">
            <p className="text-xs text-[var(--text-dim)]">
              <span className="font-semibold tracking-wide uppercase text-[var(--text-muted)] mr-2">
                {t('techLabel')}:
              </span>
              {project.tags}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {project.url && !project.storeUrlQr && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-1.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: 'linear-gradient(135deg, #00d4ff, #0099b5)',
                  boxShadow: '0 0 10px rgba(0,212,255,0.15)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 16px rgba(0,212,255,0.28)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 10px rgba(0,212,255,0.15)';
                }}
              >
                {t('visitSite')}
              </a>
            )}
            {project.storeUrlQr && (project.storeUrlQr.ios || project.storeUrlQr.android) && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowQr(true)}
                  onMouseLeave={() => setShowQr(false)}
                  onClick={() => setShowQr(!showQr)}
                  className="px-5 py-1.5 rounded-lg text-sm font-semibold text-white transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #4f46e5)' }}
                >
                  {t('downloadApp')}
                </button>
                {showQr && (
                  <div
                    className="absolute bottom-full left-0 mb-2 p-4 rounded-xl z-10"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border-input)', boxShadow: '0 0 30px rgba(0,0,0,0.3)' }}
                  >
                    <div className="space-y-3">
                      {project.storeUrlQr.ios && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">iOS:</p>
                          <Image src={project.storeUrlQr.ios} alt="iOS QR" width={130} height={130} className="rounded" />
                        </div>
                      )}
                      {project.storeUrlQr.android && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Android:</p>
                          <Image src={project.storeUrlQr.android} alt="Android QR" width={130} height={130} className="rounded" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {project.code > 0 && (
              <a
                href="https://github.com/jxnx888"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-1.5 rounded-lg text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200"
                style={{ background: 'var(--bg)', border: '1px solid var(--border-input)' }}
              >
                {t('viewCode')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
