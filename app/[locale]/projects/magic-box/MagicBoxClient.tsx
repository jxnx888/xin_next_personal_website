'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  MagicBoxEngine, INITIAL_ENGINE_STATE, type ControlMode, type EngineState, type EngineToast,
} from './engine/MagicBoxEngine';
import { SIDEBAR_W, type PickItem } from './engine/constants';
import { DEFAULT_TEXT_FONT, type TextFontId } from './engine/textGeometry';
import Sidebar, { moduleImage } from './ui/Sidebar';
import Toolbar from './ui/Toolbar';
import { TextModal, SaveModal, LeaveModal, GuideOverlay, PortraitOverlay } from './ui/Modals';
import { Icon, type IconName } from './ui/icons';
import s from './ui/MagicBox.module.css';

// All Three.js state lives in MagicBoxEngine (./engine), outside React. This
// component owns the DOM chrome, forwards input to the engine and renders the
// EngineState it reports through onState.

type ToastKey = EngineToast | 'textFailed' | 'exported' | 'screenshot' | 'cleared' | 'duplicated';

const GUIDE_KEY = 'mb_guide_seen';
const SHORTCUT_MODES: Record<string, ControlMode> = { w: 'translate', e: 'rotate', r: 'scale' };

// Only phones held upright get the "rotate your device" screen — not a narrow
// desktop window or a tablet, where the app is perfectly usable.
const PORTRAIT_QUERY = '(orientation: portrait) and (pointer: coarse) and (max-width: 820px)';
function subscribePortrait(onChange: () => void) {
  const mq = window.matchMedia(PORTRAIT_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const isPortraitNow = () => window.matchMedia(PORTRAIT_QUERY).matches;

const subscribeNothing = () => () => {};
const isMacNow = () => /Mac|iPhone|iPad/.test(navigator.platform);

function readGuideSeen(): boolean {
  try { return localStorage.getItem(GUIDE_KEY) === '1'; } catch { return true; }
}

function download(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

export default function MagicBoxClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('magicBox');

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MagicBoxEngine | null>(null);
  const dragItemRef = useRef<PickItem | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveAfterExportRef = useRef(false);

  const [engine, setEngine] = useState<EngineState>(INITIAL_ENGINE_STATE);
  const [toast, setToast] = useState<ToastKey | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showGuide, setShowGuide] = useState(() => !readGuideSeen());
  const [dragItem, setDragItem] = useState<PickItem | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [modal, setModal] = useState<'text' | 'save' | 'leave' | null>(null);
  const [textFont, setTextFont] = useState<TextFontId>(DEFAULT_TEXT_FONT);
  const [confirmClear, setConfirmClear] = useState(false);
  const isPortrait = useSyncExternalStore(subscribePortrait, isPortraitNow, () => false);
  const mod = useSyncExternalStore(subscribeNothing, isMacNow, () => false) ? '⌘' : 'Ctrl';

  const showToast = useCallback((key: ToastKey) => {
    setToast(key);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // ── Engine lifecycle ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const eng = new MagicBoxEngine(el, { onState: setEngine, onToast: showToast });
    engineRef.current = eng;
    return () => {
      eng.dispose();
      engineRef.current = null;
    };
  }, [showToast]);

  // Timers outlive nothing.
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
  }, []);

  // ── Sidebar drag (mouse + touch), tracked on window so it can end anywhere ──
  useEffect(() => {
    const end = (x: number, y: number) => {
      if (!dragItemRef.current) return;
      dragItemRef.current = null;
      setDragItem(null);
      engineRef.current?.drop(x, y);
    };
    const onMove  = (e: MouseEvent) => { if (dragItemRef.current) setDragPos({ x: e.clientX, y: e.clientY }); };
    const onUp    = (e: MouseEvent) => end(e.clientX, e.clientY);
    const onTMove = (e: TouchEvent) => { if (dragItemRef.current) setDragPos({ x: e.touches[0].clientX, y: e.touches[0].clientY }); };
    const onTEnd  = (e: TouchEvent) => end(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTMove, { passive: true });
    window.addEventListener('touchend', onTEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTMove);
      window.removeEventListener('touchend', onTEnd);
    };
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (modal || showGuide) return; // dialogs handle their own keys
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.altKey) return;
      const eng = engineRef.current;
      if (!eng) return;
      const key = e.key.toLowerCase();
      const cmd = e.ctrlKey || e.metaKey;

      if (cmd && key === 'z') { e.preventDefault(); if (e.shiftKey) eng.redo(); else eng.undo(); }
      else if (cmd && key === 'y') { e.preventDefault(); eng.redo(); }
      else if (cmd && key === 'd') { e.preventDefault(); if (eng.duplicateSelected()) showToast('duplicated'); }
      else if (cmd) return; // leave other browser shortcuts alone
      else if (key === 'delete' || key === 'backspace') eng.deleteSelected();
      else if (key === 'escape') eng.escape();
      else if (SHORTCUT_MODES[key] && !e.shiftKey) eng.setMode(SHORTCUT_MODES[key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, showGuide, showToast]);

  // Best effort: only works in fullscreen on most mobile browsers.
  useEffect(() => {
    try {
      (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })
        .lock?.('landscape').catch(() => {});
    } catch {}
  }, []);

  // ── Handlers ──
  const handlePick = (item: PickItem, x: number, y: number) => {
    engineRef.current?.arm(item);
    if (item.module === 'text') { setModal('text'); return; }
    dragItemRef.current = item;
    setDragItem(item);
    setDragPos({ x, y });
  };

  const handleKeyboardPick = (item: PickItem) => {
    engineRef.current?.arm(item);
    if (item.module === 'text') setModal('text');
    else engineRef.current?.dropAtCenter();
  };

  const handleInsertText = (text: string) => {
    if (engineRef.current?.insertText(text, textFont)) setModal(null);
    else showToast('textFailed');
  };

  const handleExport = (name: string) => {
    const stl = engineRef.current?.exportSTL();
    if (!stl) return;
    const url = URL.createObjectURL(new Blob([stl], { type: 'model/stl' }));
    download(url, `${name}.stl`);
    // Revoking in the same tick can cancel the download in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setModal(null);
    showToast('exported');
    if (leaveAfterExportRef.current) {
      leaveAfterExportRef.current = false;
      router.push(`/${locale}/projects`);
    }
  };

  const handleScreenshot = () => {
    const url = engineRef.current?.captureImage();
    if (!url) return;
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    download(url, `magicbox_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.png`);
    showToast('screenshot');
  };

  const handleClear = () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);
    if (engineRef.current?.clear()) showToast('cleared');
  };

  const handleDuplicate = () => {
    if (engineRef.current?.duplicateSelected()) showToast('duplicated');
  };

  const handleLeave = () => {
    if (engineRef.current?.isDirty()) setModal('leave');
    else router.push(`/${locale}/projects`);
  };

  const closeGuide = useCallback(() => {
    try { localStorage.setItem(GUIDE_KEY, '1'); } catch {}
    setShowGuide(false);
  }, []);

  // Stable: Toolbar commits on popup close via an effect keyed on this.
  const commitColor = useCallback(() => engineRef.current?.commitColor(), []);

  const sidebarWidth = showSidebar ? SIDEBAR_W : 0;
  const hasObjects = engine.objectCount > 0;
  const { done, total } = engine.restoring;
  const restoring = done < total;

  return (
    <div className={s.root}>
      {toast && <div className={s.toast} role="status">{t(`toast.${toast}`)}</div>}
      {isPortrait && <PortraitOverlay />}
      {showGuide && !restoring && <GuideOverlay mod={mod} onClose={closeGuide} />}

      <div
        ref={containerRef}
        className={s.canvas}
        style={{ right: sidebarWidth }}
        onPointerDown={e => engineRef.current?.pointerDown(e.clientX, e.clientY)}
        onClick={e => engineRef.current?.click(e.clientX, e.clientY)}
      />

      <button
        className={s.sidebarToggle}
        style={{ right: sidebarWidth }}
        onClick={() => setShowSidebar(v => !v)}
        aria-label={t('toggleSidebar')}
        aria-expanded={showSidebar}
      >
        <Icon name={showSidebar ? 'chevronRight' : 'chevronLeft'} width={16} height={16} />
      </button>

      {showSidebar && <Sidebar onPick={handlePick} onKeyboardPick={handleKeyboardPick} />}

      <div className={s.topBtns}>
        <TopButton icon="back" label={t('back')} onClick={handleLeave} />
        <TopButton icon="save" label={t('save')} onClick={() => setModal('save')} disabled={!hasObjects} />
        <TopButton icon="camera" label={t('photo')} onClick={handleScreenshot} disabled={!hasObjects} />
      </div>

      {engine.selectedColor !== null && <div className={s.status}>{t(`status.${engine.mode}`)}</div>}

      {/* Stays visible after Clear while there is something to undo */}
      {(hasObjects || engine.canUndo || engine.canRedo) && (
        <Toolbar
          state={engine}
          right={sidebarWidth}
          confirmClear={confirmClear}
          mod={mod}
          onUndo={() => engineRef.current?.undo()}
          onRedo={() => engineRef.current?.redo()}
          onResetCamera={() => engineRef.current?.resetCamera()}
          onMode={m => engineRef.current?.setMode(m)}
          onZoom={z => engineRef.current?.zoom(z)}
          onDuplicate={handleDuplicate}
          onDelete={() => engineRef.current?.deleteSelected()}
          onClear={handleClear}
          onSetColor={hex => engineRef.current?.setColor(hex)}
          onPreviewColor={hex => engineRef.current?.previewColor(hex)}
          onCommitColor={commitColor}
        />
      )}

      {modal === 'text' && (
        <TextModal font={textFont} onFontChange={setTextFont} onConfirm={handleInsertText} onCancel={() => setModal(null)} />
      )}
      {modal === 'save' && (
        <SaveModal
          onExport={handleExport}
          onCancel={() => { leaveAfterExportRef.current = false; setModal(null); }}
        />
      )}
      {modal === 'leave' && (
        <LeaveModal
          onSaveAndLeave={() => { leaveAfterExportRef.current = true; setModal('save'); }}
          onLeave={() => { setModal(null); router.push(`/${locale}/projects`); }}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Real progress: shown only while saved cartoon models are downloading */}
      {restoring && (
        <div className={s.loading} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={t('restoring')}>
          <div className={s.spinner} />
          <div>{t('restoring')}</div>
          <div className={s.progressTrack}>
            <div className={s.progressBar} style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}

      {dragItem && (
        <div className={s.dragGhost} style={{ left: dragPos.x - 28, top: dragPos.y - 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={moduleImage(dragItem.title)} alt="" draggable={false} className={s.dragGhostImg} />
          {engine.stlLoading && (
            <div className={s.dragGhostLoading}><div className={s.spinner} /></div>
          )}
        </div>
      )}
    </div>
  );
}

function TopButton({ icon, label, onClick, disabled }: {
  icon: IconName; label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button className={s.topBtn} onClick={onClick} disabled={disabled}>
      <Icon name={icon} className={s.topBtnIcon} />
      <span className={s.topBtnLabel}>{label}</span>
    </button>
  );
}
