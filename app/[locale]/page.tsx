'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useTypewriter } from '@/lib/hooks/useTypewriter';
import AnimatedName from '@/components/home/AnimatedName';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import HeroWave from '@/components/home/HeroWave';
import GlowButton from '@/components/ui/GlowButton';
import SectionCard from '@/components/ui/SectionCard';
import GridBackground from '@/components/ui/GridBackground';
import SectionHeader from '@/components/ui/SectionHeader';

const TECH_ROW1 = ['React', 'Next.js', 'Vue.js', 'Three.js', 'Node.js', 'Sitecore', 'Uniform'];
const TECH_ROW2 = ['JavaScript', 'TypeScript', 'HTML5 / CSS3', 'Tailwind CSS', 'Segment', 'Optimizely'];

const FEATURED_PROJECTS_STATIC = [
  { company: 'LCI Education',  img: '/image/projects/lci.jpg',       tags: ['Next.js', 'TypeScript', 'React', 'i18n'],            url: 'https://www.lcieducation.com/' },
  { company: 'Great Wall Motor', img: '/image/projects/greatWall.jpg', tags: ['React Hooks', 'Vue.js', 'JavaScript', 'CSS3'],       url: 'https://www.gwm.co.th/en/' },
  { company: 'Kai Rong',       img: '/image/projects/magicBox.jpg',  tags: ['Three.js', 'JavaScript', 'iOS', 'Android'],          url: null },
] as const;

export default function HomePage() {
  const t = useTranslations();
  const tp = useTranslations('projects');
  const locale = useLocale();
  const featuredI18n = (t.raw('FEATURED_PROJECTS') as { title: string; desc: string }[]) ?? [];
  const featuredProjects = FEATURED_PROJECTS_STATIC.map((p, i) => ({ ...p, ...(featuredI18n[i] ?? { title: p.company, desc: '' }) }));
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const words = t.raw('INTRODUCTION') as string[];
  const { text: typedText, showCursor } = useTypewriter({
    words,
    loop: true,
    typeSpeed: 150,
    deleteSpeed: 75,
    delayBetweenWords: 2000,
  });

  const resumeLink = locale === 'zh'
    ? '/file/XinNing-Resume-CN.pdf'
    : '/file/XinNing-Resume-EN.pdf';

  const keepLearningArray = (t.raw('KEEP_LEARNING') || ['', '', '']) as string[];

  const stats = [
    { value: '8+', label: t('STAT_YEARS') },
    { value: '10+', label: t('STAT_PROJECTS') },
    { value: '4', label: t('STAT_COMPANIES') },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div
        className="relative w-full"
        style={{
          height: 0,
          paddingBottom: '32%',
          minHeight: '300px',
          background: 'var(--hero-gradient)',
          backgroundSize: '400% 400%',
          animation: 'hero-gradient 12s ease infinite',
        }}
      >
        {/* Three.js wave mesh */}
        {mounted && <HeroWave theme={theme} />}

        <GridBackground />

        {/* Name + Title */}
        <div
          className="absolute text-center w-[90%] phone:w-[95%]"
          style={{ left: '50%', top: '35%', transform: 'translate(-50%, -60%)' }}
        >
          <AnimatedName
            name={t('MY_NAME')}
            style={{
              fontSize: 'clamp(44px, 6.5vw, 88px)',
              fontWeight: 900,
              color: 'var(--text)',
              textShadow: 'var(--name-shadow)',
              letterSpacing: '0.05em',
              paddingBottom: '18px',
            }}
          />
          <p
            style={{
              color: 'var(--text-muted)',
              letterSpacing: '4px',
              fontSize: 'clamp(11px, 1.5vw, 18px)',
              animation: 'twinkling 1s 1.3s backwards',
              textTransform: 'uppercase',
            }}
          >
            {t('MY_TITLE')}
          </p>
        </div>

        {/* Typewriter + CTA */}
        {mounted && (
          <div
            className="absolute text-center"
            style={{ left: '50%', bottom: '8%', transform: 'translate(-50%, 0)', maxWidth: '680px', width: '92%' }}
          >
            {/* Typewriter — desktop only */}
            <div className="phone:hidden mb-4">
              <span style={{ color: 'var(--accent)', fontSize: 'clamp(14px, 1.8vw, 20px)', opacity: 0.85 }}>
                {typedText}
              </span>
              <span style={{ color: 'var(--accent)', opacity: showCursor ? 0.85 : 0, transition: 'opacity 0.1s', marginLeft: '2px' }}>
                |
              </span>
            </div>

            {/* CTA buttons */}
            <div className="flex items-center justify-center gap-3">
              <GlowButton
                href={`/${locale}/projects`}
                style={{ padding: 'clamp(8px, 1vw, 11px) clamp(18px, 2vw, 28px)', fontSize: 'clamp(11px, 1.1vw, 13px)' }}
              >
                {t('VIEW_WORK')} →
              </GlowButton>
              <GlowButton
                href={`/${locale}/contact`}
                variant="outline"
                style={{ padding: 'clamp(8px, 1vw, 11px) clamp(18px, 2vw, 28px)', fontSize: 'clamp(11px, 1.1vw, 13px)' }}
              >
                {t('GET_IN_TOUCH')}
              </GlowButton>
            </div>
          </div>
        )}

        {/* Scroll indicator */}
        <div
          className="absolute phone:hidden cursor-pointer"
          style={{ bottom: '-11px', left: '50%', animation: 'bounce-y 2s ease-in-out infinite' }}
          onClick={() => document.getElementById('below-hero')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 hover:border-[rgba(0,212,255,0.4)]"
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Tech Strip ───────────────────────────────────── */}
      <div
        id="below-hero"
        className="overflow-hidden phone:hidden relative"
        style={{
          background: 'var(--bg-deep)',
          borderTop: '1px solid var(--border-soft)',
          borderBottom: '1px solid var(--border-soft)',
          marginTop: '20px',
        }}
      >
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-20 pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, var(--bg-deep), transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-20 pointer-events-none z-10"
          style={{ background: 'linear-gradient(270deg, var(--bg-deep), transparent)' }} />
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.045) 3px, rgba(0,0,0,0.045) 4px)' }}
        />

        {/* Row 1 — scroll left — frameworks */}
        <div style={{ padding: '10px 0 5px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', animation: 'marquee 100s linear infinite', width: 'max-content' }}>
            {Array(8).fill(TECH_ROW1).flat().map((item, i) => (
              <span
                key={i}
                style={{
                  padding: '0 16px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  fontFamily: "'Courier New', monospace",
                  color: 'var(--accent)',
                  textShadow: 'var(--tech-glow-accent)',
                }}
              >
                <span style={{ opacity: 0.4, marginRight: '5px' }}>{'['}</span>
                {item}
                <span style={{ opacity: 0.4, marginLeft: '5px' }}>
                  {']'}
                </span>
                <span style={{ marginLeft: '16px', opacity: 0.18 }}>{'////'}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Row separator */}
        <div style={{
          height: '1px',
          margin: '0 56px',
          background: 'var(--tech-strip-sep)',
        }} />

        {/* Row 2 — scroll right — tooling/styling */}
        <div style={{ padding: '5px 0 10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', animation: 'marquee 80s linear infinite reverse', width: 'max-content' }}>
            {Array(8).fill(TECH_ROW2).flat().map((item, i) => (
              <span
                key={i}
                style={{
                  padding: '0 16px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  fontFamily: "'Courier New', monospace",
                  color: 'var(--accent-purple)',
                  textShadow: 'var(--tech-glow-purple)',
                }}
              >
                <span style={{ opacity: 0.4, marginRight: '5px' }}>{'<'}</span>
                {item}
                <span style={{ opacity: 0.4, marginLeft: '5px' }}>{'/>'}</span>
                <span style={{ marginLeft: '16px', opacity: 0.18 }}>{'>>>>'}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-14 phone:py-8">

        {/* ── Bio + Stats ──────────────────────────────── */}
        <div className="grid pad-v:grid-cols-2 pad:grid-cols-2 pc:grid-cols-2 gap-6 mb-12 phone:mb-8">

          {/* Bio card */}
          <SectionCard className="p-8 phone:p-6 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
              {t('ABOUT_ME')}
            </p>
            <p className="text-[var(--text)] text-base phone:text-sm leading-relaxed mb-7 flex-1">
              {t('HOME_ABOUT')}
            </p>
            <div className="flex gap-3 flex-wrap">
              <GlowButton
                href={resumeLink}
                download
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('DOWNLOAD_RESUME')}
              </GlowButton>
              <GlowButton
                href={`/${locale}/projects`}
                variant="outline"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                {t('PROJECTS')}
              </GlowButton>
            </div>
          </SectionCard>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 phone:gap-3">
            {stats.map((stat) => (
              <SectionCard
                key={stat.label}
                className="flex flex-col items-center justify-center text-center"
                style={{ padding: 'clamp(20px, 3.5vw, 48px) 8px' }}
              >
                <span
                  className="font-black leading-none mb-2"
                  style={{ fontSize: 'clamp(32px, 4.5vw, 60px)', color: 'var(--accent)' }}
                >
                  {stat.value}
                </span>
                <span
                  className="uppercase tracking-widest"
                  style={{ fontSize: 'clamp(9px, 0.85vw, 11px)', color: 'var(--text-muted)' }}
                >
                  {stat.label}
                </span>
              </SectionCard>
            ))}
          </div>
        </div>

        {/* ── Featured Work ─────────────────────────────────── */}
        <div className="mb-12">
          <SectionHeader
            title={t('MY_PROJECTS')}
            linkHref={`/${locale}/projects`}
            linkLabel={t('VIEW_ALL')}
          />

          <div className="grid pad:grid-cols-3 pc:grid-cols-3 gap-5">
            {featuredProjects.map((proj) => (
              <SectionCard
                key={proj.title}
                className="group overflow-hidden flex flex-col transition-all duration-300 hover:border-[rgba(0,212,255,0.22)]"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden shrink-0">
                  <img
                    src={proj.img}
                    alt={proj.title}
                    className="w-full h-full object-cover opacity-65 group-hover:opacity-85 group-hover:scale-[1.04] transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <span
                    className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded"
                    style={{
                      background: 'var(--accent-dim)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent-glow)',
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {proj.company}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-[var(--text)] font-bold text-sm mb-2 leading-snug">
                    {proj.title}
                  </h3>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-4 flex-1 line-clamp-2">
                    {proj.desc}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {proj.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  {proj.url ? (
                    <GlowButton
                      href={proj.url}
                      external
                      className="w-fit"
                      style={{ padding: '5px 12px', fontSize: '11px', opacity: 0.85 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      {tp('visitSite')}
                    </GlowButton>
                  ) : (
                    <GlowButton
                      href={`/${locale}/projects`}
                      variant="outline"
                      className="w-fit"
                      style={{ padding: '5px 12px', fontSize: '11px' }}
                    >
                      {t('VIEW_DETAILS')}
                    </GlowButton>
                  )}
                </div>
              </SectionCard>
            ))}
          </div>
        </div>

        {/* ── Keep Learning ─────────────────────────────── */}
        <SectionCard className="overflow-hidden">
          <div className="flex flex-col pad:flex-row pc:flex-row">
            <div className="pad:w-5/12 pc:w-5/12 relative h-64 pad:h-auto pc:h-auto">
              <img
                src="/image/home/keep-learning.jpg"
                alt="Keep Learning"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 phone:hidden pad-v:hidden" style={{ background: 'linear-gradient(to right, transparent, var(--bg-secondary))' }} />
            </div>
            <div className="pad:w-7/12 pc:w-7/12 p-8 pad:p-12 pc:p-12 flex items-center">
              <div>
                <h2 className="text-3xl phone:text-xl font-bold text-[var(--text)] mb-6 uppercase tracking-widest">
                  {keepLearningArray[0]}
                </h2>
                <blockquote
                  className="text-xl phone:text-base text-[var(--text-muted)] italic mb-5 pl-4"
                  style={{ borderLeft: '2px solid var(--accent)' }}
                >
                  &ldquo;{keepLearningArray[1]}&rdquo;
                </blockquote>
                <p className="text-right text-sm text-[var(--text-dim)]">
                  — {keepLearningArray[2]}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
