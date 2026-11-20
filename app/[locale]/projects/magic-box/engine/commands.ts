import * as THREE from 'three';
import type { Command } from './history';

/** Everything an undoable edit can change on a placed object. */
export type MeshState = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  color: THREE.Color;
};

type Colored = THREE.Material & { color: THREE.Color };

export function meshColor(mesh: THREE.Mesh): THREE.Color {
  return (mesh.material as Colored).color;
}

export function captureState(mesh: THREE.Mesh): MeshState {
  return {
    position: mesh.position.clone(),
    quaternion: mesh.quaternion.clone(),
    scale: mesh.scale.clone(),
    color: meshColor(mesh).clone(),
  };
}

export function applyState(mesh: THREE.Mesh, s: MeshState): void {
  mesh.position.copy(s.position);
  mesh.quaternion.copy(s.quaternion); // keeps mesh.rotation in sync
  mesh.scale.copy(s.scale);
  meshColor(mesh).copy(s.color);
}

export function statesEqual(a: MeshState, b: MeshState): boolean {
  return a.position.equals(b.position) && a.quaternion.equals(b.quaternion)
    && a.scale.equals(b.scale) && a.color.equals(b.color);
}

export function disposeMesh(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  mats.forEach(m => m.dispose());
}

/** Move / scale / rotate / recolor one object. */
export class StateCommand implements Command {
  constructor(
    private readonly mesh: THREE.Mesh,
    private readonly before: MeshState,
    private readonly after: MeshState,
  ) {}
  undo() { applyState(this.mesh, this.before); }
  redo() { applyState(this.mesh, this.after); }
}

/** How a PresenceCommand puts meshes into / takes them out of the scene. */
export interface SceneOps {
  attach(meshes: THREE.Mesh[]): void;
  detach(meshes: THREE.Mesh[]): void;
  dispose(mesh: THREE.Mesh): void;
}

/**
 * Adds or removes a set of meshes: placing, duplicating, deleting and Clear Scene
 * are all this command. Removed meshes stay alive while history can bring them back
 * and are disposed once it can't.
 */
export class PresenceCommand implements Command {
  constructor(
    private readonly meshes: THREE.Mesh[],
    private readonly kind: 'add' | 'remove',
    private readonly ops: SceneOps,
  ) {}

  redo() {
    if (this.kind === 'add') this.ops.attach(this.meshes);
    else this.ops.detach(this.meshes);
  }

  undo() {
    if (this.kind === 'add') this.ops.detach(this.meshes);
    else this.ops.attach(this.meshes);
  }

  discard(applied: boolean) {
    // The meshes are out of the scene for good: an add that was undone, or a
    // remove that is still in effect.
    const gone = this.kind === 'add' ? !applied : applied;
    if (gone) this.meshes.forEach(m => this.ops.dispose(m));
  }
}
