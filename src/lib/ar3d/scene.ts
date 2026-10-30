import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BASE_SIZE, getDecor, type Placement } from '../arDecor';
import { buildProp } from './models';

/**
 * The host's layout as a real-world 3D scene, in meters. The 3:4 editor frame becomes an upright
 * wall FRAME_W wide standing on the ground at z = 0, roughly the front of a house, so props land
 * where the host put them on the photo: x across the house, y up from the ground.
 */
export const FRAME_W = 10;
export const FRAME_H = (FRAME_W * 4) / 3;

/** Where a placement sits in the scene, in meters. */
export function propPosition(p: Placement) {
  return { x: (p.x - 0.5) * FRAME_W, y: (1 - p.y) * FRAME_H, size: BASE_SIZE * p.scale * FRAME_W };
}

function greetingSign(text: string) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 192;
  const g = c.getContext('2d')!;
  g.font = '800 92px system-ui, -apple-system, sans-serif';
  const w = Math.min(980, g.measureText(text).width + 120);
  g.fillStyle = 'rgba(11, 10, 36, 0.82)';
  g.strokeStyle = '#ffb000';
  g.lineWidth = 10;
  g.beginPath();
  g.roundRect((1024 - w) / 2, 20, w, 152, 76);
  g.fill();
  g.stroke();
  g.fillStyle = '#fff4e4';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 512, 98, 900);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(FRAME_W * 0.9, FRAME_W * 0.9 * (192 / 1024)), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  sign.position.set(0, FRAME_H * 0.93, 0);
  sign.name = 'greeting';
  return sign;
}

export type PropNode = THREE.Object3D & { userData: { motion: string; baseY: number; phase: number } };

/** Every placed prop as a 3D model, plus the floating greeting. */
export function buildScene(placements: Placement[], greeting: string | null) {
  const root = new THREE.Group();
  placements.forEach((p, i) => {
    const d = getDecor(p.kind);
    if (!d) return;
    const { x, y, size } = propPosition(p);
    const node = buildProp(p.kind) as PropNode;
    node.scale.multiplyScalar(size);
    // Later props sit a little in front, like the editor's "To front".
    node.position.set(x, y, i * 0.05);
    node.userData = { motion: d.motion, baseY: y, phase: i * 0.37 };
    root.add(node);
  });
  if (greeting) root.add(greetingSign(greeting));
  return root;
}

/**
 * Studio-style reflections (a soft virtual room) so glossy, metal and glass props catch highlights.
 * Call once per renderer; it sets the scene's environment map.
 */
export function addEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.6;
  room.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
  pmrem.dispose();
}

/** Warm key light and a cool fill on top of the environment, so the models read as solid objects. */
export function addLights(scene: THREE.Object3D) {
  scene.add(new THREE.HemisphereLight(0xfff4e4, 0x4a4580, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(4, 10, 12);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb000, 0.7);
  rim.position.set(-8, 4, -6);
  scene.add(rim);
}

/** Gentle motion for each prop, matching the 2D editor's animations. */
export function animate(root: THREE.Object3D, t: number, reduced = false) {
  if (reduced) return;
  root.children.forEach((n) => {
    const u = (n as PropNode).userData;
    if (!u?.motion) return;
    const s = t + u.phase;
    const h = n.scale.y;
    if (u.motion === 'bob') n.position.y = u.baseY + Math.sin(s * 2.4) * 0.06 * h;
    else if (u.motion === 'sway') n.rotation.z = Math.sin(s * 1.9) * 0.14;
    else if (u.motion === 'spin') n.rotation.y = s * 0.9;
    else if (u.motion === 'twinkle') n.rotation.y = Math.sin(s * 1.2) * 0.5;
    else n.rotation.y = Math.sin(s * 0.6) * 0.25;
  });
}
