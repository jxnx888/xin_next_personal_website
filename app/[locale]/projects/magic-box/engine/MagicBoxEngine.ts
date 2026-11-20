import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import {
  WORK_SPACE_SIZE, SHAPE_SIZE, LIMIT_SIZE, STL_MAX_SCALE, HISTORY_LIMIT, LARGE_SCENE,
  CLICK_SLOP, CAMERA_HOME, LIGHT_DIRECTION, DEFAULT_COLOR, type PickItem,
} from './constants';
import { History } from './history';
import {
  PresenceCommand, StateCommand, captureState, statesEqual, disposeMesh, meshColor,
  type MeshState, type SceneOps,
} from './commands';
import { createMesh, createTextMesh, makeShapeGeometry, meshData, StlLibrary } from './geometry';
import { clampIntoWorkspace, isGrounded, legacyStlPosition, placementPosition } from './bounds';
import { readScene, writeScene, type SavedItem } from './persistence';
import { isTextFontId, DEFAULT_TEXT_FONT, type TextFontId } from './textGeometry';

export type ControlMode = 'translate' | 'scale' | 'rotate';

/** The slice of engine state the React UI renders. */
export type EngineState = {
  objectCount: number;
  /** Hex color of the selected object, or null when nothing is selected. */
  selectedColor: string | null;
  canUndo: boolean;
  canRedo: boolean;
  mode: ControlMode;
  /** A cartoon model was picked and is still downloading. */
  stlLoading: boolean;
  /** Saved cartoon models being downloaded on page load. */
  restoring: { done: number; total: number };
};

export const INITIAL_ENGINE_STATE: EngineState = {
  objectCount: 0, selectedColor: null, canUndo: false, canRedo: false, mode: 'translate',
  stlLoading: false, restoring: { done: 0, total: 0 },
};

/** Messages the engine asks the UI to show; the UI translates them (magicBox.toast.*). */
export type EngineToast = 'loadingModel' | 'modelFailed' | 'largeScene';

export type EngineCallbacks = {
  onState(state: EngineState): void;
  onToast(message: EngineToast): void;
};

/** A shape picked from the sidebar, waiting to be dropped or clicked into the scene. */
type Armed = {
  module: 'shape' | 'stl';
  code: number;
  geometry: THREE.BufferGeometry | null; // null while an STL downloads
  drop: { x: number; y: number } | null; // released on the canvas before it arrived
};

/**
 * The whole Three.js side of Magic Box: scene, controls, placing, selection, undo,
 * autosave and export. It lives outside React — the component creates one in an
 * effect, forwards DOM events to it and renders whatever `onState` reports.
 *
 * Rendering is on demand: a frame is drawn only after something changed (camera,
 * gizmo, scene, size), not 60 times a second while the page sits idle.
 */
export class MagicBoxEngine {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly orbit: OrbitControls;
  private readonly tc: TransformControls;
  private readonly plane: THREE.Mesh;
  private readonly history = new History(HISTORY_LIMIT);
  private readonly stl = new StlLibrary();
  private readonly raycaster = new THREE.Raycaster();
  private readonly resizeObserver: ResizeObserver;

  private placed: THREE.Mesh[] = [];
  /** Saved STLs still downloading from the last visit; written back on every save. */
  private pendingRestore: SavedItem[] = [];
  private restoring = { done: 0, total: 0 };
  private armed: Armed | null = null;
  private mode: ControlMode = 'translate';

  // Gizmo drag in progress
  private dragBefore: MeshState | null = null;
  private dragMoved = false;
  private dragGrounded = false;

  // Live color edit (custom picker): one undo step however many values it passes through
  private colorEdit: { mesh: THREE.Mesh; before: MeshState } | null = null;

  // Click detection
  private pointerDownAt: { x: number; y: number } | null = null;
  private pressedGizmo = false;

  // Unsaved-work tracking for the leave prompt
  private version = 0;
  private exportedVersion = 0;

  private raf = 0;
  private disposed = false;

  private readonly ops: SceneOps = {
    attach: meshes => {
      for (const m of meshes) {
        this.scene.add(m);
        if (!this.placed.includes(m)) this.placed.push(m);
      }
    },
    detach: meshes => {
      for (const m of meshes) {
        if (this.tc.object === m) this.tc.detach();
        this.scene.remove(m);
      }
      this.placed = this.placed.filter(p => !meshes.includes(p));
    },
    dispose: disposeMesh,
  };

  constructor(private readonly container: HTMLElement, private readonly cb: EngineCallbacks) {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;

    // No preserveDrawingBuffer: captureImage() renders and reads back in the same
    // task, before the buffer is cleared, so the per-frame cost isn't needed.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft is deprecated in r185
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
    this.camera.position.set(...CAMERA_HOME);
    this.camera.lookAt(0, 0, 0);

    this.plane = this.buildGround();
    this.buildLights();

    this.orbit = new OrbitControls(this.camera, renderer.domElement);
    this.orbit.minDistance = 10;
    this.orbit.maxDistance = 1300;
    this.orbit.rotateSpeed = 0.3;
    this.orbit.enablePan = false;
    this.orbit.addEventListener('change', () => this.requestRender());

    this.tc = new TransformControls(this.camera, renderer.domElement);
    this.tc.size = 1.5;
    this.tc.setMode(this.mode);
    this.scene.add(this.tc.getHelper());
    this.bindGizmo();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    this.restore();
    this.emit();
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  private get selected(): THREE.Mesh | null {
    return (this.tc.object as THREE.Mesh | undefined) ?? null;
  }

  /** True when the scene changed since it was last exported (or since the page opened). */
  isDirty(): boolean {
    return this.placed.length > 0 && this.version !== this.exportedVersion;
  }

  // ── Sidebar: pick, drag, drop ──────────────────────────────────────────────

  /** Picks a sidebar item. Text has its own dialog, so picking it only cancels. */
  arm(item: PickItem): void {
    this.commitColor();
    this.cancelArm();
    if (item.module === 'text') { this.emit(); return; }

    if (item.module === 'shape') {
      this.armed = { module: 'shape', code: item.code, geometry: makeShapeGeometry(item.code), drop: null };
      this.emit();
      return;
    }

    const armed: Armed = { module: 'stl', code: item.code, geometry: null, drop: null };
    this.armed = armed;
    this.emit();
    this.stl.load(item.code).then(
      ({ geometry }) => {
        // Picked something else, placed text, cleared or unmounted meanwhile.
        if (this.disposed || this.armed !== armed) { geometry.dispose(); return; }
        armed.geometry = geometry;
        const drop = armed.drop;
        armed.drop = null;
        // Dropped on the canvas while loading → place it there now. Otherwise it
        // was a tap and stays armed for the next canvas click.
        if (drop) this.placeAt(drop.x, drop.y);
        else this.emit();
      },
      () => {
        if (this.disposed || this.armed !== armed) return;
        this.armed = null;
        this.emit();
        this.cb.onToast('modelFailed');
      },
    );
  }

  /** The sidebar drag ended at this point. Outside the canvas = a tap: stay armed. */
  drop(clientX: number, clientY: number): void {
    const armed = this.armed;
    if (!armed || !this.insideCanvas(clientX, clientY)) return;
    if (!armed.geometry) {
      armed.drop = { x: clientX, y: clientY };
      this.cb.onToast('loadingModel');
      return;
    }
    this.placeAt(clientX, clientY);
  }

  /** Places the armed item in the middle of the view — for keyboard users. */
  dropAtCenter(): void {
    const r = this.container.getBoundingClientRect();
    this.drop(r.left + r.width / 2, r.top + r.height / 2);
  }

  /** Esc: drop what is armed, else deselect. */
  escape(): void {
    this.commitColor();
    if (this.armed) this.cancelArm();
    else this.tc.detach();
    this.emit();
  }

  private cancelArm(): void {
    // An armed shape geometry belongs to nobody yet; an STL clone likewise.
    this.armed?.geometry?.dispose();
    this.armed = null;
  }

  private placeAt(clientX: number, clientY: number): void {
    const armed = this.armed;
    if (!armed?.geometry) return;
    const hit = this.raycast(clientX, clientY, [this.plane, ...this.placed])[0];
    if (!hit?.face) return; // missed the ground: stay armed

    const mesh = createMesh(armed.geometry, { module: armed.module, geoCode: armed.code }, DEFAULT_COLOR);
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    mesh.position.copy(placementPosition(hit.point, normal, armed.geometry));
    clampIntoWorkspace(mesh);
    this.armed = null; // the geometry now belongs to the mesh
    this.addMeshes([mesh]);
  }

  insertText(text: string, font: TextFontId): boolean {
    const word = text.trim();
    if (!word) return false;
    this.cancelArm();
    const mesh = createTextMesh(word, font, DEFAULT_COLOR);
    if (!mesh) return false;
    clampIntoWorkspace(mesh);
    this.addMeshes([mesh]);
    return true;
  }

  // ── Canvas pointer ─────────────────────────────────────────────────────────

  pointerDown(clientX: number, clientY: number): void {
    this.pointerDownAt = { x: clientX, y: clientY };
    // TransformControls handles pointerdown on the canvas before this bubbles up
    // to React, so `dragging` already says whether the press landed on the gizmo.
    this.pressedGizmo = this.tc.dragging;
  }

  click(clientX: number, clientY: number): void {
    const down = this.pointerDownAt;
    this.pointerDownAt = null;
    if (this.pressedGizmo) { this.pressedGizmo = false; return; }
    // The pointer travelled: that was a camera orbit, not a click. Without this,
    // releasing an orbit over empty ground deselected — or placed the armed shape.
    if (down && Math.hypot(clientX - down.x, clientY - down.y) > CLICK_SLOP) return;

    if (this.armed) {
      if (this.armed.geometry) this.placeAt(clientX, clientY);
      return;
    }
    this.commitColor();
    const hit = this.raycast(clientX, clientY, this.placed)[0];
    if (hit) this.tc.attach(hit.object);
    else this.tc.detach();
    this.emit();
  }

  // ── Toolbar ────────────────────────────────────────────────────────────────

  setMode(mode: ControlMode): void {
    this.mode = mode;
    this.tc.setMode(mode);
    this.emit();
  }

  undo(): void {
    this.commitColor();
    this.tc.detach();
    if (this.history.undo()) this.changed();
    else this.emit();
  }

  redo(): void {
    this.commitColor();
    this.tc.detach();
    if (this.history.redo()) this.changed();
    else this.emit();
  }

  deleteSelected(): void {
    const mesh = this.selected;
    if (!mesh) return;
    this.commitColor();
    this.run(new PresenceCommand([mesh], 'remove', this.ops));
  }

  duplicateSelected(): boolean {
    const src = this.selected;
    if (!src) return false;
    const mesh = createMesh(src.geometry.clone(), { ...meshData(src) }, meshColor(src));
    mesh.position.copy(src.position).add(new THREE.Vector3(SHAPE_SIZE, 0, 0));
    mesh.quaternion.copy(src.quaternion);
    mesh.scale.copy(src.scale);
    clampIntoWorkspace(mesh);
    this.addMeshes([mesh]);
    return true;
  }

  /** Removes everything as one undoable step. Returns false if there was nothing. */
  clear(): boolean {
    this.commitColor();
    this.cancelArm();
    const hadPending = this.pendingRestore.length > 0;
    this.pendingRestore = [];
    if (!this.placed.length) {
      if (hadPending) this.changed();
      return hadPending;
    }
    this.run(new PresenceCommand([...this.placed], 'remove', this.ops));
    return true;
  }

  /** Applies a color immediately without recording it (custom picker while dragging). */
  previewColor(hex: string): void {
    const mesh = this.selected;
    if (!mesh) return;
    if (this.colorEdit?.mesh !== mesh) {
      this.commitColor();
      this.colorEdit = { mesh, before: captureState(mesh) };
    }
    meshColor(mesh).set(hex);
    this.emit();
  }

  /** Records the pending live color edit as one undo step. Safe to call any time. */
  commitColor(): void {
    const edit = this.colorEdit;
    this.colorEdit = null;
    if (!edit) return;
    const after = captureState(edit.mesh);
    if (statesEqual(edit.before, after)) return;
    this.history.push(new StateCommand(edit.mesh, edit.before, after));
    this.changed();
  }

  setColor(hex: string): void {
    this.previewColor(hex);
    this.commitColor();
  }

  resetCamera(): void {
    this.camera.position.set(...CAMERA_HOME);
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.orbit.target.set(0, 0, 0);
    this.orbit.update();
    this.requestRender();
  }

  zoom(percent: number): void {
    this.camera.zoom = percent / 100;
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }

  // ── Output ─────────────────────────────────────────────────────────────────

  /** PNG data URL of the current view, without the gizmo. */
  captureImage(): string {
    const helper = this.tc.getHelper();
    helper.visible = false;
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    helper.visible = true;
    this.requestRender();
    return url;
  }

  /** ASCII STL of the placed objects only, Z-up as 3D printers expect. Null if empty. */
  exportSTL(): string | null {
    if (!this.placed.length) return null;
    this.commitColor();
    // Proxies share geometry and material, so the live scene isn't touched at all.
    const group = new THREE.Group();
    group.rotation.x = Math.PI / 2;
    for (const m of this.placed) {
      const proxy = new THREE.Mesh(m.geometry, m.material);
      proxy.position.copy(m.position);
      proxy.quaternion.copy(m.quaternion);
      proxy.scale.copy(m.scale);
      group.add(proxy);
    }
    group.updateMatrixWorld(true);
    const stl = new STLExporter().parse(group);
    this.exportedVersion = this.version;
    return stl;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.cancelArm();
    this.history.clear(); // frees meshes that only history still referenced
    this.tc.detach();
    this.scene.remove(this.tc.getHelper());
    this.tc.dispose();
    this.orbit.dispose();
    this.scene.traverse(o => { if ((o as THREE.Mesh).isMesh) disposeMesh(o as THREE.Mesh); });
    this.stl.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  /** Ground: the raycast target for placing, a shadow catcher, a grid and two slabs. */
  private buildGround(): THREE.Mesh {
    const W = WORK_SPACE_SIZE;
    const flat = () => new THREE.PlaneGeometry(W, W).rotateX(-Math.PI / 2);

    const plane = new THREE.Mesh(flat(), new THREE.MeshBasicMaterial({ color: 0xe5e4df }));
    this.scene.add(plane);

    // The ground is unlit (MeshBasicMaterial keeps its colour flat), so shadows are
    // drawn by a transparent catcher just above it.
    const catcher = new THREE.Mesh(flat(), new THREE.ShadowMaterial({ opacity: 0.22 }));
    catcher.position.y = 0.02;
    catcher.receiveShadow = true;
    this.scene.add(catcher);

    this.scene.add(new THREE.GridHelper(W, 20, 0x999999, 0x999999));

    const slab = (height: number, y: number, color: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(W, height, W), new THREE.MeshLambertMaterial({ color }));
      m.position.y = y;
      this.scene.add(m);
    };
    slab(0.8, -0.8, 0xffffff);
    slab(3, -2.5, 0xffc869);
    return plane;
  }

  private buildLights(): void {
    this.scene.add(new THREE.AmbientLight(0x606060, 1));
    const light = new THREE.DirectionalLight(0xffffff, 1.3);
    light.position.set(...LIGHT_DIRECTION).normalize().multiplyScalar(300);
    light.castShadow = true;
    // A fixed shadow frustum that covers the whole workspace and its ceiling.
    const s = light.shadow;
    s.mapSize.set(2048, 2048);
    s.camera.left = s.camera.bottom = -WORK_SPACE_SIZE * 0.9;
    s.camera.right = s.camera.top = WORK_SPACE_SIZE * 0.9;
    s.camera.near = 50;
    s.camera.far = 700;
    s.bias = -0.0005;
    s.normalBias = 0.5;
    this.scene.add(light);
  }

  private bindGizmo(): void {
    const tc = this.tc;
    tc.addEventListener('change', () => this.requestRender());
    tc.addEventListener('dragging-changed', e => { this.orbit.enabled = !e.value; });
    tc.addEventListener('mouseDown', () => {
      const m = this.selected;
      if (!m) return;
      this.commitColor();
      this.dragBefore = captureState(m);
      this.dragMoved = false;
      // Something resting on the ground stays on it while scaled or rotated.
      this.dragGrounded = isGrounded(m);
    });
    tc.addEventListener('objectChange', () => {
      const m = this.selected;
      if (!m) return;
      this.dragMoved = true;
      if (this.tc.getMode() === 'scale') {
        m.scale.clampScalar(0.1, meshData(m).module === 'stl' ? STL_MAX_SCALE : LIMIT_SIZE);
      }
      clampIntoWorkspace(m, this.dragGrounded && this.tc.getMode() !== 'translate');
    });
    tc.addEventListener('mouseUp', () => {
      const m = this.selected, before = this.dragBefore;
      this.dragBefore = null;
      if (!m || !before || !this.dragMoved) return;
      const after = captureState(m);
      if (statesEqual(before, after)) return;
      this.history.push(new StateCommand(m, before, after));
      this.changed();
    });
  }

  /** Applies a command and records it. */
  private run(cmd: PresenceCommand): void {
    cmd.redo();
    this.history.push(cmd);
    this.changed();
  }

  private addMeshes(meshes: THREE.Mesh[]): void {
    this.commitColor();
    this.run(new PresenceCommand(meshes, 'add', this.ops));
    this.tc.attach(meshes[meshes.length - 1]);
    this.emit();
    if (this.placed.length === LARGE_SCENE) this.cb.onToast('largeScene');
  }

  /** Every scene mutation ends here: bump the version, autosave, tell the UI. */
  private changed(): void {
    this.version++;
    this.save();
    this.emit();
  }

  private save(): void {
    const items: SavedItem[] = this.placed.map(m => {
      const d = meshData(m);
      return {
        module: d.module, geoCode: d.geoCode,
        ...(d.module === 'text' ? { text: d.text, font: d.font } : {}),
        ...(d.module === 'stl' ? { centered: true } : {}),
        px: m.position.x, py: m.position.y, pz: m.position.z,
        rx: m.rotation.x, ry: m.rotation.y, rz: m.rotation.z,
        sx: m.scale.x, sy: m.scale.y, sz: m.scale.z,
        color: '#' + meshColor(m).getHexString(),
      };
    });
    writeScene([...items, ...this.pendingRestore]);
  }

  private restore(): void {
    const place = (mesh: THREE.Mesh, item: SavedItem) => {
      mesh.position.set(item.px, item.py, item.pz);
      mesh.rotation.set(item.rx, item.ry, item.rz);
      mesh.scale.set(item.sx, item.sy, item.sz);
      this.ops.attach([mesh]);
    };

    const items = readScene();
    this.restoring = { done: 0, total: items.filter(i => i.module === 'stl').length };

    for (const item of items) {
      if (item.module === 'shape') {
        place(createMesh(makeShapeGeometry(item.geoCode), { module: 'shape', geoCode: item.geoCode }, item.color), item);
      } else if (item.module === 'text') {
        const mesh = createTextMesh(item.text!, isTextFontId(item.font) ? item.font : DEFAULT_TEXT_FONT, item.color);
        if (mesh) place(mesh, item);
      } else {
        this.pendingRestore.push(item);
        this.stl.load(item.geoCode).then(
          ({ geometry, offset }) => {
            const i = this.pendingRestore.indexOf(item);
            // Cleared or unmounted while it loaded. Still counts as done for progress.
            if (this.disposed || i === -1) { geometry.dispose(); this.restoreProgress(); return; }
            this.pendingRestore.splice(i, 1);
            const mesh = createMesh(geometry, { module: 'stl', geoCode: item.geoCode }, item.color);
            place(mesh, item);
            // Saved before models were centred: shift so it appears where it was.
            if (!item.centered) mesh.position.copy(legacyStlPosition(mesh.position, mesh.quaternion, mesh.scale, offset));
            this.restoreProgress();
          },
          () => {
            // Keep it pending: it stays in storage and can load next visit.
            console.warn(`[MagicBox] failed to restore STL model ${item.geoCode}`);
            this.restoreProgress();
          },
        );
      }
    }
  }

  private restoreProgress(): void {
    if (this.disposed) return;
    this.restoring = { ...this.restoring, done: this.restoring.done + 1 };
    this.emit();
  }

  private emit(): void {
    if (this.disposed) return;
    const sel = this.selected;
    this.cb.onState({
      objectCount: this.placed.length + this.pendingRestore.length,
      selectedColor: sel ? '#' + meshColor(sel).getHexString() : null,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      mode: this.mode,
      stlLoading: this.armed?.module === 'stl' && !this.armed.geometry,
      restoring: this.restoring,
    });
    // Every state change is also a possible visual change.
    this.requestRender();
  }

  /** Draws one frame on the next animation frame; repeated calls coalesce. */
  private requestRender(): void {
    if (this.raf || this.disposed) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.renderer.render(this.scene, this.camera);
    });
  }

  private resize(): void {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    // setSize clears the canvas; draw now rather than flash an empty frame.
    this.renderer.render(this.scene, this.camera);
  }

  private insideCanvas(x: number, y: number): boolean {
    const r = this.container.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  private raycast(clientX: number, clientY: number, targets: THREE.Object3D[]): THREE.Intersection[] {
    const r = this.container.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.raycaster.intersectObjects(targets, false);
  }
}
