// Original cartoon models for Magic Box, built from Three.js primitives.
//
// Shared by build.mjs (Node: writes the STL files) and the thumbnail page it renders
// in headless Chrome, so the sidebar images always match the models.
//
// Conventions: Y is up, the model stands on y = 0, faces +Z, and is ~50 units tall —
// the same scale as the other cartoon models. Low segment counts on purpose: the
// faceted look matches the rest of the catalogue and keeps the files small.
// Parts may overlap; slicers union overlapping shells when printing.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const { Vector3, Euler, Quaternion, Matrix4 } = THREE;

/** Collects transformed parts and merges them into one geometry. */
function builder() {
  const parts = [];
  const api = {
    add(geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
      let g = geo.index ? geo.toNonIndexed() : geo;
      for (const name of Object.keys(g.attributes)) {
        if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
      }
      const m = new Matrix4().compose(new Vector3(...p), new Quaternion().setFromEuler(new Euler(...r)), new Vector3(...s));
      g.applyMatrix4(m);
      parts.push(g);
      return api;
    },
    /** Adds the part at x and its mirror image at -x (rotations about y/z flipped). */
    pair(make, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
      api.add(make(), { p, r, s });
      api.add(make(), { p: [-p[0], p[1], p[2]], r: [r[0], -r[1], -r[2]], s });
      return api;
    },
    build() {
      const geo = mergeGeometries(parts, false);
      geo.computeVertexNormals();
      return geo;
    },
  };
  return api;
}

const sphere = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const cone = (r, h, seg = 8) => new THREE.ConeGeometry(r, h, seg);
const cyl = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);
const capsule = (r, len, seg = 8) => new THREE.CapsuleGeometry(r, len, 4, seg);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// ── Characters ─────────────────────────────────────────────────────────────

function cat() {
  return builder()
    .add(sphere(13), { p: [0, 13, 0], s: [1, 1.1, 0.95] })              // body
    .add(sphere(11), { p: [0, 34, 1] })                                // head
    .pair(() => cone(4.6, 9, 4), { p: [6.2, 44, 0], r: [0, Math.PI / 4, -0.35] }) // ears
    .pair(() => sphere(3.6, 10, 8), { p: [5.5, 3, 10], s: [1, 0.8, 1.3] })     // front paws
    .pair(() => sphere(1.7, 8, 6), { p: [4, 36, 10.6] })               // eyes
    .add(cone(1.4, 2, 3), { p: [0, 32.5, 12], r: [Math.PI / 2 + 0.3, 0, 0] }) // nose
    .pair(() => sphere(3.2, 10, 8), { p: [3.6, 30.5, 9.6], s: [1, 0.8, 0.7] }) // muzzle
    .add(new THREE.TorusGeometry(9, 2.3, 6, 14, Math.PI * 1.1), { p: [6, 9, -10], r: [0, 0.6, Math.PI / 2] }) // tail
    .build();
}

function bunny() {
  return builder()
    .add(sphere(12.5), { p: [0, 12.5, 0], s: [1, 1.05, 1] })
    .add(sphere(10), { p: [0, 31, 2] })
    .pair(() => capsule(2.8, 13), { p: [4, 48, 0], r: [-0.15, 0, -0.18], s: [1, 1, 0.55] }) // long ears
    .pair(() => sphere(4, 10, 8), { p: [6, 3, 7], s: [0.9, 0.7, 1.6] })   // big feet
    .pair(() => sphere(2.6, 10, 8), { p: [5.5, 13, 10.5] })              // front paws
    .pair(() => sphere(1.6, 8, 6), { p: [3.8, 33, 11.2] })               // eyes
    .add(sphere(1.4, 8, 6), { p: [0, 29.5, 12] })                        // nose
    .add(sphere(4.2, 10, 8), { p: [0, 9, -12] })                         // fluffy tail
    .build();
}

function bear() {
  return builder()
    .add(sphere(14), { p: [0, 14, 0], s: [1, 1.05, 0.95] })
    .add(sphere(8.5, 12, 8), { p: [0, 13, 7.5], s: [1, 1.1, 0.6] })     // belly
    .add(sphere(11.5), { p: [0, 36, 1] })
    .pair(() => sphere(4.2, 10, 8), { p: [8.5, 45, 0], s: [1, 1, 0.7] }) // round ears
    .add(sphere(5, 12, 8), { p: [0, 33, 10.5], s: [1.1, 0.85, 0.9] })   // snout
    .add(sphere(1.8, 8, 6), { p: [0, 34.5, 15] })                       // nose
    .pair(() => sphere(1.6, 8, 6), { p: [4.2, 38.5, 10.8] })            // eyes
    .pair(() => capsule(3.6, 8), { p: [12, 17, 3], r: [0.6, 0, 0.5] })  // arms
    .pair(() => capsule(4.2, 6), { p: [7, 4, 8], r: [Math.PI / 2, 0, 0] }) // legs, sitting
    .build();
}

function penguin() {
  return builder()
    .add(sphere(13, 16, 12), { p: [0, 17, 0], s: [1, 1.3, 0.95] })      // egg body
    .add(sphere(9.5), { p: [0, 37, 0.5] })                             // head
    .add(sphere(9, 12, 10), { p: [0, 16, 5.5], s: [1, 1.25, 0.6] })    // white tummy
    .add(cone(2.4, 6, 6), { p: [0, 35, 11], r: [Math.PI / 2, 0, 0] })  // beak
    .pair(() => sphere(1.7, 8, 6), { p: [3.6, 39, 8.4] })              // eyes
    .pair(() => sphere(4, 10, 8), { p: [13, 19, 0], r: [0, 0, 0.35], s: [0.45, 1.9, 1] }) // flippers
    .pair(() => sphere(3.2, 10, 8), { p: [4.5, 1.6, 6], s: [1.2, 0.5, 1.7] }) // feet
    .build();
}

function robot() {
  return builder()
    .add(box(22, 20, 14), { p: [0, 20, 0] })                           // torso
    .add(box(10, 6, 2), { p: [0, 22, 7.5] })                           // chest panel
    .add(cyl(3, 3, 3, 8), { p: [0, 31.5, 0] })                         // neck
    .add(box(17, 13, 13), { p: [0, 39, 0] })                           // head
    .pair(() => cyl(2.4, 2.4, 2, 10), { p: [4, 40, 7], r: [Math.PI / 2, 0, 0] }) // eyes
    .add(box(8, 1.6, 1.2), { p: [0, 35, 6.8] })                        // mouth
    .add(cyl(0.9, 0.9, 6, 6), { p: [0, 48.5, 0] })                     // antenna
    .add(sphere(2.2, 8, 6), { p: [0, 52, 0] })
    .pair(() => cyl(2.6, 2.6, 14, 8), { p: [14, 21, 0], r: [0, 0, 0.12] }) // arms
    .pair(() => sphere(3.4, 8, 6), { p: [15, 13, 0] })                 // hands
    .pair(() => box(6, 9, 7), { p: [5.5, 5.5, 0] })                    // legs
    .pair(() => box(8, 3, 11), { p: [5.5, 1.5, 1.8] })                 // feet
    .build();
}

function rocket() {
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.lineTo(9, -4);
  fin.lineTo(9, 6);
  fin.lineTo(0, 16);
  fin.closePath();
  const finGeo = () => new THREE.ExtrudeGeometry(fin, { depth: 2.4, bevelEnabled: false }).translate(0, 0, -1.2);

  const b = builder()
    .add(cyl(8, 8.5, 28, 16), { p: [0, 22, 0] })                        // body
    .add(cone(8, 15, 16), { p: [0, 43.5, 0] })                          // nose
    .add(cyl(5.5, 7, 5, 12), { p: [0, 5.5, 0] })                        // nozzle
    .add(new THREE.TorusGeometry(3.6, 1.1, 6, 14), { p: [0, 28, 8.2] }) // window ring
    .add(cyl(3.2, 3.2, 1, 14), { p: [0, 28, 7.9], r: [Math.PI / 2, 0, 0] }) // window
    .add(new THREE.TorusGeometry(8.6, 1, 6, 20), { p: [0, 15, 0], r: [Math.PI / 2, 0, 0] }); // band
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    b.add(finGeo(), { p: [Math.cos(a) * 7.5, 8, Math.sin(a) * 7.5], r: [0, -a, 0] });
  }
  return b.build();
}

/** title → builder. Titles double as file names and i18n keys (magicBox.shapes.*). */
export const MODELS = { cat, bunny, bear, penguin, robot, rocket };
