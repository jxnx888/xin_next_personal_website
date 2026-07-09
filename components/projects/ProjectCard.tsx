'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Project } from '@/lib/types/projects';
import GlowButton from '@/components/ui/GlowButton';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations('projects');
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showQr && popupRef.current) popupRef.current.focus();
  }, [showQr]);

  useEffect(() => {
    if (!showQr) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (qrRef.current && !qrRef.current.contains(e.target as Node)) setShowQr(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowQr(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showQr]);

  return (
    <div
      id={project.title.replaceAll(' ', '')}
      className="project-card mb-6 rounded-xl overflow-hidden group border border-[var(--border)]"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="pad:flex pc:flex">
        {/* Image */}
        <div className="pad:w-2/5 pc:w-2/5 relative overflow-hidden" style={{ minHeight: '220px' }}>
          {project.url && !project.storeUrlQr ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 block"
              aria-label={`Visit ${project.title}`}
            >
              <Image
                src={project.img}
                alt={project.title}
                fill
                sizes="(max-width: 767px) 100vw, 40vw"
                className="object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500 cursor-pointer"
              />
            </a>
          ) : (
            <Image
              src={project.img}
              alt={project.title}
              fill
              sizes="(max-width: 767px) 100vw, 40vw"
              className="object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
            />
          )}
          <div className="absolute inset-0 phone:hidden pad-v:hidden pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, var(--bg-secondary))' }} />
        </div>

        {/* Content */}
        <div className="pad:w-3/5 pc:w-3/5 p-6">
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
              <GlowButton
                href={project.url}
                external
                style={{ padding: '6px 20px', fontSize: '14px' }}
              >
                {t('visitSite')}
              </GlowButton>
            )}
            {project.storeUrlQr && (project.storeUrlQr.ios || project.storeUrlQr.android) && (
              <div className="relative" ref={qrRef}>
                <button
                  onClick={() => setShowQr(v => !v)}
                  aria-expanded={showQr}
                  className="btn-glow-purple px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  {t('downloadApp')}
                </button>
                {showQr && (
                  <div
                    ref={popupRef}
                    tabIndex={-1}
                    role="dialog"
                    aria-label={t('downloadApp')}
                    aria-modal="true"
                    className="absolute bottom-full left-0 mb-2 p-4 rounded-xl z-10 outline-none"
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
                href={project.codeUrl || 'https://github.com/jxnx888'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('viewCode')} — ${project.title}`}
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
