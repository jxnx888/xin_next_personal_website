/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const WORK_SPACE_SIZE = 200;
const SHAPE_SIZE = 20;
const LIMIT_SIZE = 4;
const SIDEBAR_W = 120;

const STL_FILES: Record<number, string> = {
  0: '/models/stl/ascii/standing.stl',
  1: '/models/stl/ascii/climbing.stl',
  2: '/models/stl/ascii/lying.stl',
  3: '/models/stl/ascii/sitting.stl',
  4: '/models/stl/ascii/tyrannosaurusRex.stl',
  5: '/models/stl/ascii/pokemon/bulbasaur_starter_1gen_flowalistik.stl',
  6: '/models/stl/ascii/pokemon/charmander_starter_1gen_flowalistik.stl',
  7: '/models/stl/ascii/pokemon/chikorita_starter_2gen_flowalistik.stl',
  8: '/models/stl/ascii/pokemon/pikachu_1gen_flowalistik.stl',
  9: '/models/stl/ascii/pokemon/squirtle_starter_1gen_flowalistik.stl',
  10: '/models/stl/ascii/pokemon/totodile_starter_2gen_flowalistik.stl',
  11: '/models/stl/ascii/five-point-star.stl',
};

// ─── Static shape catalogue ───────────────────────────────────────────────────
const SHAPES_LIST = [
  { title: 'cube',          name: 'Cube',           code: 0,  module: 'shape' },
  { title: 'ball',          name: 'Ball',            code: 3,  module: 'shape' },
  { title: 'cylinder',      name: 'Cylinder',        code: 1,  module: 'shape' },
  { title: 'prismatic',     name: 'Prism',           code: 5,  module: 'shape' },
  { title: 'cone',          name: 'Cone',            code: 2,  module: 'shape' },
  { title: 'pyramid',       name: 'Pyramid',         code: 6,  module: 'shape' },
  { title: 'doughnut',      name: 'Doughnut',        code: 4,  module: 'shape' },
  { title: 'hollowcylinder',name: 'Hollow Cyl.',     code: 7,  module: 'shape' },
  { title: 'triprism',      name: 'Tri-Prism',       code: 8,  module: 'shape' },
  { title: 'fivepointstar', name: 'Star',            code: 11, module: 'stl'   },
  { title: 'text',          name: 'Text',            code: 222,module: 'text'  },
];

const CARTOON_LIST = [
  { title: 'standing',      name: 'Stand',      code: 0 },
  { title: 'climbing',      name: 'Climb',      code: 1 },
  { title: 'lying',         name: 'Lie',        code: 2 },
  { title: 'sitting',       name: 'Sit',        code: 3 },
  { title: 'tyrannosaurusRex', name: 'T-Rex',   code: 4 },
  { title: 'bulbasaur',     name: 'Bulbasaur',  code: 5 },
  { title: 'charmander',    name: 'Charmander', code: 6 },
  { title: 'chikorita',     name: 'Chikorita',  code: 7 },
  { title: 'pikachu',       name: 'Pikachu',    code: 8 },
  { title: 'squirtle',      name: 'Squirtle',   code: 9 },
  { title: 'totodile',      name: 'Totodile',   code: 10 },
];

type ControlMode = 'translate' | 'scale' | 'rotate';
type DragItem = { module: string; code: number; title: string };

const COLOR_PALETTE = [
  '#dddddd', '#ffffff', '#f5f5dc', '#ffd700',
  '#f2f545', '#ffa040', '#ff6b6b', '#ff1493',
  '#c084fc', '#60a5fa', '#34d399', '#92400e',
];

// ─── Geometry factory ─────────────────────────────────────────────────────────
function makeGeometry(code: number): THREE.BufferGeometry {
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function MagicBoxClient() {
  const router = useRouter();
  const locale = useLocale();

  // THREE.js DOM container
  const containerRef = useRef<HTMLDivElement>(null);

  // THREE.js scene refs
  const sceneRef        = useRef<THREE.Scene | null>(null);
  const cameraRef       = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef     = useRef<THREE.WebGLRenderer | null>(null);
  const orbitRef        = useRef<OrbitControls | null>(null);
  const tcRef           = useRef<TransformControls | null>(null);
  const planeRef        = useRef<THREE.Mesh | null>(null);
  const gridRef         = useRef<THREE.GridHelper | null>(null);
  const ground0Ref      = useRef<THREE.Mesh | null>(null);
  const ground1Ref      = useRef<THREE.Mesh | null>(null);
  const objectsRef      = useRef<THREE.Object3D[]>([]);
  const animRef         = useRef(0);

  // Placement state
  const curGeomRef      = useRef<THREE.BufferGeometry | null>(null);
  const curMatRef       = useRef<THREE.MeshLambertMaterial>(new THREE.MeshLambertMaterial({ color: 0xdddddd }));
  const stlFlagRef      = useRef(0);   // 0=basic geo, 1=STL
  const curCodeRef      = useRef(0);   // current shape/stl code
  const shootedRef      = useRef(true); // true=select mode, false=place mode
  const pendingTextRestoreRef = useRef<any[]>([]); // text objects pending font load

  // Sidebar drag state
  const dragItemRef     = useRef<DragItem | null>(null);

  // Transform tracking
  const focusedObjRef   = useRef<THREE.Object3D | null>(null);
  const tcClickedRef    = useRef(false); // true when TC gizmo was pressed this cycle
  const ctrlMovedRef    = useRef(false);
  const tcMoveRef       = useRef(false);
  const delFlagRef      = useRef(false);
  const tcModeRef       = useRef<ControlMode>('translate');
  const tcScaleYPosRef  = useRef(0);
  const tcScaleYFlagRef = useRef(false);

  // Undo / redo
  const allOpsRef       = useRef<any[]>([]);
  const redoOpsRef      = useRef<any[]>([]);
  const objHistRef      = useRef<Record<string, any[]>>({});
  const redoHistRef     = useRef<Record<string, any[]>>({});

  // Font
  const fontRef         = useRef<any>(null);

  // Save flow
  const saveFlagRef     = useRef(false);
  const goHomeRef       = useRef(false);
  const saveNameRef     = useRef<HTMLInputElement>(null);
  const toastTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── React UI state ──
  const [shapesOpen, setShapesOpen]       = useState(true);
  const [cartoonOpen, setCartoonOpen]     = useState(false);
  const [showSidebar, setShowSidebar]     = useState(true);
  const [isPortrait, setIsPortrait]       = useState(false);
  const [showGuide, setShowGuide]         = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('mb_guide_seen') !== '1'
      : false
  );
  const [dragItem, setDragItem]           = useState<DragItem | null>(null);
  const [dragPos, setDragPos]             = useState({ x: 0, y: 0 });
  const [showBottomBar, setShowBottomBar] = useState(false);
  const [controlMode, setControlMode]     = useState<ControlMode>('translate');
  const [undoActive, setUndoActive]       = useState(false);
  const [redoActive, setRedoActive]       = useState(false);
  const [colorControl, setColorControl]   = useState(false);
  const [currentColor, setCurrentColor]   = useState('#dddddd');
  const [showColorOpt, setShowColorOpt]   = useState(false);
  const [showZoomOpt, setShowZoomOpt]     = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAskModal, setShowAskModal]   = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput]         = useState('');
  const [showLoading, setShowLoading]     = useState(true);
  const [loadingPct, setLoadingPct]       = useState(0);
  const [stlLoading, setStlLoading]       = useState(false);
  const [toast, setToast]                 = useState('');
  const [activeSave, setActiveSave]       = useState(false);
  const [statusTxt, setStatusTxt]         = useState('Status: Move');
  const [resetConfirm, setResetConfirm]   = useState(false);

  // ── Three.js init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Helper: update React state to reflect current transform control
    const syncColor = () => {
      const tc = tcRef.current;
      if (!tc?.object) { setColorControl(false); return; }
      const mat = (tc.object as THREE.Mesh).material as THREE.MeshLambertMaterial;
      setCurrentColor('#' + mat.color.getHexString());
      setColorControl(true);
    };

    // Undo/redo helpers defined inside useEffect so they close over setState fns
    const pushOp = (mesh: THREE.Mesh, operation: string) => {
      delFlagRef.current = false;
      saveFlagRef.current = false;
      if (allOpsRef.current.length >= 5) allOpsRef.current.shift();
      const mat = mesh.material as THREE.MeshLambertMaterial;
      allOpsRef.current.push({
        uuid: mesh.uuid, position: mesh.position.clone(),
        rotation: mesh.rotation.clone(), quaternion: mesh.quaternion.clone(),
        scale: mesh.scale.clone(), color: mat.color.clone(), operation, mesh,
      });
    };

    const pushHist = (e: any, type: number) => {
      const now = Date.now();
      if (type === 0) {
        // undo history for a THREE.Mesh
        const mesh = e as THREE.Mesh;
        if (!objHistRef.current[mesh.uuid]) objHistRef.current[mesh.uuid] = [];
        const mat = mesh.material as THREE.MeshLambertMaterial;
        objHistRef.current[mesh.uuid].push({
          uuid: mesh.uuid, position: mesh.position.clone(), rotation: mesh.rotation.clone(),
          quaternion: mesh.quaternion.clone(), scale: mesh.scale.clone(),
          color: mat.color.clone(), mesh, time: now,
          index: objHistRef.current[mesh.uuid].length,
        });
      } else if (type === 1) {
        // push to redo history (from undo op object)
        if (!redoHistRef.current[e.uuid]) redoHistRef.current[e.uuid] = [];
        redoHistRef.current[e.uuid].push({ ...e, time: now });
      } else if (type === 2) {
        // push to redo history (from redo op object)
        if (!redoHistRef.current[e.uuid]) redoHistRef.current[e.uuid] = [];
        redoHistRef.current[e.uuid].push({ ...e, time: now });
      }
    };

    const addOpFromTransform = () => {
      const tc = tcRef.current;
      if (focusedObjRef.current && tc?.object) {
        pushOp(tc.object as THREE.Mesh, 'transform');
        pushHist(tc.object as THREE.Mesh, 0);
      }
      setUndoActive(allOpsRef.current.length > 0);
    };

    // Bounds clamping during scale
    const clampBounds = (obj: THREE.Mesh) => {
      const S = SHAPE_SIZE, W = WORK_SPACE_SIZE;
      const { x, y, z } = obj.position;
      const { x: sx, y: sy, z: sz } = obj.scale;
      if (x >= 0 && x + (S * sx) / 2 >= W / 2) obj.position.x = W / 2 - (S * sx) / 2;
      else if (x < 0 && x - (S * sx) / 2 <= -W / 2) obj.position.x = -W / 2 + (S * sx) / 2;
      if (z >= 0 && z + (S * sz) / 2 >= W / 2) obj.position.z = W / 2 - (S * sz) / 2;
      else if (z < 0 && z - (S * sz) / 2 <= -W / 2) obj.position.z = -W / 2 + (S * sz) / 2;
      if (y >= 0 && y <= (S * sy) / 2) obj.position.y = (S * sy) / 2;
      else if (tcScaleYFlagRef.current) obj.position.y = (S * sy) / 2;
      else if (y < 0) obj.position.y = (S * sy) / 2;
    };

    const onAnimStep = () => {
      const tc = tcRef.current;
      if (!tc?.object) return;
      const obj = tc.object as THREE.Mesh;
      const mode = tc.getMode();
      if (mode === 'scale') {
        const limitMax = obj.name === 'stl' ? 2.22 : LIMIT_SIZE;
        obj.scale.clampScalar(0.1, limitMax);
        clampBounds(obj);
      } else if (mode === 'translate') {
        const S = SHAPE_SIZE, W = WORK_SPACE_SIZE;
        const { x, y, z } = obj.position;
        const { x: sx, y: sy, z: sz } = obj.scale;
        const ax = (tc as any).axis as string;
        if (ax === 'X') {
          if (x >= 0 && x + (S * sx) / 2 >= W / 2) obj.position.x = W / 2 - (S * sx) / 2;
          else if (x < 0 && x - (S * sx) / 2 <= -W / 2) obj.position.x = -W / 2 + (S * sx) / 2;
        } else if (ax === 'Z') {
          if (z >= 0 && z + (S * sz) / 2 >= W / 2) obj.position.z = W / 2 - (S * sz) / 2;
          else if (z < 0 && z - (S * sz) / 2 <= -W / 2) obj.position.z = -W / 2 + (S * sz) / 2;
        } else if (ax === 'Y') {
          if (y >= 0 && y + (S * sy) / 2 >= W) obj.position.y = W - (S * sy) / 2;
          else if (y < (S * sy) / 2) obj.position.y = (S * sy) / 2;
        }
      }
    };

    // ── Scene ──
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 1, 10000);
    camera.position.set(170, 145, 255);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ── Ground plane (for raycasting + visual) ──
    const planeGeo = new THREE.PlaneGeometry(WORK_SPACE_SIZE, WORK_SPACE_SIZE);
    planeGeo.rotateX(-Math.PI / 2);
    const plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0xe5e4df, visible: true }));
    plane.name = 'plane';
    plane.receiveShadow = true;
    scene.add(plane);
    planeRef.current = plane;
    objectsRef.current = [plane];

    // ── Grid ──
    const grid = new THREE.GridHelper(WORK_SPACE_SIZE, 20, 0x999999, 0x999999);
    scene.add(grid);
    gridRef.current = grid;

    const g0 = new THREE.Mesh(
      new THREE.BoxGeometry(WORK_SPACE_SIZE, 0.8, WORK_SPACE_SIZE),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    g0.position.y = -0.8;
    g0.receiveShadow = true;
    scene.add(g0);
    ground0Ref.current = g0;

    const g1 = new THREE.Mesh(
      new THREE.BoxGeometry(WORK_SPACE_SIZE, 3, WORK_SPACE_SIZE),
      new THREE.MeshLambertMaterial({ color: 0xffc869 })
    );
    g1.position.y = -2.5;
    g1.receiveShadow = true;
    scene.add(g1);
    ground1Ref.current = g1;

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x606060, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(1, 0.75, 0.5).normalize();
    scene.add(dirLight);

    // ── OrbitControls ──
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.minDistance = 10;
    orbit.maxDistance = 1300;
    orbit.rotateSpeed = 0.3;
    orbit.enablePan = false;
    orbitRef.current = orbit;
    orbit.addEventListener('change', () => { ctrlMovedRef.current = true; });

    // ── TransformControls ──
    const tc = new TransformControls(camera, renderer.domElement);
    tc.size = 1.5;
    tc.setMode('translate');
    scene.add(tc.getHelper());
    tcRef.current = tc;

    tc.addEventListener('dragging-changed', (evt: any) => {
      orbit.enabled = !evt.value;
    });
    tc.addEventListener('change', () => { syncColor(); onAnimStep(); });
    tc.addEventListener('mouseDown', () => {
      tcClickedRef.current = true;
      tcMoveRef.current = false;
      const obj = tc.object as THREE.Mesh | undefined;
      if (obj) {
        tcScaleYPosRef.current = obj.position.y;
        tcScaleYFlagRef.current = obj.name === 'shapes'
          ? obj.position.y === (SHAPE_SIZE * obj.scale.y) / 2
          : false;
      }
    });
    tc.addEventListener('objectChange', () => { tcMoveRef.current = true; });
    tc.addEventListener('mouseUp', () => {
      if (tcMoveRef.current) addOpFromTransform();
      syncColor();
      if (focusedObjRef.current) (tc as any).object = focusedObjRef.current;
      saveSceneToStorage();
    });

    // ── Render loop ──
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ──
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // ── Pre-load font + restore text objects ──
    const fontLoader = new FontLoader();
    fontLoader.load('/font/SimHei_Regular.json', (font) => {
      fontRef.current = font;
      for (const item of pendingTextRestoreRef.current) {
        const word = item.text as string;
        if (!word) continue;
        const fs = word.length <= 2 ? 60 : word.length === 3 ? 50 : word.length === 4 ? 45
          : word.length === 5 ? 40 : word.length === 6 ? 35 : word.length === 7 ? 30 : 20;
        const geo = new TextGeometry(word, { font, size: fs, depth: 10, curveSegments: 22, bevelEnabled: false });
        geo.computeBoundingBox(); geo.computeVertexNormals();
        const xMid = -0.5 * (geo.boundingBox!.max.x - geo.boundingBox!.min.x);
        geo.translate(xMid, -25, 0); geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshPhongMaterial({ color: item.color, flatShading: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = 'shapes';
        mesh.userData = { module: 'text', geoCode: 222, text: word };
        mesh.position.set(item.px, item.py, item.pz);
        mesh.rotation.set(item.rx, item.ry, item.rz);
        mesh.scale.set(item.sx, item.sy, item.sz);
        mesh.receiveShadow = true; mesh.castShadow = true;
        scene.add(mesh); objectsRef.current.push(mesh);
      }
      pendingTextRestoreRef.current = [];
      if (objectsRef.current.length > 1) {
        setShowBottomBar(true); setActiveSave(true); setUndoActive(true);
      }
    });

    // ── Restore scene from localStorage ──
    try {
      const saved = JSON.parse(localStorage.getItem('mb_scene') || '[]') as any[];
      for (const item of saved) {
        if (item.module === 'shape') {
          const geo = makeGeometry(item.geoCode);
          const mat = new THREE.MeshLambertMaterial({ color: item.color });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.name = 'shapes';
          mesh.userData = { module: 'shape', geoCode: item.geoCode };
          mesh.position.set(item.px, item.py, item.pz);
          mesh.rotation.set(item.rx, item.ry, item.rz);
          mesh.scale.set(item.sx, item.sy, item.sz);
          mesh.receiveShadow = true; mesh.castShadow = true;
          scene.add(mesh); objectsRef.current.push(mesh);
        } else if (item.module === 'stl') {
          const loader = new STLLoader();
          loader.load(STL_FILES[item.geoCode] ?? STL_FILES[4], (geo) => {
            if (!sceneRef.current) return;
            const mat = new THREE.MeshLambertMaterial({ color: item.color });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.name = 'stl';
            mesh.userData = { module: 'stl', geoCode: item.geoCode };
            mesh.position.set(item.px, item.py, item.pz);
            mesh.rotation.set(item.rx, item.ry, item.rz);
            mesh.scale.set(item.sx, item.sy, item.sz);
            mesh.receiveShadow = true; mesh.castShadow = true;
            sceneRef.current.add(mesh); objectsRef.current.push(mesh);
            setShowBottomBar(true); setActiveSave(true); setUndoActive(true);
          });
        } else if (item.module === 'text') {
          pendingTextRestoreRef.current.push(item);
        }
      }
      if (saved.some(i => i.module !== 'text') && saved.length > 0) {
        setShowBottomBar(true); setActiveSave(true); setUndoActive(true);
      }
    } catch {}
    shootedRef.current = true;

    // ── Loading bar ──
    let pct = 0;
    const tick = setInterval(() => { pct += 10; setLoadingPct(Math.min(pct, 100)); }, 100);
    const hide = setTimeout(() => { clearInterval(tick); setShowLoading(false); }, 1000);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(tick);
      clearTimeout(hide);
      window.removeEventListener('resize', onResize);
      orbit.dispose();
      tc.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // ── Sidebar drag-to-place global listeners (mouse + touch) ──────────────
  useEffect(() => {
    const placeAt = (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el || !sceneRef.current || !cameraRef.current) return;
      if (!curGeomRef.current) {
        setToast('Still loading, please try again');
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(''), 2000);
        return;
      }
      const rect = el.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right ||
          clientY < rect.top  || clientY > rect.bottom) return;
      const ndcX = ((clientX - rect.left) / rect.width)  * 2 - 1;
      const ndcY = -((clientY - rect.top)  / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
      const hits = raycaster.intersectObjects(objectsRef.current);
      if (!hits.length) return;
      const hit = hits[0];
      const mesh = new THREE.Mesh(curGeomRef.current!, curMatRef.current.clone());
      mesh.position.copy(hit.point).add(hit.face!.normal);
      if (stlFlagRef.current === 0) {
        mesh.position.divideScalar(SHAPE_SIZE).floor().multiplyScalar(SHAPE_SIZE).addScalar(SHAPE_SIZE / 2);
        mesh.name = 'shapes';
        mesh.userData = { module: 'shape', geoCode: curCodeRef.current };
      } else {
        mesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        mesh.name = 'stl';
        mesh.userData = { module: 'stl', geoCode: curCodeRef.current };
      }
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      sceneRef.current!.add(mesh);
      objectsRef.current.push(mesh);
      allOpsRef.current.push({
        uuid: mesh.uuid, position: mesh.position.clone(), rotation: mesh.rotation.clone(),
        quaternion: mesh.quaternion.clone(), scale: mesh.scale.clone(),
        color: (mesh.material as THREE.MeshLambertMaterial).color.clone(),
        operation: 'add', mesh,
      });
      if (!objHistRef.current[mesh.uuid]) objHistRef.current[mesh.uuid] = [];
      objHistRef.current[mesh.uuid].push({
        uuid: mesh.uuid, position: mesh.position.clone(), rotation: mesh.rotation.clone(),
        quaternion: mesh.quaternion.clone(), scale: mesh.scale.clone(),
        color: (mesh.material as THREE.MeshLambertMaterial).color.clone(),
        mesh, time: Date.now(), index: 0,
      });
      tcRef.current!.attach(mesh);
      focusedObjRef.current = mesh;
      shootedRef.current = true;
      curGeomRef.current = null;
      curMatRef.current = new THREE.MeshLambertMaterial({ color: 0xdddddd });
      setShowBottomBar(true); setActiveSave(true); setUndoActive(true);
      setColorControl(true); setCurrentColor('#dddddd');
      saveSceneToStorage();
    };

    // Mouse
    const onMove    = (e: MouseEvent)     => { if (dragItemRef.current) setDragPos({ x: e.clientX, y: e.clientY }); };
    const onUp      = (e: MouseEvent)     => { const i = dragItemRef.current; if (!i) return; dragItemRef.current = null; setDragItem(null); placeAt(e.clientX, e.clientY); };
    // Touch
    const onTMove   = (e: TouchEvent)     => { if (!dragItemRef.current) return; const t = e.touches[0]; setDragPos({ x: t.clientX, y: t.clientY }); };
    const onTEnd    = (e: TouchEvent)     => { const i = dragItemRef.current; if (!i) return; dragItemRef.current = null; setDragItem(null); const t = e.changedTouches[0]; placeAt(t.clientX, t.clientY); };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onTMove, { passive: true });
    window.addEventListener('touchend',  onTEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onTMove);
      window.removeEventListener('touchend',  onTEnd);
    };
  }, []); // refs are always current — no deps needed

  // ── Orientation lock ───────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const check = (e: MediaQueryListEvent | MediaQueryList) => setIsPortrait(e.matches);
    check(mq);
    mq.addEventListener('change', check);
    try { (screen.orientation as any).lock('landscape').catch(() => {}); } catch {}
    return () => mq.removeEventListener('change', check);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (focusedObjRef.current) handleDelete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers (read refs, update state) ─────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 2000);
  };

  const saveSceneToStorage = () => {
    const items = objectsRef.current.filter(o => o.name === 'shapes' || o.name === 'stl');
    const data = items.map(o => {
      const mat = (o as THREE.Mesh).material as THREE.MeshLambertMaterial;
      return {
        module:  o.userData.module  as string,
        geoCode: o.userData.geoCode as number,
        text:    o.userData.text    as string | undefined,
        px: o.position.x, py: o.position.y, pz: o.position.z,
        rx: o.rotation.x, ry: o.rotation.y, rz: o.rotation.z,
        sx: o.scale.x,    sy: o.scale.y,    sz: o.scale.z,
        color: '#' + mat.color.getHexString(),
      };
    });
    try { localStorage.setItem('mb_scene', JSON.stringify(data)); } catch {}
  };

  const syncBottomBar = () => setShowBottomBar(objectsRef.current.length > 1);
  const syncSave      = () => {
    setActiveSave(objectsRef.current.length > 1);
    saveSceneToStorage();
  };
  const syncUndo      = () => setUndoActive(allOpsRef.current.length > 0);
  const syncRedo      = () => setRedoActive(redoOpsRef.current.length > 0);

  const pushOp = (mesh: THREE.Mesh, operation: string) => {
    delFlagRef.current = false;
    saveFlagRef.current = false;
    if (allOpsRef.current.length >= 5) allOpsRef.current.shift();
    const mat = mesh.material as THREE.MeshLambertMaterial;
    allOpsRef.current.push({
      uuid: mesh.uuid, position: mesh.position.clone(),
      rotation: mesh.rotation.clone(), quaternion: mesh.quaternion.clone(),
      scale: mesh.scale.clone(), color: mat.color.clone(), operation, mesh,
    });
  };

  const pushHist = (e: any, type: number) => {
    const now = Date.now();
    if (type === 0) {
      const mesh = e as THREE.Mesh;
      if (!objHistRef.current[mesh.uuid]) objHistRef.current[mesh.uuid] = [];
      const mat = mesh.material as THREE.MeshLambertMaterial;
      objHistRef.current[mesh.uuid].push({
        uuid: mesh.uuid, position: mesh.position.clone(), rotation: mesh.rotation.clone(),
        quaternion: mesh.quaternion.clone(), scale: mesh.scale.clone(),
        color: mat.color.clone(), mesh, time: now,
        index: objHistRef.current[mesh.uuid].length,
      });
    } else {
      const histMap = type === 1 ? redoHistRef.current : redoHistRef.current;
      if (!histMap[e.uuid]) histMap[e.uuid] = [];
      histMap[e.uuid].push({ ...e, time: now });
    }
  };

  const applyOp = (op: any) => {
    op.mesh.position.copy(op.position);
    op.mesh.rotation.copy(op.rotation);
    op.mesh.quaternion.copy(op.quaternion);
    op.mesh.scale.copy(op.scale);
    (op.mesh.material as THREE.MeshLambertMaterial).color.copy(op.color);
  };

  // ── After placing / attaching shape ───────────────────────────────────────
  const afterPlace = (mesh: THREE.Mesh) => {
    pushOp(mesh, 'add');
    pushHist(mesh, 0);
    const tc = tcRef.current!;
    tc.attach(mesh);
    focusedObjRef.current = mesh;
    syncBottomBar();
    syncSave();
    setUndoActive(true);
    const objCount = objectsRef.current.filter(o => o.name === 'shapes' || o.name === 'stl').length;
    if (objCount >= 50) showToast('Scene is getting large — consider removing some objects');
    const mat = mesh.material as THREE.MeshLambertMaterial;
    setCurrentColor('#' + mat.color.getHexString());
    setColorControl(true);
    curMatRef.current = new THREE.MeshLambertMaterial({ color: 0xdddddd });
  };

  // ── Canvas click: place or select ─────────────────────────────────────────
  const handleCanvasClick = (evt: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el || !sceneRef.current || !cameraRef.current) return;
    setShowColorOpt(false);
    setShowZoomOpt(false);

    const rect = el.getBoundingClientRect();
    const ndcX = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);

    if (!shootedRef.current) {
      // PLACE MODE
      const hits = raycaster.intersectObjects(objectsRef.current);
      if (hits.length > 0 && curGeomRef.current) {
        const hit = hits[0];
        const mat = curMatRef.current.clone();
        const mesh = new THREE.Mesh(curGeomRef.current, mat);
        mesh.position.copy(hit.point).add(hit.face!.normal);
        if (stlFlagRef.current === 0) {
          mesh.position.divideScalar(SHAPE_SIZE).floor().multiplyScalar(SHAPE_SIZE).addScalar(SHAPE_SIZE / 2);
          mesh.name = 'shapes';
          mesh.userData = { module: 'shape', geoCode: curCodeRef.current };
        } else {
          mesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
          mesh.name = 'stl';
          mesh.userData = { module: 'stl', geoCode: curCodeRef.current };
        }
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        sceneRef.current.add(mesh);
        objectsRef.current.push(mesh);
        afterPlace(mesh);
        shootedRef.current = true;
      }
    } else {
      // SELECT MODE
      if (tcClickedRef.current) { tcClickedRef.current = false; return; }
      const hits = raycaster.intersectObjects(sceneRef.current.children, true);
      for (const hit of hits) {
        const obj = hit.object;
        if (obj.name === 'shapes' || obj.name === 'stl') {
          const tc = tcRef.current!;
          tc.detach();
          tc.attach(obj);
          focusedObjRef.current = obj;
          const mat = (obj as THREE.Mesh).material as THREE.MeshLambertMaterial;
          setCurrentColor('#' + mat.color.getHexString());
          setColorControl(true);
          return;
        }
      }
      // Clicked empty space — deselect
      tcRef.current!.detach();
      focusedObjRef.current = null;
      setColorControl(false);
    }
  };

  const handleCanvasMouseDown = () => {
    ctrlMovedRef.current = false;
    setShowColorOpt(false);
    setShowZoomOpt(false);
  };

  const handleCanvasMouseUp = () => {
    const tc = tcRef.current;
    if (tc?.object) focusedObjRef.current = tc.object;
  };

  // ── Sidebar: drag or tap a module ────────────────────────────────────────
  const startSidebarDrag = (item: DragItem, clientX: number, clientY: number) => {
    if (item.module === 'text') { setShowTextModal(true); curGeomRef.current = null; return; }
    curCodeRef.current = item.code;
    if (item.module === 'shape') { curGeomRef.current = makeGeometry(item.code); stlFlagRef.current = 0; }
    else { loadSTL(item.code); }
    shootedRef.current = false;
    dragItemRef.current = item;
    setDragItem(item);
    setDragPos({ x: clientX, y: clientY });
  };

  const handleSidebarMouseDown = (e: React.MouseEvent, item: DragItem) => {
    e.preventDefault();
    startSidebarDrag(item, e.clientX, e.clientY);
  };

  const handleSidebarTouchStart = (e: React.TouchEvent, item: DragItem) => {
    e.preventDefault(); // prevent scroll while dragging
    const t = e.touches[0];
    startSidebarDrag(item, t.clientX, t.clientY);
  };

  const loadSTL = (code: number) => {
    const file = STL_FILES[code] ?? STL_FILES[4];
    curCodeRef.current = code;
    setStlLoading(true);
    const loader = new STLLoader();
    loader.load(
      file,
      (geo) => {
        curGeomRef.current = geo;
        stlFlagRef.current = 1;
        shootedRef.current = false;
        setStlLoading(false);
      },
      undefined,
      () => { setStlLoading(false); showToast('Failed to load model'); },
    );
  };

  // ── 3D text ───────────────────────────────────────────────────────────────
  const handleInsertText = () => {
    if (!textInput || !fontRef.current) return;
    const word = textInput;
    const fs = word.length <= 2 ? 60 : word.length === 3 ? 50 : word.length === 4 ? 45
      : word.length === 5 ? 40 : word.length === 6 ? 35 : word.length === 7 ? 30 : 20;
    const geo = new TextGeometry(word, { font: fontRef.current, size: fs, depth: 10, curveSegments: 22, bevelEnabled: false });
    geo.computeBoundingBox();
    geo.computeVertexNormals();
    const xMid = -0.5 * (geo.boundingBox!.max.x - geo.boundingBox!.min.x);
    geo.translate(xMid, -25, 0);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'shapes';
    mesh.userData = { module: 'text', geoCode: 222, text: word };
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    sceneRef.current!.add(mesh);
    objectsRef.current.push(mesh);
    afterPlace(mesh);
    shootedRef.current = true;
    setTextInput('');
    setShowTextModal(false);
  };

  // ── Bottom bar controls ───────────────────────────────────────────────────
  const handleChangeMode = (mode: ControlMode) => {
    if (delFlagRef.current) return;
    setShowColorOpt(false);
    setShowZoomOpt(false);
    const tc = tcRef.current!;
    tc.setMode(mode);
    tcModeRef.current = mode;
    setControlMode(mode);
    const labels: Record<ControlMode, string> = { scale: 'Status: Scale', translate: 'Status: Move', rotate: 'Status: Rotate' };
    setStatusTxt(labels[mode]);
    setColorControl(!!tc.object);
  };

  const handleUndo = () => {
    setShowColorOpt(false);
    setShowZoomOpt(false);
    if (allOpsRef.current.length === 0) return;
    const op = allOpsRef.current[allOpsRef.current.length - 1];
    redoOpsRef.current.push(op);
    if (op.operation === 'add') {
      pushHist(op, 1);
      sceneRef.current!.remove(op.mesh);
      objectsRef.current.splice(objectsRef.current.indexOf(op.mesh), 1);
    } else if (op.operation === 'delete') {
      pushHist(op, 1);
      sceneRef.current!.add(op.mesh);
      objectsRef.current.push(op.mesh);
    } else {
      const hist = objHistRef.current[op.uuid];
      if (hist?.length > 1) applyOp(hist[hist.length - 2]);
      else if (hist?.length === 1) applyOp(hist[0]);
      const popped = objHistRef.current[op.uuid]?.pop();
      if (popped) pushHist(popped, 1);
    }
    allOpsRef.current.pop();
    tcRef.current!.detach();
    focusedObjRef.current = null;
    setColorControl(false);
    syncUndo(); syncRedo(); syncSave();
    syncBottomBar();
  };

  const handleRedo = () => {
    setShowColorOpt(false);
    setShowZoomOpt(false);
    if (redoOpsRef.current.length === 0) return;
    const op = redoOpsRef.current[redoOpsRef.current.length - 1];
    allOpsRef.current.push(op);
    if (op.operation === 'add') {
      pushHist(op, 2);
      sceneRef.current!.add(op.mesh);
      objectsRef.current.push(op.mesh);
    } else if (op.operation === 'delete') {
      pushHist(op, 2);
      sceneRef.current!.remove(op.mesh);
      objectsRef.current.splice(objectsRef.current.indexOf(op.mesh), 1);
    } else {
      const hist = redoHistRef.current[op.uuid];
      if (hist?.length > 1) applyOp(hist[hist.length - 2]);
      else if (hist?.length === 1) applyOp(hist[0]);
      const popped = redoHistRef.current[op.uuid]?.pop();
      if (popped) pushHist(popped, 2);
    }
    redoOpsRef.current.pop();
    tcRef.current!.detach();
    focusedObjRef.current = null;
    setColorControl(false);
    syncUndo(); syncRedo(); syncSave();
    syncBottomBar();
  };

  const handleDelete = () => {
    setShowColorOpt(false);
    setShowZoomOpt(false);
    const tc = tcRef.current!;
    if (focusedObjRef.current && tc.object) {
      pushOp(tc.object as THREE.Mesh, 'delete');
      pushHist(tc.object as THREE.Mesh, 0);
      sceneRef.current!.remove(tc.object);
      objectsRef.current.splice(objectsRef.current.indexOf(tc.object), 1);
      setColorControl(false);
      delFlagRef.current = true;
      focusedObjRef.current = null;
      setUndoActive(true);
    }
    tc.detach();
    syncSave();
    syncBottomBar();
  };

  const handleDuplicate = () => {
    const tc = tcRef.current!;
    if (!tc.object || !sceneRef.current) return;
    const src = tc.object as THREE.Mesh;
    const clonedGeo  = src.geometry.clone();
    const clonedMat  = (src.material as THREE.MeshLambertMaterial).clone();
    const mesh = new THREE.Mesh(clonedGeo, clonedMat);
    mesh.position.copy(src.position).add(new THREE.Vector3(SHAPE_SIZE, 0, 0));
    mesh.rotation.copy(src.rotation);
    mesh.scale.copy(src.scale);
    mesh.name = src.name;
    mesh.userData = { ...src.userData };
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    sceneRef.current.add(mesh);
    objectsRef.current.push(mesh);
    allOpsRef.current.push({
      uuid: mesh.uuid, position: mesh.position.clone(), rotation: mesh.rotation.clone(),
      quaternion: mesh.quaternion.clone(), scale: mesh.scale.clone(),
      color: clonedMat.color.clone(), operation: 'add', mesh,
    });
    if (!objHistRef.current[mesh.uuid]) objHistRef.current[mesh.uuid] = [];
    objHistRef.current[mesh.uuid].push({
      uuid: mesh.uuid, position: mesh.position.clone(), rotation: mesh.rotation.clone(),
      quaternion: mesh.quaternion.clone(), scale: mesh.scale.clone(),
      color: clonedMat.color.clone(), mesh, time: Date.now(), index: 0,
    });
    tc.detach();
    tc.attach(mesh);
    focusedObjRef.current = mesh;
    setActiveSave(true);
    setUndoActive(true);
    showToast('Duplicated!');
  };

  const handleChangeColor = (hex: string) => {
    const tc = tcRef.current;
    if (!tc?.object) return;
    const mat = (tc.object as THREE.Mesh).material as THREE.MeshLambertMaterial;
    mat.color.set(hex);
    setCurrentColor(hex);
    pushOp(tc.object as THREE.Mesh, 'transform');
    pushHist(tc.object as THREE.Mesh, 0);
  };

  // ── Export STL ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (objectsRef.current.length <= 1 || !saveNameRef.current?.value) return;
    const scene = sceneRef.current!;
    const tc = tcRef.current!;
    const grid = gridRef.current!;
    const g0 = ground0Ref.current!;
    const g1 = ground1Ref.current!;
    const pl = planeRef.current!;

    const tcHelper = tc.getHelper();
    scene.remove(tcHelper); scene.remove(grid); scene.remove(g0); scene.remove(g1); scene.remove(pl);
    scene.rotation.set(Math.PI / 2, 0, 0);
    scene.updateMatrixWorld();

    const result = new STLExporter().parse(scene);
    const name = saveNameRef.current!.value + '.stl';
    const blob = new Blob([result], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);

    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld();
    scene.add(tcHelper); scene.add(grid); scene.add(g0); scene.add(g1); scene.add(pl);

    // Clear all placed objects
    objectsRef.current.forEach(obj => {
      if (obj !== pl) {
        scene.remove(obj);
        const m = obj as THREE.Mesh;
        m.geometry.dispose();
        (m.material as THREE.MeshLambertMaterial).dispose();
      }
    });
    objectsRef.current = [pl];
    tc.detach();
    focusedObjRef.current = null;
    saveFlagRef.current = true;
    setShowSaveModal(false);
    setActiveSave(false);
    setShowBottomBar(false);
    if (goHomeRef.current) { goHomeRef.current = false; router.push(`/${locale}/projects`); }
  };

  // ── Screenshot ────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 3000); return; }
    setResetConfirm(false);
    const scene = sceneRef.current;
    if (!scene) return;
    const keep = new Set([planeRef.current, gridRef.current, ground0Ref.current, ground1Ref.current]);
    objectsRef.current.filter(o => !keep.has(o as any)).forEach(o => scene.remove(o));
    objectsRef.current = objectsRef.current.filter(o => keep.has(o as any));
    allOpsRef.current = []; redoOpsRef.current = [];
    objHistRef.current = {}; redoHistRef.current = {};
    tcRef.current?.detach();
    focusedObjRef.current = null;
    try { localStorage.removeItem('mb_scene'); } catch {}
    setShowBottomBar(false); setActiveSave(false);
    setUndoActive(false); setRedoActive(false);
    setColorControl(false); shootedRef.current = true;
    showToast('Scene cleared');
  };

  const handleCameraReset = () => {
    const camera = cameraRef.current;
    const orbit  = orbitRef.current;
    if (!camera || !orbit) return;
    camera.position.set(170, 145, 255);
    camera.lookAt(0, 0, 0);
    orbit.target.set(0, 0, 0);
    orbit.update();
  };

  const handleScreenshot = () => {
    const renderer = rendererRef.current;
    const scene    = sceneRef.current;
    const camera   = cameraRef.current;
    const tc       = tcRef.current;
    if (!renderer || !scene || !camera) return;

    // Hide gizmo for a clean shot
    const helper = tc?.getHelper();
    if (helper) helper.visible = false;
    renderer.render(scene, camera);

    const url = renderer.domElement.toDataURL('image/png');
    if (helper) helper.visible = true;

    const a = document.createElement('a');
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    a.download = `magicbox_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.png`;
    a.href = url;
    a.click();
    showToast('Screenshot saved!');
  };

  // ── Leave / back button ───────────────────────────────────────────────────
  const handleLeave = () => {
    if (objectsRef.current.length > 1 && !saveFlagRef.current) {
      setShowAskModal(true);
    } else {
      router.push(`/${locale}/projects`);
    }
  };

  const handleGoHomeNoSave  = () => { setShowAskModal(false); router.push(`/${locale}/projects`); };
  const handleGoHomeSave    = () => { setShowAskModal(false); goHomeRef.current = true; setShowSaveModal(true); };

  // ── Toggle sidebar (trigger renderer resize after DOM updates) ────────────
  const toggleSidebar = () => {
    setShowSidebar(v => {
      setTimeout(() => {
        const el = containerRef.current;
        const cam = cameraRef.current;
        const rnd = rendererRef.current;
        if (el && cam && rnd) {
          const w = el.clientWidth, h = el.clientHeight;
          cam.aspect = w / h;
          cam.updateProjectionMatrix();
          rnd.setSize(w, h);
        }
      }, 0);
      return !v;
    });
  };

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const handleZoom = (pct: number) => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.zoom = pct / 100;
    cam.lookAt(sceneRef.current!.position);
    cam.updateProjectionMatrix();
    setShowZoomOpt(false);
  };

  // ── Default save name ─────────────────────────────────────────────────────
  const defaultSaveName = (() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  const sidebarWidth = showSidebar ? SIDEBAR_W : 0;

  return (
    <div style={styles.root}>

      {/* ── Toast ── */}
      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}

      {/* ── Portrait overlay ── */}
      {isPortrait && (
        <div style={styles.portraitOverlay}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📱➡️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Please rotate your device</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Magic Box works best in landscape mode</div>
        </div>
      )}

      {/* ── Onboarding modal ── */}
      {showGuide && !showLoading && (
        <div style={styles.guideBg} onClick={() => { localStorage.setItem('mb_guide_seen', '1'); setShowGuide(false); }}>
          <div style={styles.guideCard}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧱</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Welcome to Magic Box!</div>
            <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.9 }}>
              👉 Pick a shape from the <strong>right panel</strong><br />
              🖱️ <strong>Drag</strong> or <strong>tap</strong> it into the workspace<br />
              ✨ Select any object to move, scale or rotate
            </div>
            <div style={{ marginTop: 18, fontSize: 11, opacity: 0.55 }}>Tap anywhere to close</div>
          </div>
        </div>
      )}

      {/* ── THREE.js canvas ── */}
      <div
        ref={containerRef}
        style={{ ...styles.canvas, right: sidebarWidth }}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
      />

      {/* ── Sidebar toggle arrow ── */}
      <button
        style={{ ...styles.arrow, right: sidebarWidth }}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image/3dBuilder/arrow.png"
          alt=""
          style={{ width: 12, height: 24, transform: showSidebar ? 'rotate(0deg)' : 'rotate(180deg)' }}
        />
      </button>

      {/* ── Right sidebar ── */}
      {showSidebar && (
        <div style={styles.sidebar}>
          {/* Basic Models section */}
          <button style={styles.collapseHeader} onClick={() => setShapesOpen(v => !v)}>
            <span>Basic</span>
            <span>{shapesOpen ? '▾' : '▸'}</span>
          </button>
          {shapesOpen && SHAPES_LIST.map((item) => (
            <button
              key={item.title}
              style={styles.moduleItem}
              onMouseDown={(e) => handleSidebarMouseDown(e, item)}
              onTouchStart={(e) => handleSidebarTouchStart(e, item)}
            >
              <div style={styles.moduleImgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/image/3dBuilder/3dPrinting/sprint_${item.title}.png`}
                  alt={item.name}
                  style={styles.moduleImg}
                  draggable={false}
                />
              </div>
              <div style={styles.moduleName}>{item.name}</div>
            </button>
          ))}
          {/* Cartoon Models section */}
          <button style={styles.collapseHeader} onClick={() => setCartoonOpen(v => !v)}>
            <span>Cartoon</span>
            <span>{cartoonOpen ? '▾' : '▸'}</span>
          </button>
          {cartoonOpen && CARTOON_LIST.map((item) => (
            <button
              key={item.title}
              style={styles.moduleItem}
              onMouseDown={(e) => handleSidebarMouseDown(e, { module: 'stl', code: item.code, title: item.title })}
              onTouchStart={(e) => handleSidebarTouchStart(e, { module: 'stl', code: item.code, title: item.title })}
            >
              <div style={styles.moduleImgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/image/3dBuilder/3dPrinting/sprint_${item.title}.png`}
                  alt={item.name}
                  style={styles.moduleImg}
                  draggable={false}
                />
              </div>
              <div style={styles.moduleName}>{item.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* ── Top-left buttons ── */}
      <div style={styles.topBtns}>
        <button style={styles.topBtn} onClick={handleLeave}>
          <svg style={styles.topBtnSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span style={styles.topBtnLabel}>Back</span>
        </button>
        <button
          style={{ ...styles.topBtn, opacity: activeSave ? 1 : 0.35, pointerEvents: activeSave ? 'auto' : 'none' }}
          onClick={() => activeSave && setShowSaveModal(true)}
        >
          <svg style={styles.topBtnSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span style={styles.topBtnLabel}>Save</span>
        </button>
        <button
          style={{ ...styles.topBtn, opacity: activeSave ? 1 : 0.35, pointerEvents: activeSave ? 'auto' : 'none' }}
          onClick={handleScreenshot}
        >
          <svg style={styles.topBtnSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span style={styles.topBtnLabel}>Photo</span>
        </button>
      </div>

      {/* ── Status hint ── */}
      {colorControl && (
        <div style={styles.status}>{statusTxt}</div>
      )}

      {/* ── Bottom toolbar ── */}
      {showBottomBar && (
        <div style={{ ...styles.bottomBar, right: sidebarWidth }}>
          <div style={styles.toolbar}>
            <ToolBtn active={undoActive} onClick={handleUndo}   icon="↺" label="Undo" />
            <ToolBtn active={redoActive} onClick={handleRedo}   icon="↻" label="Redo" />
            <ToolBtn active={true} onClick={handleCameraReset} icon="⌂" label="View" />
            <ToolBtn active={true} onClick={() => handleChangeMode('scale')}
              icon="⊞" label="Scale" highlight={controlMode === 'scale'} />
            <ToolBtn active={true} onClick={() => handleChangeMode('translate')}
              icon="✥" label="Move"  highlight={controlMode === 'translate'} />
            <ToolBtn active={true} onClick={() => handleChangeMode('rotate')}
              icon="⟳" label="Rotate" highlight={controlMode === 'rotate'} />
            {/* Zoom */}
            <div style={{ position: 'relative' }}>
              <ToolBtn active={true} onClick={() => setShowZoomOpt(v => !v)} icon="🔍" label="Zoom" />
              {showZoomOpt && (
                <div style={styles.popup}>
                  {[50, 100, 150, 200].map(z => (
                    <button key={z} style={styles.popupItem} onClick={() => handleZoom(z)}>{z}%</button>
                  ))}
                </div>
              )}
            </div>
            <ToolBtn active={!!focusedObjRef.current || colorControl} onClick={handleDuplicate} icon="⧉" label="Copy" />
            <ToolBtn active={true} onClick={handleDelete} icon="✕" label="Delete" />
            <ToolBtn
              active={activeSave}
              onClick={handleReset}
              icon="🗑"
              label={resetConfirm ? 'Sure?' : 'Clear'}
              danger={resetConfirm}
            />
            {/* Color */}
            {colorControl && (
              <div style={{ position: 'relative' }}>
                <button style={styles.toolBtn} onClick={() => setShowColorOpt(v => !v)}>
                  <span style={{
                    ...styles.colorCircle,
                    background: currentColor,
                    border: '1px solid rgba(0,0,0,.18)',
                  }} />
                  <div style={styles.toolLabel}>Color</div>
                </button>
                {showColorOpt && (
                  <div style={styles.colorPopup}>
                    {COLOR_PALETTE.map(hex => (
                      <button
                        key={hex}
                        style={{
                          ...styles.colorSwatch,
                          background: hex,
                          outline: currentColor === hex ? '2px solid #2B9CFF' : '1px solid rgba(0,0,0,.15)',
                          outlineOffset: currentColor === hex ? 1 : 0,
                        }}
                        onClick={() => handleChangeColor(hex)}
                      />
                    ))}
                    <label style={styles.colorSwatch} title="Custom">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={e => handleChangeColor(e.target.value)}
                        style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
                      />
                      🎨
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Text input modal ── */}
      {showTextModal && (
        <>
          <div style={styles.modalBg} onClick={() => setShowTextModal(false)} />
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Generate Text</div>
            <input
              style={styles.modalInput}
              type="text"
              placeholder="Enter text (max 10 chars)"
              maxLength={10}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              autoFocus
            />
            <div style={styles.modalBtns}>
              <button
                style={{ ...styles.modalBtn, opacity: textInput ? 1 : 0.4, pointerEvents: textInput ? 'auto' : 'none' }}
                onClick={handleInsertText}
              >
                Confirm
              </button>
              <button style={styles.modalBtn} onClick={() => { setShowTextModal(false); setTextInput(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Save modal ── */}
      {showSaveModal && (
        <>
          <div style={styles.modalBg} onClick={() => setShowSaveModal(false)} />
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Save Model</div>
            <div style={styles.modalHint}>Enter a name for the STL file:</div>
            <input
              ref={saveNameRef}
              style={styles.modalInput}
              type="text"
              defaultValue={defaultSaveName}
              maxLength={14}
            />
            <div style={styles.modalBtns}>
              <button style={styles.modalBtn} onClick={handleExport}>Export STL</button>
              <button style={styles.modalBtn} onClick={() => setShowSaveModal(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* ── Unsaved ask modal ── */}
      {showAskModal && (
        <>
          <div style={styles.modalBg} />
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Note</div>
            <div style={styles.modalHint}>You have unsaved work. Save before leaving?</div>
            <div style={styles.modalBtns}>
              <button style={styles.modalBtn} onClick={handleGoHomeSave}>Save & Leave</button>
              <button style={styles.modalBtn} onClick={handleGoHomeNoSave}>Leave</button>
              <button style={styles.modalBtn} onClick={() => setShowAskModal(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* ── Loading overlay ── */}
      {showLoading && (
        <div style={styles.loading}>
          <div className="animate-spin" style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(0,212,255,0.15)', borderTopColor: '#00d4ff', marginBottom: 16 }} />
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${loadingPct}%` }} />
          </div>
        </div>
      )}

      {/* ── Drag ghost ── */}
      {dragItem && (
        <div style={{
          position: 'fixed',
          left: dragPos.x - 28, top: dragPos.y - 28,
          width: 56, height: 56, overflow: 'hidden',
          pointerEvents: 'none', zIndex: 200,
          opacity: 0.85, borderRadius: 6,
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.45))',
          userSelect: 'none',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/image/3dBuilder/3dPrinting/sprint_${dragItem.title}.png`}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' }}
          />
          {stlLoading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={styles.spinner} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Small toolbar button component ──────────────────────────────────────────
function ToolBtn({ active, onClick, icon, label, highlight, danger }: {
  active: boolean; onClick: () => void; icon: string; label: string; highlight?: boolean; danger?: boolean;
}) {
  const iconColor  = danger ? '#ff6b6b' : highlight ? '#2B9CFF' : '#79c2de';
  const labelColor = danger ? '#ff9090' : highlight ? '#FFB93F' : '#79c2de';
  const bg         = danger ? 'rgba(255,80,80,0.18)' : highlight ? 'rgba(121,194,222,0.25)' : 'transparent';
  return (
    <button
      style={{
        ...styles.toolBtn,
        opacity: active ? 1 : 0.35,
        pointerEvents: active ? 'auto' : 'none',
        background: bg, borderRadius: 8,
      }}
      onClick={onClick}
    >
      <span style={{ ...styles.toolIcon, color: iconColor }}>{icon}</span>
      <div style={{ ...styles.toolLabel, color: labelColor }}>{label}</div>
    </button>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  guideBg: {
    position: 'absolute', inset: 0, zIndex: 50,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  guideCard: {
    background: '#fff',
    borderRadius: 18, padding: '32px 40px',
    color: '#2a4a7f', textAlign: 'center' as const,
    boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
    pointerEvents: 'none' as const,
    maxWidth: 320,
  },
  toast: {
    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,.72)', color: '#fff', borderRadius: 20,
    padding: '8px 18px', fontSize: 13, zIndex: 300, whiteSpace: 'nowrap' as const,
    pointerEvents: 'none' as const,
  },
  spinner: {
    width: 22, height: 22, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,.3)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
  },
  portraitOverlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'linear-gradient(to bottom, #4E92EF, #2a6fd4)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    color: '#fff', textAlign: 'center', padding: 32,
  },
  root: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'linear-gradient(to bottom, #79B1EA 0%, #4E92EF 100%)',
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute', inset: 0, cursor: 'crosshair', touchAction: 'none',
  },
  arrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    zIndex: 10, background: '#F0F7FF', border: 'none', cursor: 'pointer',
    borderRadius: '4px 0 0 4px', width: 20, height: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },
  sidebar: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: SIDEBAR_W,
    background: '#F0F7FF', overflowY: 'auto', zIndex: 6, color: '#323232',
  },
  sidebarHint: {
    padding: '7px 10px', fontSize: 10, color: '#7aaacc',
    textAlign: 'center' as const, letterSpacing: '0.03em',
    borderBottom: '1px solid #c8daf0', userSelect: 'none' as const,
  },
  collapseHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', padding: '8px 10px',
    background: '#ddeeff', border: 'none', borderBottom: '1px solid #c8daf0',
    cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#426A8D',
    position: 'sticky', top: 0, zIndex: 2,
  },
  moduleItem: {
    display: 'block', width: '100%', background: 'none', border: 'none',
    cursor: 'grab', padding: '6px 4px', textAlign: 'center',
    borderBottom: '1px solid #eef',
  },
  moduleImgWrap: {
    width: 56, height: 56, overflow: 'hidden',
    margin: '0 auto 2px', borderRadius: 4,
  },
  moduleImg: {
    width: '100%', height: '100%',
    objectFit: 'cover', objectPosition: 'right center',
    display: 'block',
  },
  moduleName: { fontSize: 10, color: '#323232', textAlign: 'center', lineHeight: 1.2 },
  topBtns: { position: 'absolute', top: 10, left: 10, zIndex: 8, display: 'flex', gap: 10 },
  topBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#fff', gap: 2,
  },
  topBtnIcon: { fontSize: 28, lineHeight: 1 },
  topBtnSvg: { width: 26, height: 26, display: 'block', color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.35))' },
  topBtnLabel: { fontSize: 10, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.4)' },
  status: {
    position: 'absolute', top: 90, left: 10, zIndex: 8,
    background: '#7BB3FF', borderRadius: 5, fontSize: 13, color: '#ffffff',
    padding: '6px 10px',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, zIndex: 8,
    display: 'flex', justifyContent: 'center',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 2,
    background: '#fff', borderRadius: '16px 16px 0 0',
    padding: '6px 12px', boxShadow: '0 -2px 8px rgba(0,0,0,.1)',
  },
  toolBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: 'transparent', border: 'none', cursor: 'pointer',
    minWidth: 40, padding: '4px 8px',
  },
  toolIcon: { fontSize: 20, lineHeight: '26px', width: 26, textAlign: 'center' },
  toolLabel: { fontSize: 10, lineHeight: 1.4 },
  colorCircle: { display: 'inline-block', width: 22, height: 22, borderRadius: '50%' },
  colorPopup: {
    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
    background: '#fff', borderRadius: 8, boxShadow: '0 0 12px rgba(0,0,0,.18)',
    padding: 8, zIndex: 20,
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5,
    width: 128,
  },
  colorSwatch: {
    width: 22, height: 22, borderRadius: '50%',
    cursor: 'pointer', padding: 0, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, position: 'relative',
  },
  popup: {
    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
    background: '#fff', borderRadius: 6, boxShadow: '0 0 12px rgba(0,0,0,.15)',
    padding: '4px 0', minWidth: 80, zIndex: 20,
  },
  popupItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: '#323232', padding: '5px 12px',
  },
  modalBg: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 12,
  },
  modal: {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    zIndex: 13, background: 'rgba(185,239,255,1)', borderRadius: 28,
    width: 300, padding: '24px 24px 20px',
    boxShadow: '0 0 11px rgba(34,87,145,.2), 0 0 60px rgba(56,154,240,.6) inset',
    textAlign: 'center',
  },
  modalTitle: {
    background: 'linear-gradient(0deg, #55b6e3, #3681e3)',
    borderRadius: '0 0 12px 12px', margin: '-24px -24px 12px',
    padding: '10px 0', fontSize: 16, color: '#fff', fontWeight: 700,
  },
  modalHint: { fontSize: 13, color: '#426A8D', marginBottom: 8, textAlign: 'left', lineHeight: 1.5 },
  modalInput: {
    width: '90%', height: 36, fontSize: 12, borderRadius: 8, border: 'none',
    background: '#fff', padding: '0 10px', outline: 'none', color: '#323232',
    boxShadow: '3px 2px 2px rgba(85,182,227,.64) inset',
  },
  modalBtns: { display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14 },
  modalBtn: {
    background: '#79B1EA', border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 13, padding: '6px 18px', cursor: 'pointer',
  },
  loading: {
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(79,147,240,.7)',
  },
  progressTrack: {
    width: 200, height: 8, background: 'rgba(255,255,255,.4)',
    borderRadius: 4, marginTop: 12, overflow: 'hidden',
  },
  progressBar: { height: '100%', background: '#fff', borderRadius: 4, transition: 'width .1s' },
};
