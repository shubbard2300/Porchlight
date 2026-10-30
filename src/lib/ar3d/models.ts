import * as THREE from 'three';

/**
 * Low-poly 3D models for every AR prop, built from simple shapes in code so there are no model files
 * to host. Each builder makes a rough shape; `buildProp` then centers it and scales it to fit a
 * 1 x 1 x 1 box, so placement code can treat every prop the same.
 */

type MatOpts = { glow?: number; rough?: number; metal?: number; opacity?: number };
const mat = (color: number, o: MatOpts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.55,
    metalness: o.metal ?? 0,
    emissive: o.glow ? color : 0x000000,
    emissiveIntensity: o.glow ?? 0,
    transparent: o.opacity !== undefined,
    opacity: o.opacity ?? 1,
  });

const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const me = new THREE.Mesh(g, m);
  me.position.set(x, y, z);
  return me;
};
const sphere = (r: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 20) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), m, x, y, z);
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 18) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z);
const cone = (r: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 18) => mesh(new THREE.ConeGeometry(r, h, seg), m, x, y, z);
const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
const torus = (r: number, t: number, m: THREE.Material, x = 0, y = 0, z = 0, arc = Math.PI * 2) => mesh(new THREE.TorusGeometry(r, t, 10, 28, arc), m, x, y, z);
const lathe = (pts: [number, number][], m: THREE.Material, seg = 24) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), m);
const extrude = (shape: THREE.Shape, depth: number, m: THREE.Material, bevel = 0.03) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 16 });
  g.center();
  return new THREE.Mesh(g, m);
};
const group = (...parts: THREE.Object3D[]) => {
  const g = new THREE.Group();
  parts.forEach((p) => g.add(p));
  return g;
};
const rot = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number) => {
  o.rotation.set(x, y, z);
  return o;
};
const scl = <T extends THREE.Object3D>(o: T, x: number, y = x, z = x) => {
  o.scale.set(x, y, z);
  return o;
};

function starShape(points = 5, outer = 0.5, inner = 0.22) {
  const s = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const p = [Math.cos(a) * r, Math.sin(a) * r] as const;
    if (i) s.lineTo(...p);
    else s.moveTo(...p);
  }
  return s;
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.45);
  s.bezierCurveTo(-0.6, 0, -0.45, 0.45, 0, 0.22);
  s.bezierCurveTo(0.45, 0.45, 0.6, 0, 0, -0.45);
  return s;
}

function leafShape(lobes = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i <= lobes * 2; i++) {
    const a = Math.PI * (0.05 + (0.9 * i) / (lobes * 2));
    const r = i % 2 ? 0.22 : 0.5;
    const p = [Math.cos(a) * r, Math.sin(a) * r - 0.1] as const;
    if (i) s.lineTo(...p);
    else s.moveTo(...p);
  }
  s.lineTo(0, -0.15);
  return s;
}

function wingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.1);
  s.quadraticCurveTo(0.3, 0.35, 0.65, 0.2);
  s.quadraticCurveTo(0.55, 0.05, 0.5, -0.05);
  s.quadraticCurveTo(0.42, 0.02, 0.35, -0.08);
  s.quadraticCurveTo(0.27, -0.02, 0.2, -0.12);
  s.quadraticCurveTo(0.12, -0.05, 0, -0.08);
  return s;
}

const eyes = (y: number, z: number, gap: number, r: number, color = 0x14123a) => [sphere(r, mat(color, { rough: 0.2 }), -gap, y, z, 12), sphere(r, mat(color, { rough: 0.2 }), gap, y, z, 12)];

const flame = (y: number, s = 1) => group(scl(sphere(0.06, mat(0xffb000, { glow: 1.6 }), 0, y, 0, 12), s, s * 1.8, s), scl(sphere(0.03, mat(0xfff4c2, { glow: 2 }), 0, y - 0.01, 0.02, 10), s, s * 1.6, s));

const BUILDERS: Record<string, () => THREE.Object3D> = {
  ghost: () => {
    const body = lathe([[0, 0.56], [0.12, 0.545], [0.21, 0.5], [0.28, 0.42], [0.32, 0.3], [0.34, 0.1], [0.35, -0.15], [0.38, -0.32], [0.43, -0.43], [0.3, -0.4], [0, -0.38]], mat(0xf4f1ff, { glow: 0.25, opacity: 0.92 }));
    return group(body, ...eyes(0.25, 0.27, 0.11, 0.05), scl(sphere(0.06, mat(0x14123a)), 1, 1.3, 0.6).translateY(0.08).translateZ(0.3), rot(cyl(0.06, 0.08, 0.35, mat(0xf4f1ff, { opacity: 0.92 }), -0.38, 0, 0), 0, 0, 0.9), rot(cyl(0.06, 0.08, 0.35, mat(0xf4f1ff, { opacity: 0.92 }), 0.38, 0, 0), 0, 0, -0.9));
  },
  pumpkin: () => {
    const o = mat(0xff6a1f, { rough: 0.5 });
    const ribs = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return scl(sphere(0.28, o, Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2), 0.75, 0.9, 0.75);
    });
    const face = mat(0xffd34d, { glow: 1.4 });
    const tri = (x: number) => rot(cone(0.07, 0.08, face, x, 0.08, 0.42, 3), Math.PI / 2, 0, Math.PI);
    return group(...ribs, cyl(0.04, 0.05, 0.16, mat(0x3f7a2b), 0, 0.33, 0), tri(-0.13), tri(0.13), rot(torus(0.14, 0.03, face, 0, -0.05, 0.41, Math.PI), 0, 0, Math.PI));
  },
  bat: () => {
    const b = mat(0x3b2d5c, { rough: 0.7 });
    const w1 = extrude(wingShape(), 0.02, b, 0.01);
    w1.position.x = 0.38;
    const w2 = w1.clone();
    w2.scale.x = -1;
    w2.position.x = -0.38;
    return group(scl(sphere(0.16, b), 1, 1.2, 1), sphere(0.12, b, 0, 0.2, 0), cone(0.04, 0.1, b, -0.07, 0.33, 0), cone(0.04, 0.1, b, 0.07, 0.33, 0), ...eyes(0.22, 0.1, 0.045, 0.025, 0xffd34d), w1, w2);
  },
  spider: () => {
    const b = mat(0x1b1730, { rough: 0.4 });
    const legs = Array.from({ length: 8 }, (_, i) => {
      const side = i < 4 ? -1 : 1;
      const k = (i % 4) - 1.5;
      const leg = group(rot(cyl(0.015, 0.015, 0.3, b, side * 0.15, 0.05, 0), 0, 0, side * 1.1), rot(cyl(0.015, 0.012, 0.32, b, side * 0.32, -0.08, 0), 0, 0, side * -0.4));
      leg.rotation.y = k * 0.35 * side;
      return leg;
    });
    return group(sphere(0.18, b, 0, 0, -0.12), sphere(0.11, b, 0, 0, 0.1), ...eyes(0.04, 0.2, 0.04, 0.025, 0xff4d8d), ...legs, cyl(0.004, 0.004, 0.6, mat(0xdddddd), 0, 0.3, -0.12, 6));
  },
  web: () => {
    const s = mat(0xe8e6f5, { glow: 0.3, rough: 0.3 });
    const spokes = Array.from({ length: 8 }, (_, i) => rot(cyl(0.008, 0.008, 1, s, 0, 0, 0, 6), 0, 0, (i / 8) * Math.PI));
    const rings = [0.12, 0.24, 0.36, 0.48].map((r) => mesh(new THREE.TorusGeometry(r, 0.007, 4, 8), s));
    return group(...spokes, ...rings);
  },
  skull: () => {
    const bone = mat(0xf2ead8, { rough: 0.6 });
    const dark = mat(0x14123a);
    return group(scl(sphere(0.3, bone), 1, 0.95, 1), box(0.3, 0.16, 0.24, bone, 0, -0.24, 0.05), scl(sphere(0.07, dark, -0.11, 0.0, 0.26), 1, 1.2, 0.5), scl(sphere(0.07, dark, 0.11, 0.0, 0.26), 1, 1.2, 0.5), rot(cone(0.035, 0.07, dark, 0, -0.1, 0.29, 3), Math.PI / 2, 0, 0), ...[-0.08, -0.03, 0.03, 0.08].map((x) => box(0.035, 0.05, 0.02, mat(0xffffff), x, -0.28, 0.17)));
  },
  crystal: () => group(sphere(0.32, mat(0xb9a6ff, { glow: 0.6, rough: 0.05, metal: 0.1, opacity: 0.8 }), 0, 0.12, 0), sphere(0.14, mat(0xffffff, { glow: 1.2, opacity: 0.6 }), 0.05, 0.18, 0.1), cyl(0.22, 0.3, 0.14, mat(0x6b3fd6, { metal: 0.6, rough: 0.3 }), 0, -0.25, 0)),
  candle: () => group(cyl(0.12, 0.13, 0.55, mat(0xfff4e4, { rough: 0.8 }), 0, -0.1, 0), cyl(0.005, 0.005, 0.06, mat(0x222222), 0, 0.2, 0, 6), flame(0.27), cyl(0.2, 0.2, 0.04, mat(0xd8b46a, { metal: 0.7, rough: 0.3 }), 0, -0.38, 0)),
  owl: () => {
    const brown = mat(0x8a5a3c);
    return group(scl(sphere(0.3, brown), 1, 1.25, 0.9), scl(sphere(0.2, mat(0xe8cfa8), 0, -0.05, 0.12), 1, 1.2, 0.7), sphere(0.1, mat(0xffffff), -0.11, 0.22, 0.2), sphere(0.1, mat(0xffffff), 0.11, 0.22, 0.2), ...eyes(0.22, 0.29, 0.11, 0.05), rot(cone(0.04, 0.09, mat(0xffb000), 0, 0.12, 0.28, 8), Math.PI / 2 + 0.3, 0, 0), cone(0.06, 0.14, brown, -0.17, 0.42, 0), cone(0.06, 0.14, brown, 0.17, 0.42, 0));
  },
  moon: () => {
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.5, Math.PI * 0.35, Math.PI * 1.65, false);
    s.absarc(0.22, 0, 0.42, Math.PI * 1.55, Math.PI * 0.45, true);
    return extrude(s, 0.18, mat(0xffd96b, { glow: 0.7 }), 0.05);
  },
  snowman: () => {
    const snow = mat(0xffffff, { rough: 0.9 });
    return group(sphere(0.3, snow, 0, -0.25, 0), sphere(0.22, snow, 0, 0.1, 0), sphere(0.16, snow, 0, 0.38, 0), ...eyes(0.42, 0.14, 0.05, 0.022), rot(cone(0.03, 0.14, mat(0xff6a1f), 0, 0.38, 0.2, 10), Math.PI / 2, 0, 0), cyl(0.12, 0.12, 0.16, mat(0x14123a), 0, 0.6, 0), cyl(0.18, 0.18, 0.02, mat(0x14123a), 0, 0.53, 0), torus(0.17, 0.04, mat(0xe8364f), 0, 0.26, 0).rotateX(Math.PI / 2));
  },
  tree: () => {
    const g = mat(0x1e9e6a, { rough: 0.7 });
    const balls = [0xe8364f, 0xffb000, 0x3d7bff, 0xff4d8d, 0xffffff].flatMap((c, i) => [sphere(0.035, mat(c, { glow: 0.8 }), Math.cos(i * 1.3) * 0.25, -0.2 + i * 0.1, Math.sin(i * 1.3) * 0.25 + 0.05, 10)]);
    return group(cone(0.42, 0.45, g, 0, -0.15, 0), cone(0.33, 0.4, g, 0, 0.08, 0), cone(0.22, 0.35, g, 0, 0.3, 0), cyl(0.07, 0.07, 0.15, mat(0x7a4b2a), 0, -0.44, 0), ...balls, scl(extrude(starShape(), 0.04, mat(0xffd34d, { glow: 1 })), 0.22).translateY(0.52));
  },
  star: () => extrude(starShape(), 0.16, mat(0xffd34d, { glow: 0.9, metal: 0.3, rough: 0.3 }), 0.05),
  gift: () => {
    const rib = mat(0xffd34d, { metal: 0.3, rough: 0.35 });
    return group(box(0.6, 0.48, 0.6, mat(0xe8364f)), box(0.66, 0.1, 0.66, mat(0xd42d45), 0, 0.27, 0), box(0.1, 0.5, 0.62, rib), box(0.62, 0.5, 0.1, rib), rot(torus(0.1, 0.035, rib, -0.08, 0.38, 0), 0, 0, 0.6), rot(torus(0.1, 0.035, rib, 0.08, 0.38, 0), 0, 0, -0.6));
  },
  deer: () => {
    const fur = mat(0x9a6640);
    const leg = (x: number, z: number) => cyl(0.035, 0.03, 0.4, fur, x, -0.3, z);
    const antler = (x: number) => group(rot(cyl(0.015, 0.02, 0.22, mat(0x6b4a2b), x, 0.45, 0.22), 0, 0, x * 3), rot(cyl(0.012, 0.012, 0.1, mat(0x6b4a2b), x * 1.6, 0.52, 0.22), 0, 0, -x * 6));
    return group(scl(sphere(0.2, fur), 1.5, 0.8, 0.8), leg(-0.2, 0.08), leg(0.2, 0.08), leg(-0.2, -0.08), leg(0.2, -0.08), rot(cyl(0.06, 0.08, 0.28, fur, 0, 0.18, 0.17), 0.5, 0, 0), sphere(0.11, fur, 0, 0.32, 0.25), sphere(0.04, mat(0xe8364f, { glow: 1.2 }), 0, 0.3, 0.36, 10), antler(-0.06), antler(0.06));
  },
  bell: () => {
    const gold = mat(0xffc94a, { metal: 0.8, rough: 0.25 });
    return group(lathe([[0, 0.4], [0.08, 0.38], [0.14, 0.25], [0.18, 0], [0.28, -0.25], [0.34, -0.32], [0, -0.3]], gold), sphere(0.07, gold, 0, -0.35, 0), torus(0.06, 0.02, gold, 0, 0.45, 0), rot(torus(0.16, 0.04, mat(0xe8364f), 0, 0.42, 0), Math.PI / 2, 0, 0));
  },
  snowflake: () => {
    const ice = mat(0xcfe8ff, { glow: 0.5, rough: 0.2, metal: 0.2 });
    return group(...Array.from({ length: 3 }, (_, i) => rot(box(1, 0.06, 0.06, ice), 0, 0, (i / 3) * Math.PI)), ...Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return group(rot(box(0.18, 0.04, 0.04, ice, Math.cos(a) * 0.32 + Math.cos(a + 0.8) * 0.06, Math.sin(a) * 0.32 + Math.sin(a + 0.8) * 0.06, 0), 0, 0, a + 0.8), rot(box(0.18, 0.04, 0.04, ice, Math.cos(a) * 0.32 + Math.cos(a - 0.8) * 0.06, Math.sin(a) * 0.32 + Math.sin(a - 0.8) * 0.06, 0), 0, 0, a - 0.8));
    }));
  },
  candy: () => {
    const red = mat(0xe8364f), white = mat(0xffffff);
    const segs = Array.from({ length: 8 }, (_, i) => cyl(0.06, 0.06, 0.1, i % 2 ? red : white, 0, -0.35 + i * 0.1, 0, 14));
    const hook = Array.from({ length: 6 }, (_, i) => {
      const a = (i / 5) * Math.PI;
      return sphere(0.06, i % 2 ? red : white, -0.12 + Math.cos(a) * 0.12, 0.45 + Math.sin(a) * 0.12, 0, 12);
    });
    return group(...segs, ...hook);
  },
  ribbon: () => {
    const r = mat(0xe8364f, { rough: 0.35 });
    return group(sphere(0.08, r), rot(scl(torus(0.16, 0.06, r, -0.17, 0.02, 0), 1, 0.7, 1), 0, 0, 0.2), rot(scl(torus(0.16, 0.06, r, 0.17, 0.02, 0), 1, 0.7, 1), 0, 0, -0.2), rot(box(0.08, 0.36, 0.03, r, -0.1, -0.24, 0), 0, 0, -0.35), rot(box(0.08, 0.36, 0.03, r, 0.1, -0.24, 0), 0, 0, 0.35));
  },
  menorah: () => {
    const gold = mat(0xffc94a, { metal: 0.8, rough: 0.25 });
    const arms = [-4, -3, -2, -1, 1, 2, 3, 4].map((i) => group(cyl(0.02, 0.02, 0.06 + Math.abs(i) * 0.06, gold, i * 0.11, 0.05 - Math.abs(i) * 0.0, 0, 8), cyl(0.03, 0.03, 0.08, mat(0x4a8bff), i * 0.11, 0.12 + Math.abs(i) * 0.03, 0, 10), flame(0.2 + Math.abs(i) * 0.03, 0.6).translateX(i * 0.11)));
    return group(cyl(0.025, 0.025, 0.55, gold, 0, -0.05, 0, 8), cyl(0.035, 0.035, 0.1, mat(0x4a8bff), 0, 0.27, 0, 10), flame(0.36, 0.6), box(0.92, 0.04, 0.04, gold, 0, 0.0, 0), cyl(0.18, 0.22, 0.06, gold, 0, -0.33, 0), ...arms);
  },
  dove: () => {
    const w = mat(0xffffff, { rough: 0.7 });
    const wing = (s: number) => rot(scl(sphere(0.2, w, -0.02, 0.22, s * 0.12), 0.9, 0.25, 1.5), s * 0.9, 0, 0.3);
    return group(scl(sphere(0.18, w), 1.6, 0.9, 0.9), sphere(0.1, w, 0.28, 0.1, 0), rot(cone(0.03, 0.08, mat(0xffb000), 0.4, 0.09, 0, 8), 0, 0, -Math.PI / 2), wing(-1), wing(1), rot(scl(cone(0.12, 0.2, w, -0.32, 0.02, 0), 1, 1, 0.4), 0, 0, Math.PI / 2), rot(scl(sphere(0.06, mat(0x6fbf4a), 0.42, 0.04, 0.04), 2, 0.6, 0.6), 0, 0, -0.3));
  },
  turkey: () => {
    const fan = [0xd9822b, 0xe8364f, 0xffb000, 0x8a5a3c, 0xd9822b, 0xe8364f, 0xffb000].map((c, i) => {
      const a = Math.PI * (0.15 + (0.7 * i) / 6);
      return rot(scl(sphere(0.12, mat(c), Math.cos(a) * 0.32, Math.sin(a) * 0.32 - 0.05, -0.12), 0.6, 1.6, 0.3), 0, 0, a - Math.PI / 2);
    });
    const brown = mat(0x7a4b2a);
    return group(...fan, scl(sphere(0.22, brown, 0, -0.1, 0.05), 1, 1.1, 1), sphere(0.1, brown, 0, 0.17, 0.15), ...eyes(0.2, 0.24, 0.04, 0.02), rot(cone(0.025, 0.06, mat(0xffb000), 0, 0.15, 0.26, 8), Math.PI / 2, 0, 0), scl(sphere(0.03, mat(0xe8364f), 0.02, 0.1, 0.24, 8), 1, 1.8, 1), cyl(0.02, 0.02, 0.15, mat(0xffb000), -0.07, -0.38, 0.05), cyl(0.02, 0.02, 0.15, mat(0xffb000), 0.07, -0.38, 0.05));
  },
  leaf: () => group(extrude(leafShape(), 0.04, mat(0xd9532b, { rough: 0.6 }), 0.015), cyl(0.015, 0.015, 0.3, mat(0x7a4b2a), 0, -0.3, 0, 6)),
  corn: () => {
    const kernels = Array.from({ length: 48 }, (_, i) => {
      const a = (i % 8) * (Math.PI / 4) + (Math.floor(i / 8) % 2) * 0.4;
      const y = -0.3 + Math.floor(i / 8) * 0.12;
      const r = 0.13 - Math.abs(y) * 0.12;
      return sphere(0.05, mat(i % 7 ? 0xffc94a : 0xd9822b), Math.cos(a) * r, y, Math.sin(a) * r, 8);
    });
    const husk = mat(0xc8b46a, { rough: 0.9 });
    return group(scl(sphere(0.15, mat(0xffc94a)), 1, 2.6, 1), ...kernels, rot(scl(sphere(0.12, husk, -0.12, -0.25, 0), 0.4, 2.4, 0.8), 0, 0, 0.35), rot(scl(sphere(0.12, husk, 0.12, -0.25, 0), 0.4, 2.4, 0.8), 0, 0, -0.35));
  },
  pie: () => {
    const crust = mat(0xd9a05b, { rough: 0.8 });
    return rot(group(cyl(0.45, 0.38, 0.14, crust), cyl(0.4, 0.4, 0.04, mat(0xb8562b), 0, 0.07, 0, 24), torus(0.42, 0.05, crust, 0, 0.08, 0).rotateX(Math.PI / 2), ...[0, 1, 2].map((i) => rot(box(0.6, 0.03, 0.06, crust, 0, 0.1, (i - 1) * 0.18), 0, 0.3, 0)), sphere(0.08, mat(0xffffff), 0.1, 0.13, 0.1, 12)), 0.7, 0, 0);
  },
  diya: () => rot(group(lathe([[0, -0.12], [0.3, -0.1], [0.42, 0.05], [0.4, 0.08], [0.28, -0.02], [0, -0.04]], mat(0xc4632b, { rough: 0.7 })), torus(0.41, 0.025, mat(0xffc94a, { metal: 0.6 }), 0, 0.06, 0).rotateX(Math.PI / 2), flame(0.18, 1.3)), 0.45, 0, 0),
  lotus: () => group(...Array.from({ length: 16 }, (_, i) => {
    const inner = i >= 8;
    const a = (i / 8) * Math.PI * 2 + (inner ? 0.4 : 0);
    const p = scl(sphere(0.15, mat(inner ? 0xffc0d6 : 0xff8fb8, { glow: 0.15 })), 0.55, 1.6, 0.3);
    p.position.set(Math.cos(a) * (inner ? 0.1 : 0.2), inner ? 0.08 : 0, Math.sin(a) * (inner ? 0.1 : 0.2));
    p.rotation.set(0, -a, 0);
    p.rotateZ(inner ? 0.3 : 0.7);
    return p;
  }), sphere(0.07, mat(0xffd34d, { glow: 0.6 }), 0, 0.05, 0), cyl(0.38, 0.38, 0.02, mat(0x1e9e6a), 0, -0.2, 0, 24)),
  flower: () => group(...Array.from({ length: 22 }, (_, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / 22);
    const th = Math.PI * (1 + Math.sqrt(5)) * i;
    return sphere(0.13, mat(i % 3 ? 0xff9f1c : 0xffc94a, { rough: 0.8 }), Math.cos(th) * Math.sin(phi) * 0.25, Math.cos(phi) * 0.25, Math.sin(th) * Math.sin(phi) * 0.25, 10);
  })),
  fireworks: () => group(...Array.from({ length: 26 }, (_, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / 26);
    const th = Math.PI * (1 + Math.sqrt(5)) * i;
    const dir = new THREE.Vector3(Math.cos(th) * Math.sin(phi), Math.cos(phi), Math.sin(th) * Math.sin(phi));
    const c = [0xff4d8d, 0xffd34d, 0x3d7bff, 0x6fe3a1][i % 4];
    const ray = cyl(0.008, 0.02, 0.32, mat(c, { glow: 1.4 }), 0, 0, 0, 6);
    ray.position.copy(dir.clone().multiplyScalar(0.3));
    ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return group(ray, sphere(0.04, mat(c, { glow: 2 }), dir.x * 0.48, dir.y * 0.48, dir.z * 0.48, 8));
  })),
  sparkler: () => group(cyl(0.012, 0.012, 0.8, mat(0x888888, { metal: 0.7 }), 0, -0.1, 0, 6), sphere(0.08, mat(0xfff4c2, { glow: 2.5 }), 0, 0.32, 0, 12), ...Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const r = rot(cyl(0.006, 0.006, 0.22, mat(0xffd34d, { glow: 2 }), Math.cos(a) * 0.12, 0.32 + Math.sin(a) * 0.12, (i % 3) * 0.03 - 0.03, 4), 0, 0, a - Math.PI / 2);
    return r;
  })),
  firecracker: () => group(cyl(0.12, 0.12, 0.6, mat(0xe8364f)), cyl(0.13, 0.13, 0.05, mat(0xffd34d, { metal: 0.4 }), 0, 0.2, 0), cyl(0.13, 0.13, 0.05, mat(0xffd34d, { metal: 0.4 }), 0, -0.2, 0), rot(cyl(0.01, 0.01, 0.16, mat(0x444444), 0.03, 0.36, 0, 6), 0, 0, -0.3), sphere(0.04, mat(0xffb000, { glow: 2 }), 0.06, 0.44, 0, 10)),
  lantern: () => {
    const red = mat(0xe8364f, { glow: 0.5 });
    const gold = mat(0xffc94a, { metal: 0.6, rough: 0.3 });
    return group(scl(sphere(0.3, red), 1.1, 0.85, 1.1), cyl(0.14, 0.14, 0.06, gold, 0, 0.26, 0), cyl(0.14, 0.14, 0.06, gold, 0, -0.26, 0), ...Array.from({ length: 7 }, (_, i) => cyl(0.006, 0.006, 0.22, mat(0xffc94a), Math.cos(i) * 0.06, -0.4, Math.sin(i) * 0.06, 4)), torus(0.05, 0.012, gold, 0, 0.33, 0));
  },
  dragon: () => {
    const red = mat(0xe8364f, { rough: 0.45 });
    const gold = mat(0xffc94a, { metal: 0.5, rough: 0.3 });
    const body = Array.from({ length: 9 }, (_, i) => sphere(0.11 - i * 0.006, i % 2 ? red : gold, -0.4 + i * 0.09, Math.sin(i * 0.9) * 0.12 - 0.05, 0, 14));
    return group(...body, box(0.24, 0.16, 0.2, red, 0.42, 0.08, 0), box(0.12, 0.06, 0.16, gold, 0.55, 0.03, 0), ...eyes(0.16, 0.08, 0.06, 0.03, 0xffffff).map((e) => e.translateX(0.48)), cone(0.025, 0.14, gold, 0.38, 0.22, -0.06, 6), cone(0.025, 0.14, gold, 0.38, 0.22, 0.06, 6), rot(cyl(0.008, 0.004, 0.3, gold, 0.65, 0.08, 0.08, 4), 0, 0, -1.2));
  },
  'envelope-red': () => {
    const red = mat(0xe8364f, { rough: 0.5 });
    const flap = extrude((() => { const s = new THREE.Shape(); s.moveTo(-0.3, 0); s.lineTo(0.3, 0); s.lineTo(0, -0.2); s.lineTo(-0.3, 0); return s; })(), 0.01, mat(0xc92b42), 0.005);
    flap.position.set(0, 0.3, 0.035);
    return group(box(0.6, 0.85, 0.06, red), flap, mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 24), mat(0xffc94a, { metal: 0.6, rough: 0.3 }), 0, 0.12, 0.04).rotateX(Math.PI / 2));
  },
  blossom: () => {
    const petals = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return scl(sphere(0.18, mat(0xffc0d6, { rough: 0.6 }), Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0), 1, 1, 0.3);
    });
    return group(...petals, sphere(0.09, mat(0xff4d8d), 0, 0, 0.03), ...Array.from({ length: 6 }, (_, i) => sphere(0.02, mat(0xffd34d, { glow: 0.6 }), Math.cos(i) * 0.08, Math.sin(i) * 0.08, 0.09, 8)));
  },
  rabbit: () => {
    const fur = mat(0xf2ece4, { rough: 0.9 });
    const pink = mat(0xffc0d6);
    const ear = (x: number) => group(scl(sphere(0.07, fur, x, 0.42, 0), 0.8, 2.6, 0.5), scl(sphere(0.04, pink, x, 0.42, 0.025), 0.8, 2.6, 0.4));
    return group(scl(sphere(0.25, fur, 0, -0.18, 0), 1, 1.1, 1), sphere(0.17, fur, 0, 0.15, 0.03), ear(-0.07), ear(0.07), ...eyes(0.19, 0.17, 0.06, 0.025), sphere(0.025, pink, 0, 0.13, 0.2, 8), sphere(0.08, fur, 0, -0.25, -0.24, 10));
  },
  egg: () => {
    const e = new THREE.SphereGeometry(0.32, 24, 18);
    const pos = e.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = 1 - y * 0.35;
      pos.setX(i, pos.getX(i) * k * 0.95);
      pos.setZ(i, pos.getZ(i) * k * 0.95);
      pos.setY(i, y * 1.3);
    }
    e.computeVertexNormals();
    return group(new THREE.Mesh(e, mat(0xb48cff, { rough: 0.4 })), ...[-0.12, 0.02, 0.16].map((y, i) => torus(0.3 - Math.abs(y) * 0.45, 0.025, mat([0xffd34d, 0xff4d8d, 0x6fe3a1][i]), 0, y, 0).rotateX(Math.PI / 2)));
  },
  chick: () => {
    const y = mat(0xffd34d, { rough: 0.7 });
    return group(sphere(0.26, y, 0, -0.12, 0), sphere(0.17, y, 0, 0.2, 0.04), ...eyes(0.24, 0.19, 0.06, 0.025), rot(cone(0.04, 0.08, mat(0xff9f1c), 0, 0.17, 0.22, 8), Math.PI / 2, 0, 0), rot(scl(sphere(0.1, y, -0.25, -0.08, 0), 0.4, 1, 0.8), 0, 0, 0.5), rot(scl(sphere(0.1, y, 0.25, -0.08, 0), 0.4, 1, 0.8), 0, 0, -0.5), scl(sphere(0.3, mat(0xffffff, { rough: 0.5 }), 0, -0.36, 0), 1.05, 0.55, 1.05));
  },
  tulip: () => {
    const petal = (a: number) => rot(scl(sphere(0.14, mat(0xff4d8d, { rough: 0.5 }), Math.cos(a) * 0.07, 0.3, Math.sin(a) * 0.07), 0.8, 1.5, 0.6), 0, -a, 0);
    const g = mat(0x3f9e4a);
    return group(petal(0), petal((Math.PI * 2) / 3), petal((Math.PI * 4) / 3), cyl(0.02, 0.025, 0.6, g, 0, -0.05, 0, 8), rot(scl(sphere(0.1, g, -0.08, -0.15, 0), 0.4, 2, 0.3), 0, 0, 0.4));
  },
  sparkles: () => group(scl(extrude(starShape(4, 0.5, 0.12), 0.06, mat(0xffd34d, { glow: 1.2 })), 0.8), scl(extrude(starShape(4, 0.5, 0.12), 0.06, mat(0xffe7a8, { glow: 1.2 })), 0.35).translateX(0.38).translateY(0.3), scl(extrude(starShape(4, 0.5, 0.12), 0.06, mat(0xffe7a8, { glow: 1.2 })), 0.25).translateX(-0.35).translateY(-0.32)),
  bulb: () => group(sphere(0.3, mat(0xffd34d, { glow: 1.3, opacity: 0.9 }), 0, 0.1, 0), cyl(0.15, 0.18, 0.1, mat(0xffd34d, { glow: 1.3, opacity: 0.9 }), 0, -0.2, 0), cyl(0.14, 0.14, 0.18, mat(0xb0b0b8, { metal: 0.8, rough: 0.3 }), 0, -0.34, 0), ...[-0.3, -0.36, -0.42].map((y) => torus(0.14, 0.012, mat(0x8a8a92, { metal: 0.8 }), 0, y, 0).rotateX(Math.PI / 2))),
  heart: () => extrude(heartShape(), 0.2, mat(0xff4d8d, { glow: 0.4, rough: 0.3 }), 0.06),
};

/** Prop keys that have a 3D model. */
export const MODEL_KEYS = Object.keys(BUILDERS);

/** A prop's 3D model, centered and scaled to fit a unit cube. Falls back to sparkles for unknown keys. */
export function buildProp(kind: string): THREE.Object3D {
  const inner = (BUILDERS[kind] ?? BUILDERS.sparkles)();
  const box3 = new THREE.Box3().setFromObject(inner);
  const size = box3.getSize(new THREE.Vector3());
  const center = box3.getCenter(new THREE.Vector3());
  inner.position.sub(center);
  const wrap = new THREE.Group();
  wrap.add(inner);
  wrap.scale.setScalar(1 / Math.max(size.x, size.y, size.z, 1e-3));
  wrap.name = kind;
  return wrap;
}
