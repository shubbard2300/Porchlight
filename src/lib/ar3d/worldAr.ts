import * as THREE from 'three';
import type { Placement } from '../arDecor';
import { addLights, animate, buildScene } from './scene';

/**
 * True world-tracked AR: the props are anchored in real space, so visitors can walk around them.
 * Android Chrome runs it in the browser with WebXR; iPhone and iPad hand a USDZ file to AR Quick Look.
 */

type XRNav = Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean>; requestSession(mode: string, init?: object): Promise<XRSession> } };

export type WorldArKind = 'webxr' | 'quicklook' | null;

/** Which kind of world-tracked AR this device can do, if any. */
export async function worldArSupport(): Promise<WorldArKind> {
  const xr = (navigator as XRNav).xr;
  if (xr) {
    try {
      if (await xr.isSessionSupported('immersive-ar')) return 'webxr';
    } catch { /* fall through */ }
  }
  const a = document.createElement('a');
  if (a.relList?.supports?.('ar')) return 'quicklook';
  return null;
}

/** Builds the scene as a USDZ file and opens it in AR Quick Look (iOS). */
export async function openQuickLook(placements: Placement[], greeting: string | null, title: string) {
  const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
  const scene = new THREE.Scene();
  scene.add(buildScene(placements, greeting));
  const data = await new USDZExporter().parseAsync(scene);
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'model/vnd.usdz+zip' }));
  const a = document.createElement('a');
  a.rel = 'ar';
  a.download = 'porchlight-ar.usdz';
  a.href = `${url}#allowsContentScaling=1&canonicalWebPageURL=${encodeURIComponent(location.href)}&checkoutTitle=${encodeURIComponent(title)}`;
  a.appendChild(document.createElement('img'));
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type WebXrRun = { end: () => void };

/**
 * Starts a WebXR AR session. A ring follows the ground where the phone points; tapping anchors the
 * props there, facing the visitor. Tapping again moves them. `onStatus` reports what to show.
 */
export async function startWebXr(opts: {
  placements: Placement[];
  greeting: string | null;
  overlay: HTMLElement;
  onStatus: (s: 'searching' | 'aim' | 'placed') => void;
  onEnd: () => void;
}): Promise<WebXrRun> {
  const xr = (navigator as XRNav).xr!;
  const session = await xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: opts.overlay },
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  renderer.domElement.style.display = 'none';
  document.body.appendChild(renderer.domElement);
  await renderer.xr.setSession(session as unknown as Parameters<typeof renderer.xr.setSession>[0]);

  const scene = new THREE.Scene();
  addLights(scene);
  const camera = new THREE.PerspectiveCamera();
  const root = buildScene(opts.placements, opts.greeting);
  root.visible = false;
  scene.add(root);

  const reticle = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.32, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffb000 }));
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const viewer = await session.requestReferenceSpace('viewer');
  const hitSource = await session.requestHitTestSource!({ space: viewer });
  let lastStatus = '';
  const status = (s: 'searching' | 'aim' | 'placed') => {
    if (s !== lastStatus) opts.onStatus(s);
    lastStatus = s;
  };
  status('searching');

  session.addEventListener('select', () => {
    if (!reticle.visible) return;
    const p = new THREE.Vector3().setFromMatrixPosition(reticle.matrix);
    root.position.copy(p);
    const cam = new THREE.Vector3();
    renderer.xr.getCamera().getWorldPosition(cam);
    root.rotation.set(0, Math.atan2(cam.x - p.x, cam.z - p.z), 0);
    root.visible = true;
    status('placed');
  });

  const t0 = performance.now();
  renderer.setAnimationLoop((t, frame) => {
    if (frame && hitSource) {
      const space = renderer.xr.getReferenceSpace();
      const hit = space ? frame.getHitTestResults(hitSource)[0]?.getPose(space) : undefined;
      reticle.visible = !!hit;
      if (hit) reticle.matrix.fromArray(hit.transform.matrix);
      if (!root.visible) status(hit ? 'aim' : 'searching');
    }
    animate(root, (t - t0) / 1000);
    renderer.render(scene, camera);
  });

  let ended = false;
  const cleanup = () => {
    if (ended) return;
    ended = true;
    renderer.setAnimationLoop(null);
    hitSource?.cancel();
    renderer.dispose();
    renderer.domElement.remove();
    opts.onEnd();
  };
  session.addEventListener('end', cleanup);
  return { end: () => { session.end().catch(cleanup); } };
}
