'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroWave() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const isMobile = w < 768;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x091427, 55, 115);

    const camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 1000);
    camera.position.set(0, 26, 88);
    camera.lookAt(0, -8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(200, 120, isMobile ? 40 : 72, isMobile ? 24 : 40);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const origX = new Float32Array(pos.count);
    const origY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      origX[i] = pos.getX(i);
      origY[i] = pos.getY(i);
    }

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const mesh = new THREE.Mesh(geometry, wireMat);
    mesh.rotation.x = -Math.PI / 3;
    mesh.frustumCulled = false;
    scene.add(mesh);

    const pointsMat = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 0.9,
      transparent: true,
      opacity: 0.32,
    });
    const points = new THREE.Points(geometry, pointsMat);
    points.rotation.x = -Math.PI / 3;
    points.frustumCulled = false;
    scene.add(points);

    const hitGeo = new THREE.PlaneGeometry(300, 200);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    const hitPlane = new THREE.Mesh(hitGeo, hitMat);
    hitPlane.rotation.x = -Math.PI / 3;
    scene.add(hitPlane);
    hitPlane.updateWorldMatrix(true, false);

    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    const _hit = new THREE.Vector3();

    let targetMX = 0, targetMY = 0;
    let smoothMX = 0, smoothMY = 0;
    let isInHero = false;
    let mouseStrength = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      isInHero =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom;

      if (!isInHero) return;

      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseNDC, camera);
      const hits = raycaster.intersectObject(hitPlane);
      if (hits.length > 0) {
        _hit.copy(hits[0].point);
        hitPlane.worldToLocal(_hit);
        targetMX = _hit.x;
        targetMY = _hit.y;
      }
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let isVisible = document.visibilityState === 'visible';
    const onVisibilityChange = () => { isVisible = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting && document.visibilityState === 'visible'; },
      { threshold: 0 }
    );
    observer.observe(container);

    let animId = 0;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;
      time += 0.006;

      smoothMX += (targetMX - smoothMX) * 0.05;
      smoothMY += (targetMY - smoothMY) * 0.05;
      mouseStrength += ((isInHero ? 1 : 0) - mouseStrength) * 0.06;

      for (let i = 0; i < pos.count; i++) {
        const x = origX[i];
        const y = origY[i];

        const base =
          Math.sin(x * 0.08 + time) * 4.0 +
          Math.sin(y * 0.10 + time * 0.75) * 2.8 +
          Math.sin((x + y) * 0.05 + time * 1.1) * 1.8;

        const dx = x - smoothMX;
        const dy = y - smoothMY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ripple = mouseStrength *
          Math.cos(dist * 0.18 - time * 5) *
          Math.exp(-dist / 16) * 4.5;

        pos.setZ(i, base + ripple);
      }
      pos.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      scene.remove(mesh, points, hitPlane);
      geometry.dispose();
      wireMat.dispose();
      pointsMat.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" />;
}
