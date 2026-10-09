'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import PageBanner from '@/components/layout/PageBanner';
import SectionCard from '@/components/ui/SectionCard';
import SectionHeader from '@/components/ui/SectionHeader';
import GlowButton from '@/components/ui/GlowButton';
import type { GameScreenshot, RobloxGame, RobloxGamesData } from '@/lib/types/games';

interface RobloxGamesClientProps {
  data: RobloxGamesData | null;
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
    </svg>
  );
}

function Lightbox({ shot, onClose }: { shot: GameScreenshot; onClose: () => void }) {
  const t = useTranslations('robloxGames');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 phone:p-4 cursor-zoom-out"
      style={{ background: 'var(--glass-bg)' }}
    >
      <div className="relative w-full max-w-5xl aspect-video">
        <Image src={shot.src} alt={shot.alt} fill sizes="100vw" className="object-contain" />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute top-4 right-4 w-10 h-10 rounded-full text-xl text-[var(--text)] border border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}
      >
        ×
      </button>
    </div>
  );
}

function GameSection({ game, index, onOpenShot }: { game: RobloxGame; index: number; onOpenShot: (s: GameScreenshot) => void }) {
  const t = useTranslations('robloxGames');

  return (
    <section id={game.id} className="mb-20 phone:mb-14 scroll-mt-24">
      {/* Cover */}
      <div className="relative rounded-xl overflow-hidden border border-[var(--border)] aspect-video phone:aspect-[4/3]">
        <Image
          src={game.cover}
          alt={game.title}
          fill
          priority={index === 0}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--image-overlay)' }} />

        <div className="absolute left-0 right-0 bottom-0 p-6 phone:p-4 flex items-end gap-4 phone:gap-3">
          <div className="relative w-20 h-20 phone:w-14 phone:h-14 shrink-0 rounded-2xl overflow-hidden border border-[var(--border)]">
            <Image src={game.icon} alt="" fill sizes="80px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span
                className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded"
                style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}
              >
                {game.genre}
              </span>
              <span
                className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded text-[var(--text)]"
                style={{ background: 'var(--glass-bg)' }}
              >
                {t('released')} {game.released}
              </span>
            </div>
            <h2
              className="text-3xl phone:text-xl font-black text-[var(--text)] leading-tight"
              style={{ textShadow: '0 0 20px var(--accent-glow)' }}
            >
              {game.title}
            </h2>
            <p className="text-sm phone:text-xs text-[var(--text)] opacity-90 mt-1">{game.tagline}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid gap-6 pc:grid-cols-5">
        <div className="pc:col-span-3 space-y-4">
          {game.desc.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-[var(--text-muted)]">{p}</p>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            {game.tech.map((tech) => (
              <span
                key={tech}
                className="text-xs px-2.5 py-1 rounded-md text-[var(--text-muted)] border border-[var(--border)]"
                style={{ background: 'var(--accent-subtle)' }}
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="pt-2">
            <GlowButton href={game.playUrl} external aria-label={`${t('play')} — ${game.title}`}>
              <PlayIcon />
              {t('play')}
            </GlowButton>
          </div>
        </div>

        <SectionCard className="pc:col-span-2 p-5">
          <p className="font-semibold mb-3 text-[var(--text)] text-xs tracking-widest uppercase">{t('features')}</p>
          <ul className="space-y-2">
            {game.features.map((f) => (
              <li key={f} className="text-sm leading-relaxed text-[var(--text-muted)] flex gap-2">
                <span style={{ color: 'var(--accent)', opacity: 0.6 }}>›</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Screenshots */}
      <div className="mt-6 grid grid-cols-3 phone:grid-cols-1 gap-4">
        {game.screenshots.map((shot) => (
          <button
            key={shot.src}
            type="button"
            onClick={() => onOpenShot(shot)}
            aria-label={`${t('enlarge')}: ${shot.alt}`}
            className="group relative aspect-video rounded-lg overflow-hidden border border-[var(--border)] cursor-zoom-in"
          >
            <Image
              src={shot.src}
              alt={shot.alt}
              fill
              sizes="(max-width: 767px) 100vw, 33vw"
              className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

export default function RobloxGamesClient({ data }: RobloxGamesClientProps) {
  const t = useTranslations('robloxGames');
  const tg = useTranslations();
  const [openShot, setOpenShot] = useState<GameScreenshot | null>(null);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageBanner title={t('title')} subtitle={t('subtitle')} imageSrc="/image/games/slayers-cover.webp" />

      <div className="max-w-5xl mx-auto px-4 py-12 phone:py-8">
        {!data ? (
          <p className="text-center py-16 text-[var(--text-muted)]">{tg('SOMETHING_WRONG')}</p>
        ) : (
          <>
            <SectionHeader title={t('myGames')} />
            {data.games.map((game, i) => (
              <GameSection key={game.id} game={game} index={i} onOpenShot={setOpenShot} />
            ))}
          </>
        )}
      </div>

      {openShot && <Lightbox shot={openShot} onClose={() => setOpenShot(null)} />}
    </div>
  );
}
