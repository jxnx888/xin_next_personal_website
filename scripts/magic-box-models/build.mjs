// Builds Magic Box's original cartoon models: binary STLs + sidebar thumbnails.
//
//   node scripts/magic-box-models/build.mjs            # STLs and thumbnails
//   node scripts/magic-box-models/build.mjs --no-thumbs
//
// Thumbnails are rendered by the locally installed Chrome/Edge in headless mode
// (no npm dependency). Set CHROME_PATH if it isn't found automatically.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { MODELS } from './models.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const STL_DIR = path.join(ROOT, 'public/models/stl/original');
const THUMB_DIR = path.join(ROOT, 'public/image/3dBuilder/3dPrinting');
const THUMB_PX = 160; // shown at 56 px; 160 stays sharp on high-DPI screens

// ── STL ──
fs.mkdirSync(STL_DIR, { recursive: true });
const exporter = new STLExporter();
for (const [name, make] of Object.entries(MODELS)) {
  const geo = make();
  const view = exporter.parse(new THREE.Mesh(geo), { binary: true });
  const file = path.join(STL_DIR, `${name}.stl`);
  fs.writeFileSync(file, Buffer.from(view.buffer, view.byteOffset, view.byteLength));
  geo.computeBoundingBox();
  const size = geo.boundingBox.getSize(new THREE.Vector3());
  console.log(`${name.padEnd(8)} ${String(geo.attributes.position.count / 3).padStart(5)} triangles  ` +
    `${size.toArray().map(v => v.toFixed(0)).join('×')}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}

if (process.argv.includes('--no-thumbs')) process.exit(0);

// ── Thumbnails ──
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  const found = candidates.find(p => p && fs.existsSync(p));
  if (!found) throw new Error('Chrome not found — set CHROME_PATH, or run with --no-thumbs');
  return found;
}

const chrome = findChrome();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-thumbs-'));
const three = pathToFileURL(path.join(ROOT, 'node_modules/three/')).href;
const models = pathToFileURL(path.join(HERE, 'models.mjs')).href;

for (const name of Object.keys(MODELS)) {
  // Same look as the existing thumbnails: light grey, faceted, transparent background,
  // three-quarter view from slightly above.
  const html = `<!doctype html><html><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"${three}build/three.module.js","three/examples/jsm/":"${three}examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { MODELS } from '${models}';
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(1);
renderer.setSize(${THUMB_PX}, ${THUMB_PX});
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);
const geo = MODELS[${JSON.stringify(name)}]();
geo.computeBoundingBox();
geo.translate(...geo.boundingBox.getCenter(new THREE.Vector3()).negate().toArray());
const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xe4e4e4, flatShading: true }));
mesh.rotation.y = -0.55;
const scene = new THREE.Scene();
scene.add(mesh);
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(1, 1.4, 1.2); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(-1, 0.2, -0.5); scene.add(fill);
const r = geo.boundingBox.getSize(new THREE.Vector3()).length() / 2;
const camera = new THREE.PerspectiveCamera(30, 1, 1, 1000);
camera.position.set(0, r * 0.7, r * 3.6);
camera.lookAt(0, 0, 0);
renderer.render(scene, camera);
</script></body></html>`;
  const page = path.join(tmp, `${name}.html`);
  fs.writeFileSync(page, html);
  const out = path.join(THUMB_DIR, `sprint_${name}.png`);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--allow-file-access-from-files', '--hide-scrollbars', '--default-background-color=00000000',
    `--window-size=${THUMB_PX},${THUMB_PX}`, '--virtual-time-budget=3000',
    `--screenshot=${out}`, pathToFileURL(page).href,
  ], { stdio: 'ignore' });
  console.log(`thumbnail ${path.relative(ROOT, out)}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
