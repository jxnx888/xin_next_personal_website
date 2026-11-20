import { describe, expect, it } from 'vitest';
import { parseScene, serializeScene, readScene, writeScene, STORAGE_KEY, type SavedItem } from './persistence';

const base = { geoCode: 0, px: 10, py: 10, pz: -10, rx: 0, ry: 1.5, rz: 0, sx: 1, sy: 2, sz: 1, color: '#ff6b6b' };
const shape: SavedItem = { module: 'shape', ...base };
const text: SavedItem = { module: 'text', ...base, geoCode: 222, text: '你好', font: 'kai' };
const stl: SavedItem = { module: 'stl', ...base, geoCode: 4, centered: true };

describe('parseScene', () => {
  it('round-trips the current format', () => {
    expect(parseScene(serializeScene([shape, text, stl]))).toEqual([shape, text, stl]);
  });

  it('marks pre-v3 STL items as not centred so they can be migrated', () => {
    const legacyStl = { module: 'stl', ...base, geoCode: 4 };
    expect(parseScene(JSON.stringify({ v: 2, items: [legacyStl] }))[0].centered).toBeUndefined();
    // Only a literal true counts.
    expect(parseScene(JSON.stringify([{ ...legacyStl, centered: 'yes' }]))[0].centered).toBeUndefined();
  });

  it('reads the legacy v1 bare-array format', () => {
    const legacyText = { module: 'text', ...base, geoCode: 222, text: 'Hi' }; // v1 had no font
    expect(parseScene(JSON.stringify([shape, legacyText]))).toEqual([shape, legacyText]);
  });

  it('returns [] for empty, malformed or unexpected input', () => {
    expect(parseScene(null)).toEqual([]);
    expect(parseScene('')).toEqual([]);
    expect(parseScene('{not json')).toEqual([]);
    expect(parseScene('42')).toEqual([]);
    expect(parseScene('{"v":2}')).toEqual([]);
  });

  it('drops only the invalid items', () => {
    const bad = [
      { ...shape, module: 'sphere' },        // unknown module
      { ...shape, px: 'x' },                 // non-number
      { ...shape, sy: null },                // missing number (JSON has no NaN/Infinity)
      { ...shape, color: 'red' },            // not #rrggbb
      { ...text, text: '   ' },              // empty text
      null, 'item', 3,
    ];
    expect(parseScene(JSON.stringify([shape, ...bad, text]))).toEqual([shape, text]);
  });

  it('ignores unknown fields and only keeps text/font on text items', () => {
    const extra = { ...shape, text: 'stray', font: 'serif', centered: true, foo: 1 };
    expect(parseScene(JSON.stringify([extra]))).toEqual([shape]);
  });

  it('caps very long text', () => {
    const long = { ...text, text: 'x'.repeat(500) };
    expect(parseScene(JSON.stringify([long]))[0].text).toHaveLength(50);
  });
});

describe('readScene / writeScene', () => {
  it('uses the mb_scene key', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); } };
    writeScene([shape], storage);
    expect([...store.keys()]).toEqual([STORAGE_KEY]);
    expect(readScene(storage)).toEqual([shape]);
  });

  it('swallows storage errors (private mode, quota)', () => {
    const throwing = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('quota'); },
    };
    expect(readScene(throwing)).toEqual([]);
    expect(() => writeScene([shape], throwing)).not.toThrow();
    expect(readScene(null)).toEqual([]);
  });
});
