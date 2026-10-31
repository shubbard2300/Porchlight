'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { H_FOV, V_FOV, type Placement } from '@/lib/arDecor';
import { addEnvironment, addLights, animate, buildScene, FRAME_H } from '@/lib/ar3d/scene';

/**
 * The host's props as real 3D models drawn over a photo or the live camera. The virtual camera uses
 * the phone camera's field of view, so turning the phone turns the virtual camera by the same
 * angle and the props stay on the house.
 */
export function ArCanvas3D({ placements, greeting, live, shift, frameHeight, onCanvas, className }: {
  placements: Placement[];
  greeting: string | null;
  /** Fill the screen over the camera; otherwise fill the 3:4 frame it sits in. */
  live?: boolean;
  /** How far the phone turned since pinning, as fractions of the frame (see panOffset). */
  shift?: { dx: number; dy: number };
  /** Live only: on-screen height of the 3:4 frame the host's layout maps to, in CSS pixels. */
  frameHeight?: number;
  onCanvas?: (c: HTMLCanvasElement | null) => void;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const turn = useRef({ dx: 0, dy: 0 });
  const fit = useRef<() => void>(() => {});
  turn.current = shift ?? { dx: 0, dy: 0 };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    el.appendChild(renderer.domElement);
    onCanvas?.(renderer.domElement);

    const scene = new THREE.Scene();
    addEnvironment(renderer, scene);
    addLights(scene);
    const root = buildScene(placements, greeting);
    scene.add(root);
    const camera = new THREE.PerspectiveCamera(V_FOV, 3 / 4, 0.1, 400);
    camera.rotation.order = 'YXZ';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    fit.current = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Back off until the layout's height fills the frame's share of the screen.
      const share = live && frameHeight ? frameHeight / h : 1;
      const d = FRAME_H / 2 / Math.tan(THREE.MathUtils.degToRad(V_FOV / 2)) / share;
      camera.position.set(0, FRAME_H / 2, d);
      camera.updateProjectionMatrix();
    };
    fit.current();
    const ro = new ResizeObserver(() => fit.current());
    ro.observe(el);

    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      animate(root, (t - t0) / 1000, reduced);
      camera.rotation.y = THREE.MathUtils.degToRad(turn.current.dx * H_FOV);
      camera.rotation.x = THREE.MathUtils.degToRad(turn.current.dy * V_FOV);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      onCanvas?.(null);
      scene.environment?.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []).forEach((mt) => {
          (mt as THREE.MeshBasicMaterial).map?.dispose();
          mt.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
    // The scene is rebuilt only when the layout changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements, greeting, live]);

  useEffect(() => { fit.current(); }, [frameHeight]);

  return <div ref={host} className={className} aria-hidden="true" />;
}
