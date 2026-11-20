import * as THREE from 'three';

// 3D text from the visitor's own system fonts.
//
// The text is drawn onto an offscreen canvas with the chosen CSS font stack, the
// pixel outline is traced into polygons, and those are extruded. This replaces a
// 37 MB typeface JSON (SimHei) that had to be downloaded before any text could be
// made. The trade-off: the same word can look slightly different on different
// machines, because each one falls back to whatever fonts it has installed.

export type TextFontId = 'sans' | 'serif' | 'kai' | 'round';

/** Display names live in messages (magicBox.text.fonts.<id>). */
export const TEXT_FONTS: { id: TextFontId; family: string }[] = [
  {
    id: 'sans',
    family: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC","Helvetica Neue",Arial,sans-serif',
  },
  {
    id: 'serif',
    family: '"Songti SC","SimSun","Noto Serif CJK SC","Noto Serif SC",Georgia,"Times New Roman",serif',
  },
  {
    id: 'kai',
    family: '"Kaiti SC","STKaiti","KaiTi","BiauKai",serif',
  },
  {
    id: 'round',
    family: '"Yuanti SC","YouYuan","Arial Rounded MT Bold","Comic Sans MS","Chalkboard SE",sans-serif',
  },
];

export const DEFAULT_TEXT_FONT: TextFontId = 'sans';

export function isTextFontId(v: unknown): v is TextFontId {
  return TEXT_FONTS.some(f => f.id === v);
}

export function textFontFamily(id: TextFontId): string {
  return (TEXT_FONTS.find(f => f.id === id) ?? TEXT_FONTS[0]).family;
}

const FONT_PX = 128;      // raster size; higher = smoother outline, more vertices
const PAD = 4;            // empty border so outlines never touch the canvas edge
const SIMPLIFY_EPS = 0.8; // Douglas-Peucker tolerance in pixels
const MIN_AREA = 2;       // drop specks smaller than this (px²)
const TEXT_HEIGHT = 50;   // world units per em
const MAX_WIDTH = 180;    // longer text is scaled down to fit the 200-unit workspace
const DEPTH = 10;

type Pt = [number, number];

/** Returns null when the text renders no pixels (e.g. only spaces). */
export function createTextGeometry(text: string, fontId: TextFontId): THREE.BufferGeometry | null {
  const raster = rasterize(text, textFontFamily(fontId));
  if (!raster) return null;

  const loops = traceOutlines(raster.filled, raster.w, raster.h)
    .map(simplifyClosed)
    .filter(l => l.length >= 3 && Math.abs(signedArea(l)) >= MIN_AREA);
  if (!loops.length) return null;

  const shapes = buildShapes(loops, TEXT_HEIGHT / FONT_PX);
  if (!shapes.length) return null;

  const geo = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: false, curveSegments: 1 });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
  const width = bb.max.x - bb.min.x;
  if (width > MAX_WIDTH) {
    const k = MAX_WIDTH / width;
    geo.scale(k, k, 1);
  }
  // Lay the text flat on the ground, thickness pointing up, readable from the default camera.
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function rasterize(text: string, family: string) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const font = `bold ${FONT_PX}px ${family}`;
  ctx.font = font;
  const m = ctx.measureText(text);
  const ascent  = Math.ceil(m.actualBoundingBoxAscent  || FONT_PX * 0.9);
  const descent = Math.ceil(m.actualBoundingBoxDescent || FONT_PX * 0.25);
  const left    = Math.ceil(m.actualBoundingBoxLeft    || 0);
  const right   = Math.ceil(m.actualBoundingBoxRight   || m.width);
  const w = left + right + PAD * 2;
  const h = ascent + descent + PAD * 2;
  if (w <= PAD * 2 || h <= PAD * 2) return null;

  canvas.width = w;
  canvas.height = h;
  ctx.font = font; // resizing the canvas resets the context
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, PAD + left, PAD + ascent);

  const { data } = ctx.getImageData(0, 0, w, h);
  const filled = new Uint8Array(w * h);
  let any = false;
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] >= 128) { filled[i] = 1; any = true; }
  }
  return any ? { filled, w, h } : null;
}

// Directions on the pixel-corner lattice (y grows downward): right, down, left, up.
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

/**
 * Walks the boundary between filled and empty pixels. Every boundary edge is
 * directed so the filled pixel is on its right (clockwise on screen), which makes
 * outer contours come out with positive signed area and holes with negative.
 */
function traceOutlines(filled: Uint8Array, w: number, h: number): Pt[][] {
  const vw = w + 1;
  const out = new Uint8Array(vw * (h + 1)); // bitmask of outgoing directions per lattice vertex
  const isFilled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && filled[y * w + x] === 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!filled[y * w + x]) continue;
      if (!isFilled(x, y - 1)) out[y * vw + x] |= 1 << 0;             // top edge, →
      if (!isFilled(x + 1, y)) out[y * vw + x + 1] |= 1 << 1;         // right edge, ↓
      if (!isFilled(x, y + 1)) out[(y + 1) * vw + x + 1] |= 1 << 2;   // bottom edge, ←
      if (!isFilled(x - 1, y)) out[(y + 1) * vw + x] |= 1 << 3;       // left edge, ↑
    }
  }

  const loops: Pt[][] = [];
  for (let start = 0; start < out.length; start++) {
    while (out[start]) {
      let dir = 0;
      while (!(out[start] & (1 << dir))) dir++;
      const loop: Pt[] = [];
      let v = start;
      // Every vertex has as many incoming as outgoing edges, so following unused
      // edges always leads back to the start vertex.
      do {
        out[v] &= ~(1 << dir);
        loop.push([v % vw, Math.floor(v / vw)]);
        v += DX[dir] + DY[dir] * vw;
        // Prefer turning right, then straight, then left. At a vertex where two
        // pixels touch only diagonally this keeps them as separate outlines.
        const m = out[v];
        const right = (dir + 1) & 3, left = (dir + 3) & 3;
        if (m & (1 << right)) dir = right;
        else if (m & (1 << dir)) { /* keep going straight */ }
        else if (m & (1 << left)) dir = left;
        else break;
      } while (v !== start);
      loops.push(loop);
    }
  }
  return loops;
}

function signedArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  }
  return a / 2;
}

function simplifyClosed(pts: Pt[]): Pt[] {
  // Drop points in the middle of straight runs first; pixel outlines are mostly that.
  const corners: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[(i + n - 1) % n], [bx, by] = pts[i], [cx, cy] = pts[(i + 1) % n];
    if ((bx - ax) * (cy - by) - (by - ay) * (cx - bx) !== 0) corners.push(pts[i]);
  }
  if (corners.length < 4) return corners;

  // Split the loop at the point farthest from the first one and simplify both halves.
  let far = 0, best = -1;
  for (let i = 1; i < corners.length; i++) {
    const d = (corners[i][0] - corners[0][0]) ** 2 + (corners[i][1] - corners[0][1]) ** 2;
    if (d > best) { best = d; far = i; }
  }
  const a = douglasPeucker(corners.slice(0, far + 1));
  const b = douglasPeucker([...corners.slice(far), corners[0]]);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

function douglasPeucker(pts: Pt[]): Pt[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    const [x1, y1] = pts[s], [x2, y2] = pts[e];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    let maxD = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (idx !== -1 && maxD > SIMPLIFY_EPS) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

function pointInPolygon(x: number, y: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Pairs every hole with the smallest outer contour that contains it. */
function buildShapes(loops: Pt[][], scale: number): THREE.Shape[] {
  const outers = loops.filter(l => signedArea(l) > 0).map(l => ({ pts: l, area: signedArea(l), holes: [] as Pt[][] }));
  const holes = loops.filter(l => signedArea(l) < 0);

  for (const hole of holes) {
    // Test a point slightly off the hole's first vertex toward its centroid, so it
    // can't sit exactly on a neighbouring contour.
    const cx = hole.reduce((s, p) => s + p[0], 0) / hole.length;
    const cy = hole.reduce((s, p) => s + p[1], 0) / hole.length;
    const px = hole[0][0] + (cx - hole[0][0]) * 0.01;
    const py = hole[0][1] + (cy - hole[0][1]) * 0.01;
    let owner: (typeof outers)[number] | null = null;
    for (const o of outers) {
      if ((!owner || o.area < owner.area) && pointInPolygon(px, py, o.pts)) owner = o;
    }
    owner?.holes.push(hole);
  }

  // Flip y: canvas grows downward, three.js shapes grow upward.
  const toVec = (pts: Pt[]) => pts.map(([x, y]) => new THREE.Vector2(x * scale, -y * scale));
  return outers.map(o => {
    const shape = new THREE.Shape(toVec(o.pts));
    for (const h of o.holes) shape.holes.push(new THREE.Path(toVec(h)));
    return shape;
  });
}
