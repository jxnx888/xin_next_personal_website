'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SHAPES_LIST, CARTOON_LIST, SIDEBAR_W, type PickItem } from '../engine/constants';
import { Icon } from './icons';
import s from './MagicBox.module.css';

type Props = {
  /** Pressed with mouse or touch at this point: start a drag. */
  onPick: (item: PickItem, clientX: number, clientY: number) => void;
  /** Activated from the keyboard (Enter / Space): place it without dragging. */
  onKeyboardPick: (item: PickItem) => void;
};

export function moduleImage(title: string): string {
  return `/image/3dBuilder/3dPrinting/sprint_${title}.png`;
}

export default function Sidebar({ onPick, onKeyboardPick }: Props) {
  const t = useTranslations('magicBox');
  const [shapesOpen, setShapesOpen] = useState(true);
  const [cartoonOpen, setCartoonOpen] = useState(false);

  return (
    <nav className={s.sidebar} style={{ width: SIDEBAR_W }} aria-label={t('panel')}>
      <Section title={t('basic')} open={shapesOpen} onToggle={() => setShapesOpen(v => !v)} items={SHAPES_LIST} {...{ onPick, onKeyboardPick }} />
      <Section title={t('cartoon')} open={cartoonOpen} onToggle={() => setCartoonOpen(v => !v)} items={CARTOON_LIST} {...{ onPick, onKeyboardPick }} />
    </nav>
  );
}

function Section({ title, open, onToggle, items, onPick, onKeyboardPick }: Props & {
  title: string; open: boolean; onToggle: () => void; items: PickItem[];
}) {
  const t = useTranslations('magicBox.shapes');
  return (
    <>
      <button className={s.sectionHeader} onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} width={12} height={12} />
      </button>
      {open && items.map(item => {
        const name = t(item.title);
        return (
          <button
            key={item.title}
            className={s.moduleItem}
            // preventDefault keeps the press from starting a text selection.
            onMouseDown={e => { if (e.button === 0) { e.preventDefault(); onPick(item, e.clientX, e.clientY); } }}
            onTouchStart={e => { const p = e.touches[0]; onPick(item, p.clientX, p.clientY); }}
            // detail === 0: a click synthesised from Enter / Space, not from a pointer.
            onClick={e => { if (e.detail === 0) onKeyboardPick(item); }}
          >
            <div className={s.moduleImgWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={moduleImage(item.title)} alt="" className={s.moduleImg} draggable={false} />
            </div>
            <div className={s.moduleName}>{name}</div>
          </button>
        );
      })}
    </>
  );
}
