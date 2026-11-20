'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { COLOR_PALETTE } from '../engine/constants';
import type { ControlMode, EngineState } from '../engine/MagicBoxEngine';
import { Icon, type IconName } from './icons';
import s from './MagicBox.module.css';

type Props = {
  state: EngineState;
  right: number;
  confirmClear: boolean;
  /** "Ctrl" or "⌘", for shortcut hints. */
  mod: string;
  onUndo: () => void;
  onRedo: () => void;
  onResetCamera: () => void;
  onMode: (mode: ControlMode) => void;
  onZoom: (percent: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClear: () => void;
  onSetColor: (hex: string) => void;
  onPreviewColor: (hex: string) => void;
  onCommitColor: () => void;
};

const ZOOM_LEVELS = [50, 100, 150, 200];

export default function Toolbar(p: Props) {
  const t = useTranslations('magicBox.tools');
  const [popup, setPopup] = useState<'zoom' | 'color' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { selectedColor, mode } = p.state;
  const hasSelection = selectedColor !== null;

  // Close popups on any press outside the toolbar (the canvas included) or on Esc.
  useEffect(() => {
    if (!popup) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setPopup(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPopup(null); };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [popup]);

  // A live custom-color edit becomes one undo step when the popup goes away.
  const { onCommitColor } = p;
  useEffect(() => {
    if (popup !== 'color') return;
    return () => onCommitColor();
  }, [popup, onCommitColor]);

  const act = (fn: () => void) => () => { setPopup(null); fn(); };
  const modeBtn = (m: ControlMode, icon: IconName, label: string, key: string) => (
    <ToolBtn icon={icon} label={label} hint={key} pressed={mode === m} onClick={act(() => p.onMode(m))} />
  );

  return (
    <div className={s.bottomBar} style={{ right: p.right }}>
      <div className={s.toolbar} ref={rootRef} role="toolbar" aria-label={t('label')}>
        <ToolBtn icon="undo" label={t('undo')} hint={`${p.mod}+Z`} disabled={!p.state.canUndo} onClick={act(p.onUndo)} />
        <ToolBtn icon="redo" label={t('redo')} hint={`${p.mod}+Shift+Z`} disabled={!p.state.canRedo} onClick={act(p.onRedo)} />
        <ToolBtn icon="home" label={t('view')} title={t('viewTitle')} onClick={act(p.onResetCamera)} />
        {modeBtn('scale', 'scale', t('scale'), 'R')}
        {modeBtn('translate', 'move', t('move'), 'W')}
        {modeBtn('rotate', 'rotate', t('rotate'), 'E')}

        <div className={s.popupAnchor}>
          <ToolBtn
            icon="zoom" label={t('zoom')} expanded={popup === 'zoom'}
            onClick={() => setPopup(v => (v === 'zoom' ? null : 'zoom'))}
          />
          {popup === 'zoom' && (
            <div className={s.popup}>
              {ZOOM_LEVELS.map(z => (
                <button key={z} className={s.popupItem} onClick={act(() => p.onZoom(z))}>{z}%</button>
              ))}
            </div>
          )}
        </div>

        <ToolBtn icon="copy" label={t('copy')} hint={`${p.mod}+D`} disabled={!hasSelection} onClick={act(p.onDuplicate)} />
        <ToolBtn icon="close" label={t('delete')} hint="Del" disabled={!hasSelection} onClick={act(p.onDelete)} />
        <ToolBtn
          icon="trash"
          label={p.confirmClear ? t('clearConfirm') : t('clear')}
          danger={p.confirmClear}
          disabled={p.state.objectCount === 0}
          onClick={act(p.onClear)}
        />

        {hasSelection && (
          <div className={s.popupAnchor}>
            <button
              className={s.toolBtn}
              aria-expanded={popup === 'color'}
              onClick={() => setPopup(v => (v === 'color' ? null : 'color'))}
            >
              <span className={s.colorCircle} style={{ background: selectedColor }} aria-hidden />
              <span className={s.toolLabel}>{t('color')}</span>
            </button>
            {popup === 'color' && (
              <div className={s.colorPopup} role="group" aria-label={t('color')}>
                {COLOR_PALETTE.map(hex => (
                  <button
                    key={hex}
                    className={`${s.colorSwatch} ${selectedColor === hex ? s.colorSwatchSelected : ''}`}
                    style={{ background: hex }}
                    aria-label={t('colorSwatch', { hex })}
                    aria-pressed={selectedColor === hex}
                    onClick={() => p.onSetColor(hex)}
                  />
                ))}
                <label className={s.colorSwatch} title={t('customColor')}>
                  <input
                    type="color"
                    className={s.colorInput}
                    aria-label={t('customColor')}
                    value={selectedColor}
                    // React's onChange fires on every value while dragging: preview only.
                    onChange={e => p.onPreviewColor(e.target.value)}
                    // The native `change` fires once when the picker closes: commit.
                    ref={el => {
                      if (!el) return;
                      const commit = () => p.onCommitColor();
                      el.addEventListener('change', commit);
                      return () => el.removeEventListener('change', commit);
                    }}
                  />
                  <Icon name="plus" width={14} height={14} />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ icon, label, hint, title, onClick, disabled, pressed, danger, expanded }: {
  icon: IconName;
  label: string;
  /** Keyboard shortcut, shown in the tooltip. */
  hint?: string;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  danger?: boolean;
  expanded?: boolean;
}) {
  const cls = [s.toolBtn, pressed && s.toolBtnActive, danger && s.toolBtnDanger].filter(Boolean).join(' ');
  const tip = title ?? label;
  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-keyshortcuts={hint}
      title={hint ? `${tip} (${hint})` : tip}
    >
      <Icon name={icon} className={s.toolIcon} />
      <span className={s.toolLabel}>{label}</span>
    </button>
  );
}
