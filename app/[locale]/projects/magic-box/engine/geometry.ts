import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { SHAPE_SIZE, STL_FILES, FALLBACK_STL, type ObjectModule } from './constants';
import { createTextGeometry, type TextFontId } from './textGeometry';

/** What identifies a placed object; stored in mesh.userData and in the save file. */
export type MeshData = { module: ObjectModule; geoCode: number; text?: string; font?: TextFontId };

export function meshData(mesh: THREE.Object3D): MeshData {
  return mesh.userData as MeshData;
}

export function makeShapeGeometry(code: number): THREE.BufferGeometry {
  const S = SHAPE_SIZE;
  switch (code) {
    case 0: return new THREE.BoxGeometry(S, S, S);
    case 1: return new THREE.CylinderGeometry(S / 2, S / 2, S, 32);
    case 2: return new THREE.ConeGeometry(S / 2, S, 32);
    case 3: return new THREE.SphereGeometry(S / 2, 32, 32);
    case 4: return new THREE.TorusGeometry(10, 2.5, 16, 100);
    case 5: return new THREE.CylinderGeometry(S / 2, S / 2, S, 5);
    case 6: return new THREE.ConeGeometry(S / 2, S, 4);
    case 7: {
      const r = S / 2, ri = S / 3, h = S;
      const shape = new THREE.Shape();
      shape.moveTo(r * 2, r);
      shape.absarc(r, r, r, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.moveTo(r + ri, r);
      hole.absarc(r, r, ri, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, steps: 1, curveSegments: 60 });
      geo.center();
      geo.rotateX(-Math.PI / 2);
      return geo;
    }
    case 8: return new THREE.CylinderGeometry(S / 2, S / 2, S, 3);
    default: return new THREE.BoxGeometry(S, S, S);
  }
}

/** The one place a placed object's mesh is built — for every module and code path. */
export function createMesh(geometry: THREE.BufferGeometry, data: MeshData, color: THREE.ColorRepresentation): THREE.Mesh {
  const material = data.module === 'text'
    ? new THREE.MeshPhongMaterial({ color, flatShading: true })
    : new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { ...data };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createTextMesh(text: string, font: TextFontId, color: THREE.ColorRepresentation): THREE.Mesh | null {
  const geo = createTextGeometry(text, font);
  return geo ? createMesh(geo, { module: 'text', geoCode: 222, text, font }, color) : null;
}

export type LoadedStl = {
  /** Geometry with its bounding box centred on the origin. */
  geometry: THREE.BufferGeometry;
  /** The translation that centring applied — needed to migrate pre-centring saves. */
  offset: THREE.Vector3;
};

/**
 * Loads and parses each STL once per session. Every caller gets its own clone, so a
 * mesh can dispose its geometry without breaking the cache.
 *
 * The model files have arbitrary origins (up to ~15 units off-centre), which made
 * rotation swing them around and left some floating above the ground. They are
 * centred here so the pivot is the middle of the model; placement grounds them.
 */
export class StlLibrary {
  private readonly cache = new Map<number, Promise<LoadedStl>>();
  private readonly loader = new STLLoader();

  load(code: number): Promise<LoadedStl> {
    let p = this.cache.get(code);
    if (!p) {
      p = this.loader.loadAsync(STL_FILES[code] ?? STL_FILES[FALLBACK_STL]).then(geometry => {
        geometry.computeBoundingBox();
        const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
        geometry.translate(-center.x, -center.y, -center.z);
        return { geometry, offset: center.negate() };
      });
      p.catch(() => this.cache.delete(code)); // let a later pick retry
      this.cache.set(code, p);
    }
    return p.then(r => ({ geometry: r.geometry.clone(), offset: r.offset.clone() }));
  }

  dispose(): void {
    for (const p of this.cache.values()) p.then(r => r.geometry.dispose(), () => {});
    this.cache.clear();
  }
}
