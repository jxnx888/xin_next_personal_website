import type { ObjectModule } from './constants';

// The scene is autosaved to localStorage after every change.
//
//   v1 (until 2026-11): a bare array of items.
//   v2: { v: 2, items } — adds an optional `font` on text items.
//   v3: STL items carry `centered: true`. Cartoon models are now centred on load, so
//       positions saved before that are off by the model's old origin; items without
//       the flag are migrated when they are restored (MagicBoxEngine.restore).
//
// Reading accepts all three. Items are validated one by one, so a single corrupt entry
// (hand-edited storage, an older build's bug) drops that item, not the whole scene.

export const STORAGE_KEY = 'mb_scene';
export const SCHEMA_VERSION = 3;
const MAX_TEXT = 50;

export type SavedItem = {
  module: ObjectModule;
  geoCode: number;
  text?: string;
  font?: string;
  /** STL only: position is for the centred model (v3+). */
  centered?: boolean;
  px: number; py: number; pz: number;
  rx: number; ry: number; rz: number;
  sx: number; sy: number; sz: number;
  color: string;
};

const NUM_KEYS = ['geoCode', 'px', 'py', 'pz', 'rx', 'ry', 'rz', 'sx', 'sy', 'sz'] as const;
const MODULES: readonly ObjectModule[] = ['shape', 'stl', 'text'];
const HEX = /^#[0-9a-f]{6}$/i;

function toItem(raw: unknown): SavedItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!MODULES.includes(r.module as ObjectModule)) return null;
  if (!NUM_KEYS.every(k => typeof r[k] === 'number' && Number.isFinite(r[k]))) return null;
  if (typeof r.color !== 'string' || !HEX.test(r.color)) return null;

  const item = {
    module: r.module as ObjectModule,
    color: r.color,
    ...Object.fromEntries(NUM_KEYS.map(k => [k, r[k] as number])),
  } as SavedItem;

  if (item.module === 'text') {
    if (typeof r.text !== 'string' || !r.text.trim()) return null;
    item.text = r.text.slice(0, MAX_TEXT);
    if (typeof r.font === 'string') item.font = r.font;
  }
  if (item.module === 'stl' && r.centered === true) item.centered = true;
  return item;
}

export function parseScene(raw: string | null | undefined): SavedItem[] {
  if (!raw) return [];
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return []; }
  const list = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null && Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : [];
  return list.map(toItem).filter((i): i is SavedItem => i !== null);
}

export function serializeScene(items: SavedItem[]): string {
  return JSON.stringify({ v: SCHEMA_VERSION, items });
}

// Storage access can throw (private mode, blocked site data, quota) — never let
// that break the app; the scene just isn't persisted.

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

function defaultStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function readScene(storage: ReadableStorage | null = defaultStorage()): SavedItem[] {
  try { return parseScene(storage?.getItem(STORAGE_KEY)); } catch { return []; }
}

export function writeScene(items: SavedItem[], storage: WritableStorage | null = defaultStorage()): void {
  try { storage?.setItem(STORAGE_KEY, serializeScene(items)); } catch { /* not persisted */ }
}
