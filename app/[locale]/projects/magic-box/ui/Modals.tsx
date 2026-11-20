'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { TEXT_FONTS, textFontFamily, type TextFontId } from '../engine/textGeometry';
import { Icon } from './icons';
import s from './MagicBox.module.css';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Centered dialog with a backdrop. Moves focus into itself on open, keeps Tab inside,
 * and gives focus back to whatever had it on close. Esc and a backdrop click call
 * `onDismiss`, if given.
 */
function Modal({ title, onDismiss, children }: { title: string; onDismiss?: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Record who had focus *before* moving it in. (Inputs here deliberately don't use
    // autoFocus: it would grab focus during commit, before this effect could see the
    // opener, and closing would then drop focus on <body>.)
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    (el?.querySelector<HTMLElement>('input') ?? el?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && onDismiss) { e.stopPropagation(); onDismiss(); return; }
    if (e.key !== 'Tab' || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <>
      <div className={s.modalBg} onClick={onDismiss} />
      <div ref={ref} className={s.modal} role="dialog" aria-modal="true" aria-label={title} onKeyDown={onKeyDown}>
        <div className={s.modalTitle}>{title}</div>
        {children}
      </div>
    </>
  );
}

export function TextModal({ font, onFontChange, onConfirm, onCancel }: {
  font: TextFontId;
  onFontChange: (font: TextFontId) => void;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('magicBox');
  const [text, setText] = useState('');
  const word = text.trim();
  const confirm = () => { if (word) onConfirm(word); };

  return (
    <Modal title={t('text.title')} onDismiss={onCancel}>
      <input
        className={s.textInput}
        style={{ fontFamily: textFontFamily(font) }}
        type="text"
        placeholder={t('text.placeholder')}
        aria-label={t('text.title')}
        maxLength={10}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') confirm(); }}
      />
      {/* Font picker — each option previews the typed text in its own font */}
      <div className={s.modalHintSpaced} id="mb-font-label">{t('text.font')}</div>
      <div className={s.fontPicker} role="radiogroup" aria-labelledby="mb-font-label">
        {TEXT_FONTS.map(f => (
          <button
            key={f.id}
            role="radio"
            aria-checked={font === f.id}
            className={s.fontOption}
            style={{ fontFamily: f.family }}
            onClick={() => onFontChange(f.id)}
          >
            <span className={s.fontSample} aria-hidden>{word.slice(0, 2) || '字A'}</span>
            <span className={s.fontName}>{t(`text.fonts.${f.id}`)}</span>
          </button>
        ))}
      </div>
      <div className={s.modalBtns}>
        <button className={s.modalBtn} disabled={!word} onClick={confirm}>{t('confirm')}</button>
        <button className={s.modalBtn} onClick={onCancel}>{t('cancel')}</button>
      </div>
    </Modal>
  );
}

function timestampName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function SaveModal({ onExport, onCancel }: { onExport: (name: string) => void; onCancel: () => void }) {
  const t = useTranslations('magicBox');
  const [name, setName] = useState(timestampName);
  const trimmed = name.trim();
  return (
    <Modal title={t('saveModal.title')} onDismiss={onCancel}>
      <label className={s.modalHint} htmlFor="mb-save-name" style={{ display: 'block' }}>{t('saveModal.hint')}</label>
      <input
        id="mb-save-name"
        className={s.modalInput}
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && trimmed) onExport(trimmed); }}
        maxLength={40}
      />
      <div className={s.modalBtns}>
        <button className={s.modalBtn} disabled={!trimmed} onClick={() => onExport(trimmed)}>{t('saveModal.export')}</button>
        <button className={s.modalBtn} onClick={onCancel}>{t('cancel')}</button>
      </div>
    </Modal>
  );
}

export function LeaveModal({ onSaveAndLeave, onLeave, onCancel }: {
  onSaveAndLeave: () => void; onLeave: () => void; onCancel: () => void;
}) {
  const t = useTranslations('magicBox');
  return (
    <Modal title={t('leaveModal.title')} onDismiss={onCancel}>
      <div className={s.modalHint}>{t('leaveModal.hint')}</div>
      <div className={s.modalBtns}>
        <button className={s.modalBtn} onClick={onSaveAndLeave}>{t('leaveModal.exportAndLeave')}</button>
        <button className={s.modalBtn} onClick={onLeave}>{t('leaveModal.leave')}</button>
        <button className={s.modalBtn} onClick={onCancel}>{t('cancel')}</button>
      </div>
    </Modal>
  );
}

export function GuideOverlay({ mod, onClose }: { mod: string; onClose: () => void }) {
  const t = useTranslations('magicBox.guide');
  const b = (chunks: ReactNode) => <strong>{chunks}</strong>;

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    // A click anywhere dismisses it; the button at the bottom is the keyboard path.
    <div className={s.guideBg} onClick={onClose} role="dialog" aria-modal="true" aria-label={t('title')}>
      <div className={s.guideCard}>
        <Icon name="box" className={s.guideIcon} />
        <div className={s.guideTitle}>{t('title')}</div>
        <ul className={s.guideSteps}>
          <li>{t.rich('step1', { b })}</li>
          <li>{t.rich('step2', { b })}</li>
          <li>{t('step3')}</li>
          <li>{t.rich('step4', { b, mod })}</li>
        </ul>
        <button className={s.guideFoot} onClick={onClose} autoFocus>{t('close')}</button>
      </div>
    </div>
  );
}

export function PortraitOverlay() {
  const t = useTranslations('magicBox.portrait');
  return (
    <div className={s.portraitOverlay} role="alert">
      <Icon name="phoneRotate" className={s.portraitIcon} />
      <div className={s.portraitTitle}>{t('title')}</div>
      <div className={s.portraitHint}>{t('hint')}</div>
    </div>
  );
}
