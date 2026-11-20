import * as THREE from 'three';
import { SHAPE_SIZE, WORK_SPACE_SIZE } from './constants';

// Placement and workspace bounds, from the object's real bounding box.
//
// The previous code assumed every object was a SHAPE_SIZE cube centred on its
// position, so cartoon models and text — different sizes, different origins — and
// anything rotated were clamped against the wrong extents.

const W = WORK_SPACE_SIZE;
const EPS = 0.01;
const _box = new THREE.Box3();

/**
 * How far to shift the interval [min, max] to fit inside [lo, hi]. An interval wider
 * than the range is centred in it.
 */
export function fitOffset(min: number, max: number, lo: number, hi: number): number {
  if (max - min > hi - lo) return (lo + hi) / 2 - (min + max) / 2;
  if (min < lo) return lo - min;
  if (max > hi) return hi - max;
  return 0;
}

function worldBox(obj: THREE.Object3D): THREE.Box3 {
  obj.updateMatrixWorld(true);
  return _box.setFromObject(obj);
}

/** The object rests on the ground (its lowest point is at y = 0). */
export function isGrounded(obj: THREE.Object3D): boolean {
  return Math.abs(worldBox(obj).min.y) < EPS;
}

/**
 * Moves the object back inside the workspace: within ±W/2 on x and z, between the
 * ground and W on y. `keepGrounded` pins its lowest point to the ground instead —
 * used while scaling or rotating something that was resting on it.
 */
export function clampIntoWorkspace(obj: THREE.Object3D, keepGrounded = false): void {
  const b = worldBox(obj);
  obj.position.x += fitOffset(b.min.x, b.max.x, -W / 2, W / 2);
  obj.position.z += fitOffset(b.min.z, b.max.z, -W / 2, W / 2);
  obj.position.y += keepGrounded ? -b.min.y : fitOffset(b.min.y, b.max.y, 0, W);
}

const snap = (v: number) => Math.floor(v / SHAPE_SIZE) * SHAPE_SIZE + SHAPE_SIZE / 2;

/**
 * Where a new, unrotated, unscaled object goes when dropped on `hitPoint`.
 * x/z snap to the grid. On an upward-facing surface (the ground, the top of another
 * object) it sits on that surface; against a side it snaps to the grid as before.
 */
export function placementPosition(
  hitPoint: THREE.Vector3,
  worldNormal: THREE.Vector3,
  geometry: THREE.BufferGeometry,
): THREE.Vector3 {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  // Nudge off the surface so a hit on a side lands in the neighbouring cell.
  const p = hitPoint.clone().add(worldNormal);
  return new THREE.Vector3(
    snap(p.x),
    worldNormal.y > 0.5 ? hitPoint.y - bb.min.y : snap(p.y),
    snap(p.z),
  );
}

/**
 * Position for a cartoon model saved before models were centred (schema < 3).
 * The old mesh drew vertex v at p + R·S·v; the centred geometry holds v + offset,
 * so the same placement needs p − R·S·offset.
 */
export function legacyStlPosition(
  position: THREE.Vector3,
  quaternion: THREE.Quaternion,
  scale: THREE.Vector3,
  offset: THREE.Vector3,
): THREE.Vector3 {
  return position.clone().sub(offset.clone().multiply(scale).applyQuaternion(quaternion));
}
