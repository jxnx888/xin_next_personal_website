import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { clampIntoWorkspace, fitOffset, isGrounded, legacyStlPosition, placementPosition } from './bounds';

const box = (w: number, h: number, d: number) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial());

const up = new THREE.Vector3(0, 1, 0);

describe('fitOffset', () => {
  it('leaves an interval that fits alone', () => expect(fitOffset(-10, 10, -100, 100)).toBe(0));
  it('pushes back from either side', () => {
    expect(fitOffset(90, 110, -100, 100)).toBe(-10);
    expect(fitOffset(-120, -80, -100, 100)).toBe(20);
  });
  it('centres an interval wider than the range', () => expect(fitOffset(50, 350, -100, 100)).toBe(-200));
});

describe('clampIntoWorkspace', () => {
  it('keeps a large object inside using its real size, not a 20-unit cube', () => {
    const m = box(60, 20, 20);
    m.position.set(95, 10, 0);
    clampIntoWorkspace(m);
    expect(m.position.x).toBeCloseTo(70); // right edge at 100
  });

  it('accounts for rotation', () => {
    const m = box(60, 20, 20);
    m.rotation.y = Math.PI / 2; // now 60 deep along z
    m.position.set(0, 10, 95);
    clampIntoWorkspace(m);
    expect(m.position.z).toBeCloseTo(70);
    expect(m.position.x).toBeCloseTo(0);
  });

  it('lifts an object out of the ground, and caps it at the ceiling', () => {
    const m = box(20, 20, 20);
    m.position.set(0, -5, 0);
    clampIntoWorkspace(m);
    expect(m.position.y).toBeCloseTo(10);
    m.position.y = 500;
    clampIntoWorkspace(m);
    expect(m.position.y).toBeCloseTo(190);
  });

  it('keepGrounded pins the lowest point to the ground', () => {
    const m = box(20, 20, 20);
    m.position.set(0, 10, 0);
    m.scale.y = 3; // scaled about its centre: bottom now at -20
    clampIntoWorkspace(m, true);
    expect(m.position.y).toBeCloseTo(30);
    expect(isGrounded(m)).toBe(true);
  });
});

describe('placementPosition', () => {
  it('sits a centred shape on the ground, snapped to the grid', () => {
    const p = placementPosition(new THREE.Vector3(13, 0, -27), up, new THREE.BoxGeometry(20, 20, 20));
    expect(p.toArray()).toEqual([10, 10, -30]);
  });

  it('stacks on top of another object', () => {
    const p = placementPosition(new THREE.Vector3(5, 20, 5), up, new THREE.BoxGeometry(20, 20, 20));
    expect(p.y).toBe(30);
  });

  it('grounds a model whose bottom is not at -height/2', () => {
    const geo = new THREE.BoxGeometry(20, 40, 20).translate(0, 5, 0); // spans y -15..25
    expect(placementPosition(new THREE.Vector3(0, 0, 0), up, geo).y).toBe(15);
  });

  it('a hit on a side goes into the neighbouring cell', () => {
    const p = placementPosition(new THREE.Vector3(20, 10, 10), new THREE.Vector3(1, 0, 0), new THREE.BoxGeometry(20, 20, 20));
    expect(p.toArray()).toEqual([30, 10, 10]);
  });
});

describe('legacyStlPosition', () => {
  it('keeps every vertex where it was before the geometry was centred', () => {
    const raw = new THREE.BoxGeometry(10, 10, 10).translate(7, -3, 2); // off-centre "file"
    raw.computeBoundingBox();
    const center = raw.boundingBox!.getCenter(new THREE.Vector3());
    const centred = raw.clone().translate(-center.x, -center.y, -center.z);
    const offset = center.clone().negate();

    const pos = new THREE.Vector3(30, 12, -40);
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 1.1, -0.4));
    const scale = new THREE.Vector3(1.5, 2, 0.8);

    const before = new THREE.Mesh(raw);
    before.position.copy(pos); before.quaternion.copy(quat); before.scale.copy(scale);
    const after = new THREE.Mesh(centred);
    after.position.copy(legacyStlPosition(pos, quat, scale, offset));
    after.quaternion.copy(quat); after.scale.copy(scale);

    const a = new THREE.Box3().setFromObject(before, true);
    const b = new THREE.Box3().setFromObject(after, true);
    expect(a.min.distanceTo(b.min)).toBeLessThan(1e-6);
    expect(a.max.distanceTo(b.max)).toBeLessThan(1e-6);
  });
});
