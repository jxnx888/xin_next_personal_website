import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { History } from './history';
import { PresenceCommand, StateCommand, captureState, statesEqual, type SceneOps } from './commands';

function mesh(): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshLambertMaterial({ color: '#dddddd' }));
}

/** A scene stand-in that tracks membership and disposals. */
function fakeScene() {
  const inScene = new Set<THREE.Mesh>();
  const disposed: THREE.Mesh[] = [];
  const ops: SceneOps = {
    attach: ms => ms.forEach(m => inScene.add(m)),
    detach: ms => ms.forEach(m => inScene.delete(m)),
    dispose: m => disposed.push(m),
  };
  return { inScene, disposed, ops };
}

function run(h: History, cmd: PresenceCommand) { cmd.redo(); h.push(cmd); }

describe('StateCommand', () => {
  it('restores transform and color both ways', () => {
    const m = mesh();
    const before = captureState(m);
    m.position.set(10, 20, 30);
    m.rotation.set(0, Math.PI / 2, 0);
    m.scale.setScalar(2);
    (m.material as THREE.MeshLambertMaterial).color.set('#ff0000');
    const after = captureState(m);

    const cmd = new StateCommand(m, before, after);
    cmd.undo();
    expect(statesEqual(captureState(m), before)).toBe(true);
    expect(m.rotation.y).toBeCloseTo(0); // rotation follows the quaternion
    cmd.redo();
    expect(statesEqual(captureState(m), after)).toBe(true);
    expect(m.rotation.y).toBeCloseTo(Math.PI / 2);
  });

  it('captureState copies, so later edits do not leak into the snapshot', () => {
    const m = mesh();
    const s = captureState(m);
    m.position.x = 99;
    expect(s.position.x).toBe(0);
  });
});

describe('PresenceCommand', () => {
  it('add: undo removes, redo puts back', () => {
    const { inScene, ops } = fakeScene(), h = new History(), a = mesh();
    run(h, new PresenceCommand([a], 'add', ops));
    expect(inScene.has(a)).toBe(true);
    h.undo(); expect(inScene.has(a)).toBe(false);
    h.redo(); expect(inScene.has(a)).toBe(true);
  });

  it('remove of several (Clear Scene) is a single undo step', () => {
    const { inScene, ops } = fakeScene(), h = new History();
    const ms = [mesh(), mesh(), mesh()];
    ms.forEach(m => run(h, new PresenceCommand([m], 'add', ops)));
    run(h, new PresenceCommand(ms, 'remove', ops));
    expect(inScene.size).toBe(0);
    h.undo();
    expect(inScene.size).toBe(3);
  });

  it('disposes an undone add once a new step makes it unreachable', () => {
    const { disposed, ops } = fakeScene(), h = new History(), a = mesh(), b = mesh();
    run(h, new PresenceCommand([a], 'add', ops));
    h.undo();
    run(h, new PresenceCommand([b], 'add', ops));
    expect(disposed).toEqual([a]);
  });

  it('disposes a removed mesh when the remove falls off the history limit', () => {
    const { disposed, ops } = fakeScene(), h = new History(2), a = mesh();
    run(h, new PresenceCommand([a], 'add', ops));
    run(h, new PresenceCommand([a], 'remove', ops));
    expect(disposed).toEqual([]);
    run(h, new PresenceCommand([mesh()], 'add', ops)); // pushes out the add
    run(h, new PresenceCommand([mesh()], 'add', ops)); // pushes out the remove
    expect(disposed).toEqual([a]);
  });

  it('never disposes a mesh that is still in the scene', () => {
    const { inScene, ops } = fakeScene(), h = new History(1);
    const spy = vi.spyOn(ops, 'dispose');
    const a = mesh();
    run(h, new PresenceCommand([a], 'add', ops));
    run(h, new PresenceCommand([mesh()], 'add', ops)); // the add of `a` drops out, applied
    expect(inScene.has(a)).toBe(true);
    expect(spy).not.toHaveBeenCalledWith(a);
  });
});
