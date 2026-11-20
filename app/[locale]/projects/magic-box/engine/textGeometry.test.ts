import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as THREE from 'three';
import { createTextGeometry, isTextFontId } from './textGeometry';

// Node has no canvas: stub one whose "rendered text" is whatever bitmap the test sets.
let bitmap: (x: number, y: number) => boolean = () => false;

function fakeCanvas() {
  return {
    width: 0,
    height: 0,
    getContext: () => ({
      font: '', textBaseline: '', fillStyle: '',
      fillText() {},
      measureText: () => ({
        width: 120,
        actualBoundingBoxAscent: 120, actualBoundingBoxDescent: 0,
        actualBoundingBoxLeft: 0, actualBoundingBoxRight: 120,
      }),
      getImageData: (_x: number, _y: number, w: number, h: number) => {
        const data = new Uint8ClampedArray(w * h * 4);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (bitmap(x, y)) data[(y * w + x) * 4 + 3] = 255;
        }
        return { data };
      },
    }),
  };
}

beforeEach(() => { vi.stubGlobal('document', { createElement: fakeCanvas }); });
afterEach(() => { vi.unstubAllGlobals(); });

function build() {
  const g = createTextGeometry('x', 'sans') as THREE.ExtrudeGeometry | null;
  if (!g) return null;
  const shapes = (g.parameters as { shapes: THREE.Shape[] }).shapes;
  g.computeBoundingBox();
  return { g, shapes, holes: shapes.map(s => s.holes.length), box: g.boundingBox! };
}

const ring = (r1: number, r2: number) => (x: number, y: number) => {
  const d = Math.hypot(x - 64, y - 64);
  return d < r2 && d > r1;
};

describe('createTextGeometry', () => {
  it('turns an enclosed counter (like "o") into a hole', () => {
    bitmap = ring(25, 50);
    const r = build()!;
    expect(r.shapes).toHaveLength(1);
    expect(r.holes).toEqual([1]);
  });

  it('keeps an island inside a hole as its own shape (like "回")', () => {
    bitmap = (x, y) => ring(30, 50)(x, y) || Math.hypot(x - 64, y - 64) < 15;
    const r = build()!;
    expect(r.shapes).toHaveLength(2);
    expect([...r.holes].sort()).toEqual([0, 1]);
  });

  it('splits blocks that touch only at a corner into separate shapes', () => {
    bitmap = (x, y) => (x >= 10 && x < 40 && y >= 10 && y < 40) || (x >= 40 && x < 70 && y >= 40 && y < 70);
    expect(build()!.shapes).toHaveLength(2);
  });

  it('lies flat on the ground, centered, 10 units thick', () => {
    bitmap = ring(25, 50);
    const { box } = build()!;
    expect(box.min.y).toBeCloseTo(0);
    expect(box.max.y).toBeCloseTo(10);
    expect(box.min.x + box.max.x).toBeCloseTo(0);
    expect(box.min.z + box.max.z).toBeCloseTo(0);
  });

  it('scales long text down to fit the workspace', () => {
    bitmap = (x, y) => y > 20 && y < 100 && x > 2 && x < 2000; // very wide
    const original = fakeCanvas().getContext().measureText;
    vi.stubGlobal('document', {
      createElement: () => {
        const c = fakeCanvas();
        const ctx = c.getContext();
        ctx.measureText = () => ({ ...original(), actualBoundingBoxRight: 2000, width: 2000 });
        return { ...c, getContext: () => ctx };
      },
    });
    const { box } = build()!;
    expect(box.max.x - box.min.x).toBeLessThanOrEqual(180.01);
  });

  it('returns null when nothing is drawn (e.g. only spaces)', () => {
    bitmap = () => false;
    expect(createTextGeometry(' ', 'sans')).toBeNull();
  });
});

describe('isTextFontId', () => {
  it('accepts known ids only', () => {
    expect(isTextFontId('kai')).toBe(true);
    expect(isTextFontId('comic')).toBe(false);
    expect(isTextFontId(undefined)).toBe(false);
  });
});
