/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_DECALS      = 54;
const DECAL_BASE        = '/image/decals/';
const SIDEBAR_OPEN_W    = 355;
const SIDEBAR_CLOSED_W  = 127;

// ─── Component ────────────────────────────────────────────────────────────────
export default function DecalSplatterClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('decalSplatter');

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Stable refs for Three.js closure to read latest React state ---
  const currentDecalRef = useRef(`${DECAL_BASE}1.png`);
  const decalSizeRef    = useRef(30);
  const rotationRef     = useRef(0);

  // --- Operation refs (set inside the Three.js effect) ---
  const undoRef          = useRef<() => void>(() => {});
  const redoRef          = useRef<() => void>(() => {});
  const clearAllRef      = useRef<() => void>(() => {});
  const exportSTLRef     = useRef<() => void>(() => {});
  const deleteDecalRef   = useRef<() => void>(() => {});
  const resetShotRef     = useRef<() => void>(() => {});
  const hideMenuRef      = useRef<() => void>(() => {});
  const onSizeChangeRef  = useRef<(v: number) => void>(() => {});
  const onRotChangeRef       = useRef<(v: number) => void>(() => {});
  const onMenuSizeRef        = useRef<(v: number) => void>(() => {});
  const onMenuRotRef         = useRef<(v: number) => void>(() => {});
  const updateHelperDecalRef = useRef<(src: string) => void>(() => {});

  // --- React UI state ---
  const [activeTab, setActiveTab]       = useState<'map' | 'recently'>('map');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [currentDecal, setCurrentDecal] = useState(`${DECAL_BASE}1.png`);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [uploaded, setUploaded]         = useState<string[]>([]);
  const [decalSize, setDecalSize]       = useState(30);
  const [rotation, setRotation]         = useState(0);
  const [canUndo, setCanUndo]           = useState(false);
  const [canRedo, setCanRedo]           = useState(false);
  const [showLoading, setShowLoading]   = useState(true);
  const [placementMode, setPlacementMode] = useState(true);
  const [ctxMenu, setCtxMenu]           = useState<{
    visible: boolean; x: number; y: number; size: number; rot: number;
  }>({ visible: false, x: 0, y: 0, size: 30, rot: 0 });

  // Keep value refs in sync with state
  useEffect(() => { currentDecalRef.current = currentDecal; }, [currentDecal]);
  useEffect(() => { decalSizeRef.current = decalSize; },      [decalSize]);
  useEffect(() => { rotationRef.current = rotation; },        [rotation]);

  const allDecals = [
    ...Array.from({ length: TOTAL_DECALS }, (_, i) => `${DECAL_BASE}${i + 1}.png`),
    ...uploaded,
  ];

  // ── Three.js core effect ───────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── Local closure state (not React refs — just closure vars) ──
    let mesh: THREE.Mesh | null      = null;
    let mouseHelper: THREE.Mesh | null = null;

    const textureLoader   = new THREE.TextureLoader();
    const mouse           = new THREE.Vector2();
    const raycaster       = new THREE.Raycaster();
    const intersection    = { intersects: false, point: new THREE.Vector3(), normal: new THREE.Vector3() };
    const intersectsArr: THREE.Intersection[] = [];
    const position        = new THREE.Vector3();
    const orientation     = new THREE.Euler();
    const cursorPos       = new THREE.Vector3();

    let decals: THREE.Mesh[] = [];
    let removedDecals: THREE.Mesh[] = [];
    const decalsPR: Record<string, { position: THREE.Vector3; orientation: THREE.Euler; baseZ: number; size: number; uuid: string }> = {};
    // baseZ: the Euler-z from _tempObj.lookAt(), before user rotation is added.
    // Stored separately so onMenuRotRef can replace only the user-rotation part.
    let lookAtOrientationZ = 0;

    let shotFlag          = false;
    let moved             = false;
    let clickedLeft       = false;
    let controlRotate     = true;
    let menuShowFlag      = false;
    let focusedDecals: THREE.Mesh[] = [];
    let focusedFlag       = false;
    let focusedUUID       = '';
    let mouseX            = 0;
    let mouseY            = 0;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);
    scene.fog = new THREE.Fog(0xcce0ff, 50, 1000);

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 1, 1000);
    camera.position.z = 120;
    camera.add(new THREE.PointLight(0xffffff, 1.0));
    scene.add(camera);

    // ── OrbitControls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 50;
    controls.maxDistance = 200;
    controls.addEventListener('change', () => { moved = true; });

    // ── Ground ──
    const gt = textureLoader.load('/image/decals/grasslight-big.jpg');
    gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
    gt.repeat.set(25, 25);
    gt.anisotropy = 1;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(6000, 6000),
      new THREE.MeshLambertMaterial({ map: gt })
    );
    ground.position.y = -50;
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(1, 2, 2);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x8899bb, 0.8);
    fillLight.position.set(-2, -1, -1);
    scene.add(fillLight);

    // ── Line helper ──
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xFF0000 }));
    line.visible = false;
    scene.add(line);

    // Decal size — depth kept large so ridges/grooves are fully covered.
    // Wrapping at corners is handled by angle-filtering in makeDecalGeo().
    const decalSz = (s: number) => new THREE.Vector3(s, s, 20);

    // Pre-allocated vectors — reused across every makeDecalGeo call to avoid GC churn.
    const _dg_va   = new THREE.Vector3();
    const _dg_vb   = new THREE.Vector3();
    const _dg_p    = new THREE.Vector3();
    const _dg_n    = new THREE.Vector3();
    const _dg_diff = new THREE.Vector3();

    // True-sticker geometry builder — three passes:
    //  1. Face-normal angle filter  — drop triangles whose averaged normal > ~78° from projection
    //  2. Per-vertex UV correction  — each vertex projected along its OWN surface normal onto the
    //     sticker plane (key difference from spray: follows surface curvature, no stretching)
    //  3. Per-vertex UV range filter — drop any triangle whose vertex either has a near-perpendicular
    //     normal (denom < 0.05) or whose corrected UV lands outside the sticker bounds.
    //     This catches corner triangles with mixed normals that slip through the face-normal filter.
    function makeDecalGeo(
      target: THREE.Mesh,
      pos: THREE.Vector3,
      ori: THREE.Euler,
      sz: THREE.Vector3,
    ): THREE.BufferGeometry {
      const geo = new DecalGeometry(target, pos, ori, sz);

      const projNorm = new THREE.Vector3(0, 0, 1).applyEuler(ori).normalize();
      const right    = new THREE.Vector3(1, 0, 0).applyEuler(ori).normalize();
      const up       = new THREE.Vector3(0, 1, 0).applyEuler(ori).normalize();
      const size = sz.x;

      const normals   = geo.getAttribute('normal')   as THREE.BufferAttribute;
      const positions = geo.getAttribute('position') as THREE.BufferAttribute;
      const uvs       = geo.getAttribute('uv')       as THREE.BufferAttribute;
      const idxAttr   = geo.index;
      if (!idxAttr || !normals || !positions) return geo;

      const vCount = positions.count;
      const rawU   = new Float32Array(vCount);
      const rawV   = new Float32Array(vCount);
      const uvOk   = new Uint8Array(vCount); // 1 = valid corrected UV, 0 = skip

      // Pass 1 — face-normal angle filter
      const p1: number[] = [];
      for (let i = 0; i < idxAttr.count; i += 3) {
        const a = idxAttr.getX(i), b = idxAttr.getX(i + 1), c = idxAttr.getX(i + 2);
        _dg_va.fromBufferAttribute(normals, a);
        _dg_vb.fromBufferAttribute(normals, b);
        _dg_va.add(_dg_vb);
        _dg_vb.fromBufferAttribute(normals, c);
        _dg_va.add(_dg_vb).normalize();
        if (_dg_va.dot(projNorm) > 0.7) p1.push(a, b, c);
      }

      // Pass 2 — compute corrected UV per vertex (unclamped)
      for (let i = 0; i < vCount; i++) {
        _dg_n.fromBufferAttribute(normals, i);
        const denom = _dg_n.dot(projNorm);
        if (Math.abs(denom) < 0.05) continue; // near-perpendicular vertex → uvOk stays 0

        _dg_p.fromBufferAttribute(positions, i);
        const t = _dg_diff.copy(pos).sub(_dg_p).dot(projNorm) / denom;
        _dg_p.addScaledVector(_dg_n, t);   // project vertex to sticker plane along own normal

        _dg_diff.copy(_dg_p).sub(pos);
        rawU[i] = 0.5 + _dg_diff.dot(right) / size;
        rawV[i] = 0.5 + _dg_diff.dot(up)    / size;
        uvOk[i] = 1;
      }

      // Pass 3 — UV range filter: drop triangles with any vertex outside sticker bounds.
      // Catches mixed-normal corner triangles that slip through the face-normal filter.
      const margin = 0.05;
      const finalIdx: number[] = [];
      for (let i = 0; i < p1.length; i += 3) {
        const a = p1[i], b = p1[i + 1], c = p1[i + 2];
        const inBounds = (vi: number) =>
          uvOk[vi] === 1 &&
          rawU[vi] >= -margin && rawU[vi] <= 1 + margin &&
          rawV[vi] >= -margin && rawV[vi] <= 1 + margin;
        if (inBounds(a) && inBounds(b) && inBounds(c)) finalIdx.push(a, b, c);
      }
      geo.setIndex(finalIdx);

      // Pass 4 — write corrected UVs (no clamping).
      // UV values just past [0,1] (up to margin=0.05) are handled by the texture's default
      // ClampToEdgeWrapping — for PNG stickers with transparent padding at the edge,
      // those out-of-range samples are transparent and invisible, eliminating edge streaks.
      for (let i = 0; i < vCount; i++) {
        if (!uvOk[i]) continue;
        uvs.setXY(i, rawU[i], rawV[i]);
      }
      uvs.needsUpdate = true;

      return geo;
    }

    // ── Helper DecalGeometry preview ─────────────────────────────────────────
    // Rebuilt at most once per RAF frame — decals conform to the curved surface.
    let helperDirty = false;
    const helperMat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      opacity: 0.75,
    });
    // Load / swap texture without creating a new material object each time
    function updateHelperTexture(src?: string) {
      const url = src ?? currentDecalRef.current;
      textureLoader.load(url, (tex) => {
        const old = helperMat.map;
        helperMat.map = tex;
        helperMat.needsUpdate = true;
        old?.dispose();
      });
    }
    updateHelperTexture(); // load initial texture

    // ── Render loop ──
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      // Rebuild helper geometry once per frame when cursor is over the mesh
      if (helperDirty && mesh && !shotFlag) {
        helperDirty = false;
        if (mouseHelper) { mouseHelper.geometry.dispose(); scene.remove(mouseHelper); }
        const s = decalSizeRef.current;
        mouseHelper = new THREE.Mesh(
          makeDecalGeo(mesh, cursorPos, orientation, decalSz(s)),
          helperMat
        );
        scene.add(mouseHelper);
      }
      renderer.render(scene, camera);
    };
    animate();

    // ── ResizeObserver ──
    const ro = new ResizeObserver(() => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    // ── Helpers ──────────────────────────────────────────────────────────────

    function buildMaterial(img?: string): THREE.MeshPhongMaterial {
      const src = img ?? currentDecalRef.current;
      const diff = textureLoader.load(src);
      return new THREE.MeshPhongMaterial({
        specular: 0x444444,
        map: diff,
        normalMap: textureLoader.load(src),
        normalScale: new THREE.Vector2(1, 1),
        shininess: 30,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        color: 0xC3C3C3,
      });
    }

    function disposeDecal(m: THREE.Mesh) {
      m.geometry.dispose();
      const mat = m.material as THREE.MeshPhongMaterial;
      mat.map?.dispose();
      mat.normalMap?.dispose();
      mat.dispose();
    }

    function syncUndoRedo() {
      setCanUndo(decals.length > 0);
      setCanRedo(removedDecals.length > 0);
    }

    updateHelperDecalRef.current = (src: string) => {
      updateHelperTexture(src);
      helperDirty = true; // rebuild geometry with new texture on next frame
    };

    function placeDecal(
      type = 0,
      lastRot?: THREE.Euler,
      lastPos?: THREE.Vector3,
      overrideSize?: number
    ) {
      if (!mesh) return;
      const img = currentDecalRef.current;
      setRecentlyUsed(prev => prev.includes(img) ? prev : [...prev, img]);

      if (type === 1 || type === 3 || type === 4 || type === 5) {
        position.copy(lastPos!);
        orientation.copy(lastRot!);
      } else {
        // orientation is already set correctly by the last checkIntersection() call
        position.copy(intersection.point);
      }

      const scale = overrideSize ?? decalSizeRef.current;
      const m = new THREE.Mesh(makeDecalGeo(mesh, position, orientation, decalSz(scale)), buildMaterial());
      m.name = 'decal';
      decals.push(m);
      scene.add(m);
      decalsPR[m.uuid] = {
        position: position.clone(),
        orientation: orientation.clone(),
        baseZ: lookAtOrientationZ,
        size: scale,
        uuid: m.uuid,
      };
      removedDecals = [];
      syncUndoRedo();
    }

    // Reusable temp object for computing orientation from surface normal
    const _tempObj = new THREE.Object3D();
    scene.add(_tempObj);

    function checkIntersection() {
      if (!mesh) return;
      raycaster.setFromCamera(mouse, camera);
      raycaster.intersectObject(mesh, false, intersectsArr);

      if (intersectsArr.length > 0) {
        const p = intersectsArr[0].point;
        cursorPos.copy(p);
        intersection.point.copy(p);

        // Compute orientation from face normal using a temp object's lookAt
        const faceNormal = intersectsArr[0].face!.normal.clone();
        faceNormal.transformDirection(mesh.matrixWorld);
        const lookTarget = faceNormal.clone().multiplyScalar(10).add(p);
        _tempObj.position.copy(p);
        _tempObj.lookAt(lookTarget);
        orientation.copy(_tempObj.rotation);
        lookAtOrientationZ = orientation.z;          // save base before adding user rotation
        orientation.z += rotationRef.current / 60;  // add, not replace

        intersection.normal.copy(intersectsArr[0].face!.normal);

        const lp = line.geometry.attributes.position as THREE.BufferAttribute;
        lp.setXYZ(0, p.x, p.y, p.z);
        lp.setXYZ(1, lookTarget.x, lookTarget.y, lookTarget.z);
        lp.needsUpdate = true;

        if (!shotFlag) {
          // Placement mode: mark dirty — RAF will rebuild DecalGeometry this frame
          helperDirty = true;
        } else {
          // Selection mode: hide the helper
          if (mouseHelper) { scene.remove(mouseHelper); mouseHelper = null; }
          // Selection mode: hit-test existing decals
          const hits = raycaster.intersectObjects(scene.children);
          for (const h of hits) {
            if (h.object.name === 'decal') focusedDecals.push(h.object as THREE.Mesh);
          }
          if (focusedDecals.length > 0) {
            const top = focusedDecals[focusedDecals.length - 1];
            decals.forEach(d => (d.material as THREE.MeshPhongMaterial).color.set('#C3C3C3'));
            focusedUUID = top.uuid;
            focusedFlag = true;
            (top.material as THREE.MeshPhongMaterial).color.set('#f00');
          } else {
            if (!menuShowFlag) {
              setCtxMenu(c => c.visible ? { ...c, visible: false } : c);
              decals.forEach(d => (d.material as THREE.MeshPhongMaterial).color.set('#C3C3C3'));
              focusedFlag = false;
              focusedUUID = '';
            }
          }
          focusedDecals = [];
        }

        intersection.intersects = true;
        intersectsArr.length = 0;
      } else {
        intersection.intersects = false;
        line.visible = false;
        if (!menuShowFlag) {
          setCtxMenu(c => c.visible ? { ...c, visible: false } : c);
          menuShowFlag = false;
          decals.forEach(d => (d.material as THREE.MeshPhongMaterial).color.set('#C3C3C3'));
          focusedDecals = [];
          focusedFlag = false;
          focusedUUID = '';
          controls.enableRotate = true;
          controlRotate = true;
        }
      }
    }

    // ── Expose operations to React ────────────────────────────────────────────

    undoRef.current = () => {
      if (!decals.length) return;
      const last = decals.pop()!;
      scene.remove(last);
      removedDecals.push(last);
      syncUndoRedo();
    };

    redoRef.current = () => {
      if (!removedDecals.length) return;
      const last = removedDecals.pop()!;
      decals.push(last);
      scene.add(last);
      syncUndoRedo();
    };

    clearAllRef.current = () => {
      decals.forEach(d => { disposeDecal(d); scene.remove(d); });
      decals = [];
      removedDecals = [];
      syncUndoRedo();
    };

    exportSTLRef.current = () => {
      if (!mesh) return;
      const result = new STLExporter().parse(mesh);
      const blob = new Blob([result], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `luggage_${Date.now()}.stl`;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    resetShotRef.current = () => {
      shotFlag = false;
      helperDirty = true; // will rebuild on next mousemove + RAF
      setPlacementMode(true);
    };

    hideMenuRef.current = () => {
      menuShowFlag = false;
      setCtxMenu(c => ({ ...c, visible: false }));
    };

    onSizeChangeRef.current = (v: number) => {
      decalSizeRef.current = v;
      // Scale reflected on next mousemove via checkIntersection
    };

    onRotChangeRef.current = (v: number) => {
      rotationRef.current = v;
      // Orientation.z reflected on next mousemove via checkIntersection
    };

    deleteDecalRef.current = () => {
      if (!focusedUUID) return;
      const idx = decals.findIndex(d => d.uuid === focusedUUID);
      if (idx === -1) return;
      const removed = decals.splice(idx, 1)[0];
      removedDecals.push(removed);
      scene.remove(removed);
      delete decalsPR[focusedUUID];
      focusedUUID = '';
      focusedFlag = false;
      menuShowFlag = false;
      setCtxMenu(c => ({ ...c, visible: false }));
      syncUndoRedo();
    };

    onMenuSizeRef.current = (v: number) => {
      if (!focusedUUID || !mesh) return;
      const idx = decals.findIndex(d => d.uuid === focusedUUID);
      if (idx === -1) return;
      const pr = decalsPR[focusedUUID];
      const old = decals.splice(idx, 1)[0];
      const mat = (old.material as THREE.MeshPhongMaterial).clone();
      disposeDecal(old);
      scene.remove(old);
      delete decalsPR[focusedUUID];
      const sz = decalSz(v);
      const m = new THREE.Mesh(makeDecalGeo(mesh, pr.position, pr.orientation, sz), mat);
      m.name = 'decal';
      decals.push(m);
      scene.add(m);
      decalsPR[m.uuid] = { ...pr, size: v, uuid: m.uuid };
      focusedUUID = m.uuid;
      (m.material as THREE.MeshPhongMaterial).color.set('#f00');
    };

    onMenuRotRef.current = (v: number) => {
      if (!focusedUUID || !mesh) return;
      const idx = decals.findIndex(d => d.uuid === focusedUUID);
      if (idx === -1) return;
      const pr = decalsPR[focusedUUID];
      const newOr = pr.orientation.clone();
      newOr.z = pr.baseZ + v / 60;
      const old = decals.splice(idx, 1)[0];
      const mat = (old.material as THREE.MeshPhongMaterial).clone();
      disposeDecal(old);
      scene.remove(old);
      delete decalsPR[focusedUUID];
      const sz = decalSz(pr.size);
      const m = new THREE.Mesh(makeDecalGeo(mesh, pr.position, newOr, sz), mat);
      m.name = 'decal';
      decals.push(m);
      scene.add(m);
      decalsPR[m.uuid] = { ...pr, orientation: newOr.clone(), uuid: m.uuid };
      focusedUUID = m.uuid;
      (m.material as THREE.MeshPhongMaterial).color.set('#f00');
    };

    // ── Mouse / touch events ──────────────────────────────────────────────────

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onMouseDown = (e: MouseEvent) => {
      moved = false;
      if (e.button === 0) {
        if (focusedFlag && shotFlag) { controls.enableRotate = false; controlRotate = false; }
        else { controls.enableRotate = true; controlRotate = true; }
        clickedLeft = true;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        clickedLeft = false;
        if (!focusedFlag) { controls.enableRotate = true; controlRotate = true; }
        if (!menuShowFlag) {
          checkIntersection();
          if (!moved && intersection.intersects && !shotFlag) {
            placeDecal(0);
            shotFlag = true;
            helperDirty = false;
            if (mouseHelper) { scene.remove(mouseHelper); mouseHelper = null; }
            setPlacementMode(false);
          }
        }
      } else if (e.button === 2) {
        if (focusedFlag && focusedUUID) {
          const pr = decalsPR[focusedUUID];
          setCtxMenu({
            visible: true, x: mouseX, y: mouseY,
            size: pr?.size ?? 30,
            rot:  pr ? (pr.orientation.z - pr.baseZ) * 60 : 0,
          });
          menuShowFlag = true;
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      if (!menuShowFlag) checkIntersection();

      // Drag focused decal
      if (!controlRotate && clickedLeft && focusedUUID && mesh && intersection.intersects) {
        const idx = decals.findIndex(d => d.uuid === focusedUUID);
        if (idx !== -1) {
          const pr  = decalsPR[focusedUUID];
          const old = decals.splice(idx, 1)[0];
          const mat = (old.material as THREE.MeshPhongMaterial).clone();
          pr.position.copy(cursorPos); // cursorPos is updated by checkIntersection above
          disposeDecal(old);
          scene.remove(old);
          delete decalsPR[focusedUUID];
          const sz = decalSz(pr.size);
          const m  = new THREE.Mesh(makeDecalGeo(mesh, pr.position, pr.orientation, sz), mat);
          m.name = 'decal';
          decals.push(m);
          scene.add(m);
          decalsPR[m.uuid] = { ...pr, position: pr.position.clone(), uuid: m.uuid };
          focusedUUID = m.uuid;
          (m.material as THREE.MeshPhongMaterial).color.set('#f00');
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const rect = el.getBoundingClientRect();
      mouse.x = ((t.pageX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((t.pageY - rect.top)  / rect.height) * 2 + 1;
      if (!menuShowFlag) checkIntersection();
    };

    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousedown',   onMouseDown);
    window.addEventListener('mouseup',     onMouseUp);
    window.addEventListener('mousemove',   onMouseMove);
    window.addEventListener('touchmove',   onTouchMove, { passive: true });

    // ── Load STL ──────────────────────────────────────────────────────────────
    const stlLoader = new STLLoader();
    stlLoader.load('/models/stl/ascii/luggage.stl', (geo) => {
      geo.computeVertexNormals();
      mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: 0xC8C8C8, specular: 0x333333, shininess: 40 }));
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(1.6, 0, 0);
      mesh.scale.set(0.08, 0.08, 0.08);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      setShowLoading(false);
    });

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mousedown',   onMouseDown);
      window.removeEventListener('mouseup',     onMouseUp);
      window.removeEventListener('mousemove',   onMouseMove);
      window.removeEventListener('touchmove',   onTouchMove);
      ro.disconnect();
      controls.dispose();
      scene.remove(_tempObj);
      if (mouseHelper) { mouseHelper.geometry.dispose(); scene.remove(mouseHelper); }
      helperMat.map?.dispose();
      helperMat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // ── React handlers ─────────────────────────────────────────────────────────

  const handleSelectDecal = (url: string) => {
    currentDecalRef.current = url;
    setCurrentDecal(url);
    resetShotRef.current();
    updateHelperDecalRef.current(url);
    setCtxMenu(c => ({ ...c, visible: false }));
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes('png')) { alert(t('pngOnly')); return; }
    if (file.size > 8 * 1024 * 1024) { alert(t('fileTooLarge')); return; }
    const url = window.URL.createObjectURL(file);
    setUploaded(prev => [...prev, url]);
    handleSelectDecal(url);
    e.target.value = '';
  };

  const displayDecals = activeTab === 'map' ? allDecals : [...recentlyUsed].reverse();
  const sidebarW      = sidebarOpen ? SIDEBAR_OPEN_W : SIDEBAR_CLOSED_W;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>

      {/* ── Left sidebar ── */}
      <div style={{ ...S.sidebar, width: sidebarW }}>

        {/* Upload */}
        <div style={S.uploadWrap}>
          <label style={S.uploadLabel}>
            <input type="file" accept=".png,image/png" style={S.uploadInput} onChange={handleUpload} />
            {sidebarOpen ? t('upload') : t('uploadCollapsed')}
          </label>
        </div>

        {/* Tabs */}
        <div style={S.tabNav}>
          <button
            style={{ ...S.tab, ...(activeTab === 'map' ? S.tabActive : {}) }}
            onClick={() => setActiveTab('map')}
          >
            {sidebarOpen ? t('tabLibrary') : t('tabLibraryCollapsed')}
          </button>
          {sidebarOpen && (
            <button
              style={{ ...S.tab, ...(activeTab === 'recently' ? S.tabActive : {}) }}
              onClick={() => setActiveTab('recently')}
            >
              {t('tabRecent')}
            </button>
          )}
        </div>

        {/* Decal grid */}
        <div style={S.decalGrid}>
          {activeTab === 'recently' && recentlyUsed.length === 0 ? (
            <p style={S.noRecently}>{t('noRecent')}</p>
          ) : (
            displayDecals.map((url, i) => (
              <button
                key={url + i}
                style={{ ...S.decalItem, ...(placementMode && currentDecal === url ? S.decalActive : {}) }}
                onClick={() => handleSelectDecal(url)}
                title={url}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={S.decalImg} draggable={false} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Sidebar toggle button ── */}
      <button
        style={{ ...S.toggleBtn, left: sidebarW }}
        onClick={() => setSidebarOpen(v => !v)}
        aria-label="Toggle sidebar"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image/decals/showmore.png"
          alt=""
          style={{ width: 17, height: 47, transform: sidebarOpen ? 'none' : 'scaleX(-1)' }}
        />
      </button>

      {/* ── THREE.js canvas ── */}
      <div ref={containerRef} style={{ ...S.canvas, left: sidebarW }} />

      {/* ── Mode hint ── */}
      {!placementMode && (
        <div style={{ ...S.hint, left: sidebarW }}>
          <span style={S.hintPill}>
            {t('hint')}
          </span>
        </div>
      )}

      {/* ── Controls panel (top right) ── */}
      <div style={S.panel}>
        <div style={S.panelRow}>
          <span style={S.panelLbl}>{t('size')}：{decalSize}</span>
          <input
            type="range" min={1} max={30} value={decalSize} style={S.slider}
            onChange={e => {
              const v = +e.target.value;
              setDecalSize(v);
              onSizeChangeRef.current(v);
            }}
          />
        </div>
        <div style={S.panelRow}>
          <span style={S.panelLbl}>{t('rotation')}：{rotation}°</span>
          <input
            type="range" min={-180} max={180} step={1} value={rotation} style={S.slider}
            onChange={e => {
              const v = +e.target.value;
              setRotation(v);
              onRotChangeRef.current(v);
            }}
          />
        </div>
        <div style={S.panelBtns}>
          <PanelBtn active={canUndo} onClick={() => undoRef.current()}>↺ {t('undo')}</PanelBtn>
          <PanelBtn active={canRedo} onClick={() => redoRef.current()}>↻ {t('redo')}</PanelBtn>
          <PanelBtn active={true} onClick={() => clearAllRef.current()}>{t('clear')}</PanelBtn>
          <PanelBtn active={true} onClick={() => exportSTLRef.current()}>{t('export')}</PanelBtn>
        </div>
      </div>

      {/* ── Back button ── */}
      <button
        style={{ ...S.backBtn, left: sidebarW + 12 }}
        onClick={() => router.push(`/${locale}/projects`)}
      >
        {t('back')}
      </button>

      {/* ── Right-click context menu ── */}
      {ctxMenu.visible && (
        <>
          <div style={S.menuBg} onClick={() => hideMenuRef.current()} />
          <div style={{ ...S.ctxMenu, left: ctxMenu.x, top: ctxMenu.y }}>
            <div style={S.ctxTitle}>{t('ctxTitle')}</div>
            <div style={S.panelRow}>
              <span style={S.panelLbl}>{t('ctxSize')}：{ctxMenu.size}</span>
              <input
                type="range" min={1} max={30} value={ctxMenu.size} style={S.slider}
                onChange={e => {
                  const v = +e.target.value;
                  setCtxMenu(c => ({ ...c, size: v }));
                  onMenuSizeRef.current(v);
                }}
              />
            </div>
            <div style={S.panelRow}>
              <span style={S.panelLbl}>{t('ctxRotation')}：{Math.round(ctxMenu.rot)}°</span>
              <input
                type="range" min={-180} max={180} step={1} value={ctxMenu.rot} style={S.slider}
                onChange={e => {
                  const v = +e.target.value;
                  setCtxMenu(c => ({ ...c, rot: v }));
                  onMenuRotRef.current(v);
                }}
              />
            </div>
            <div style={S.panelBtns}>
              <PanelBtn active={true} danger onClick={() => deleteDecalRef.current()}>{t('delete')}</PanelBtn>
              <PanelBtn active={true} onClick={() => hideMenuRef.current()}>{t('close')}</PanelBtn>
            </div>
          </div>
        </>
      )}

      {/* ── Loading overlay ── */}
      {showLoading && (
        <div style={S.loading}>
          <div className="animate-spin" style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(0,212,255,0.15)', borderTopColor: '#00d4ff', marginBottom: 12 }} />
          <p style={{ color: '#555', marginTop: 12, fontFamily: 'Monospace', fontSize: 14 }}>
            {t('loading')}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Small button ─────────────────────────────────────────────────────────────
function PanelBtn({
  active, danger, onClick, children,
}: {
  active: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      style={{
        ...S.panelBtn,
        opacity: active ? 1 : 0.38,
        pointerEvents: active ? 'auto' : 'none',
        background: danger ? '#8b2020' : '#555',
        borderColor: danger ? '#a83030' : '#777',
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: '#cce0ff',
  },
  sidebar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    background: '#F4F4F4',
    zIndex: 10,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
    transition: 'width 0.15s ease',
  },
  uploadWrap: {
    padding: '10px',
    borderBottom: '1px solid #D6DBE1',
    flexShrink: 0,
  },
  uploadLabel: {
    display: 'block', position: 'relative',
    cursor: 'pointer', color: '#999',
    fontSize: 13, padding: '5px',
    textAlign: 'center',
    border: '1px dashed #999', borderRadius: 4,
    userSelect: 'none',
  },
  uploadInput: {
    position: 'absolute', inset: 0,
    opacity: 0, cursor: 'pointer', width: '100%',
  },
  tabNav: {
    display: 'flex', flexShrink: 0,
    borderBottom: '1px solid #D6DBE1',
  },
  tab: {
    flex: 1, padding: '8px 4px',
    background: 'none', border: 'none',
    cursor: 'pointer', color: '#333',
    fontSize: 15, textAlign: 'center',
  },
  tabActive: { borderBottom: '2px solid #333', fontWeight: 600 },
  decalGrid: {
    flex: 1, overflowY: 'auto',
    display: 'flex', flexWrap: 'wrap',
    alignContent: 'flex-start',
    padding: 5, gap: 5,
  },
  noRecently: {
    width: '100%', textAlign: 'center',
    color: '#333', padding: '20px 0', margin: 0,
  },
  decalItem: {
    position: 'relative',
    width: 100, height: 100,
    border: '1px solid #D6DBE1',
    background: '#F4F4F4',
    cursor: 'pointer', padding: 2, flexShrink: 0,
  },
  decalActive: { border: '2px solid red' },
  decalImg: {
    width: '100%', height: '100%',
    objectFit: 'contain', display: 'block',
  },
  toggleBtn: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    zIndex: 11, background: 'transparent',
    border: 'none', cursor: 'pointer',
    padding: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  canvas: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    cursor: 'crosshair', touchAction: 'none',
  },
  panel: {
    position: 'absolute', top: 10, right: 10, zIndex: 10,
    background: 'rgba(0,0,0,0.72)', borderRadius: 8,
    padding: '12px 14px', color: '#fff', minWidth: 220,
    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
  },
  panelRow: { marginBottom: 10 },
  panelLbl: { display: 'block', fontSize: 11, color: '#bbb', marginBottom: 3 },
  slider: { display: 'block', width: '100%', cursor: 'pointer' },
  panelBtns: { display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 },
  panelBtn: {
    flex: 1, minWidth: 52, padding: '5px 4px',
    border: '1px solid #777', color: '#fff',
    borderRadius: 4, cursor: 'pointer',
    fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  backBtn: {
    position: 'absolute', top: 12, zIndex: 20,
    background: 'rgba(0,0,0,0.55)', color: '#fff',
    border: 'none', borderRadius: 6,
    padding: '6px 16px', cursor: 'pointer', fontSize: 13,
  },
  menuBg: {
    position: 'fixed', inset: 0, zIndex: 30,
  },
  ctxMenu: {
    position: 'fixed', zIndex: 31,
    background: 'rgba(20,20,20,0.92)', borderRadius: 8,
    padding: '10px 14px', color: '#fff', minWidth: 220,
    boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
    transform: 'translateY(-50%)',
  },
  ctxTitle: {
    fontSize: 11, fontWeight: 700, color: '#888',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: 10, borderBottom: '1px solid #333', paddingBottom: 6,
  },
  loading: {
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(204,224,255,0.92)',
  },
  hint: {
    position: 'absolute', bottom: 18, right: 0,
    zIndex: 20, pointerEvents: 'none',
    display: 'flex', justifyContent: 'center',
    paddingRight: 18, paddingLeft: 18,
  },
  hintPill: {
    background: 'rgba(0,0,0,0.58)',
    color: '#ffffffcc',
    fontSize: 12,
    borderRadius: 20,
    padding: '5px 16px',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
};
