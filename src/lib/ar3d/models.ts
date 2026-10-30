import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * 3D models for every AR prop, built from shapes in code so there are no model files to host or
 * license. They aim for the soft, glossy "clay toy" look of the 3D emoji used across the site.
 * `buildProp` centers each model and scales it to fit a 1 x 1 x 1 box, so placement code can treat
 * every prop the same.
 */

/** glow: emissive strength. coat: clear lacquer (0-1). sheen: soft fabric/fuzz highlight. */
type MatOpts = { glow?: number; rough?: number; metal?: number; opacity?: number; coat?: number; sheen?: number; emissive?: number };
const mat = (color: number, o: MatOpts = {}) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: o.rough ?? 0.42,
    metalness: o.metal ?? 0,
    clearcoat: o.coat ?? (o.metal ? 0 : 0.35),
    clearcoatRoughness: 0.35,
    sheen: o.sheen ?? 0,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.6,
    emissive: o.glow ? (o.emissive ?? color) : 0x000000,
    emissiveIntensity: o.glow ?? 0,
    transparent: o.opacity !== undefined,
    opacity: o.opacity ?? 1,
  });

const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const me = new THREE.Mesh(g, m);
  me.position.set(x, y, z);
  return me;
};
const sphere = (r: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 40) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), m, x, y, z);
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 36) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z);
const cone = (r: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 36) => mesh(new THREE.ConeGeometry(r, h, seg), m, x, y, z);
const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
const torus = (r: number, t: number, m: THREE.Material, x = 0, y = 0, z = 0, arc = Math.PI * 2) => mesh(new THREE.TorusGeometry(r, t, 18, 56, arc), m, x, y, z);
const lathe = (pts: [number, number][], m: THREE.Material, seg = 48, smooth = true) => {
  const v = pts.map(([x, y]) => new THREE.Vector2(x, y));
  // A spline through the profile points gives round, toy-like silhouettes instead of facets.
  const prof = smooth ? new THREE.SplineCurve(v).getPoints(v.length * 8) : v;
  return new THREE.Mesh(new THREE.LatheGeometry(prof, seg), m);
};
const extrude = (shape: THREE.Shape, depth: number, m: THREE.Material, bevel = 0.03) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 6, curveSegments: 32 });
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

type P3 = [number, number, number];
/** A smooth round tube through the points (stems, arms, legs, garlands). */
const tube = (pts: P3[], r: number, m: THREE.Material, closed = false, radial = 14) => {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, pts.length * 12), r, radial, closed), m);
};
/** A tube with rounded ends, so limbs and twigs don't look cut off. */
const limb = (pts: P3[], r: number, m: THREE.Material) => group(tube(pts, r, m), sphere(r, m, ...pts[0], 16), sphere(r, m, ...pts[pts.length - 1], 16));
const rbox = (w: number, h: number, d: number, radius: number, m: THREE.Material, x = 0, y = 0, z = 0) => mesh(new RoundedBoxGeometry(w, h, d, 5, radius), m, x, y, z);

/** Moves every vertex with `fn` and recomputes smooth normals across seams. */
function deform(g: THREE.BufferGeometry, fn: (v: THREE.Vector3) => void) {
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const merged = mergeVertices(g, 1e-5);
  const p = merged.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    fn(v.fromBufferAttribute(p, i));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  merged.computeVertexNormals();
  return merged;
}

/** Glossy cartoon eyes with a catch-light, like the site's 3D emoji. */
const eyes = (y: number, z: number, gap: number, r: number, color = 0x14123a) => [-1, 1].flatMap((s) => [
  scl(sphere(r, mat(color, { rough: 0.12, coat: 1 }), s * gap, y, z, 20), 0.85, 1.15, 0.6),
  sphere(r * 0.32, mat(0xffffff, { glow: 0.8 }), s * gap - r * 0.3, y + r * 0.4, z + r * 0.5, 10),
]);

/** A teardrop flame with a bright core. */
const flame = (y: number, s = 1) => {
  const outer = lathe([[0, -0.05], [0.035, -0.035], [0.045, 0.005], [0.03, 0.05], [0.01, 0.09], [0, 0.11]], mat(0xff9a1f, { glow: 2, opacity: 0.92 }), 24);
  const core = lathe([[0, -0.04], [0.02, -0.025], [0.022, 0.01], [0.01, 0.04], [0, 0.055]], mat(0xfff4c2, { glow: 3 }), 20);
  const f = group(outer, core);
  f.position.y = y;
  return scl(f, s);
};

const BUILDERS: Record<string, () => THREE.Object3D> = {
  ghost: () => {
    const sheet = mat(0xf7f5ff, { glow: 0.22, emissive: 0xdfe4ff, sheen: 0.6, coat: 0.5 });
    const g = new THREE.LatheGeometry(new THREE.SplineCurve([[0, 0.58], [0.14, 0.56], [0.25, 0.49], [0.31, 0.36], [0.33, 0.15], [0.35, -0.1], [0.38, -0.3], [0.43, -0.42], [0.001, -0.42]].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(80), 96);
    // A wavy hem, like a sheet drifting.
    const body = new THREE.Mesh(deform(g, (v) => {
      if (v.y < -0.22) v.y += Math.sin(Math.atan2(v.z, v.x) * 7) * 0.05 * Math.min(1, (-0.22 - v.y) / 0.15);
    }), sheet);
    const arm = (s: number) => limb([[s * 0.28, 0.08, 0.04], [s * 0.42, 0.12, 0.1], [s * 0.5, 0.24, 0.14]], 0.055, sheet);
    const blush = mat(0xffa3c4, { rough: 0.6 });
    return group(body, arm(-1), arm(1), ...eyes(0.27, 0.29, 0.1, 0.055), scl(sphere(0.05, mat(0x2a1e4a, { rough: 0.3 }), 0, 0.11, 0.315), 1, 1.35, 0.5), scl(sphere(0.04, blush, -0.19, 0.16, 0.27), 1.3, 0.8, 0.4), scl(sphere(0.04, blush, 0.19, 0.16, 0.27), 1.3, 0.8, 0.4));
  },
  pumpkin: () => {
    const skin = mat(0xff7a1a, { rough: 0.38, coat: 0.6 });
    const g = deform(new THREE.SphereGeometry(0.42, 120, 80), (v) => {
      const th = Math.atan2(v.z, v.x);
      const lat = v.y / 0.42;
      // Ten deep ribs, squashed, with dimples where the stem and base sit.
      const rib = 0.86 + 0.14 * Math.pow(Math.abs(Math.sin(th * 5)), 0.6);
      v.x *= rib;
      v.z *= rib;
      v.y *= 0.76 * (1 - 0.22 * Math.pow(Math.abs(lat), 7));
    });
    const glow = mat(0xffd34d, { glow: 2.2, emissive: 0xffb000 });
    const tri = (x: number) => {
      const s = new THREE.Shape();
      s.moveTo(-0.07, -0.045);
      s.lineTo(0.07, -0.045);
      s.lineTo(x > 0 ? -0.01 : 0.01, 0.07);
      s.closePath();
      const e = extrude(s, 0.12, glow, 0.012);
      e.position.set(x, 0.09, 0.34);
      return rot(e, -0.15, x * 1.4, 0);
    };
    const mouth = new THREE.Shape();
    [[-0.22, 0.04], [-0.1, -0.01], [-0.07, -0.05], [-0.04, -0.015], [0.04, -0.015], [0.07, -0.05], [0.1, -0.01], [0.22, 0.04], [0.15, -0.08], [0.05, -0.115], [0.03, -0.08], [-0.03, -0.08], [-0.05, -0.115], [-0.15, -0.08]].forEach(([x, y], i) => (i ? mouth.lineTo(x, y) : mouth.moveTo(x, y)));
    mouth.closePath();
    const m = extrude(mouth, 0.12, glow, 0.012);
    m.position.set(0, -0.08, 0.35);
    m.rotation.x = 0.12;
    const stemMat = mat(0x5a7a2b, { rough: 0.85, coat: 0 });
    const vine = tube(Array.from({ length: 14 }, (_, i) => [0.06 + Math.cos(i * 0.9) * 0.05 + i * 0.012, 0.3 + Math.sin(i * 0.9) * 0.04, Math.sin(i * 0.9) * 0.05] as P3), 0.008, mat(0x4f8a2b));
    const leaf = scl(extrude(leafShape(), 0.02, mat(0x3f8a3a, { rough: 0.6 }), 0.01), 0.22);
    leaf.position.set(-0.1, 0.33, 0.02);
    leaf.rotation.set(-0.9, 0.3, 0.5);
    return group(new THREE.Mesh(g, skin), tri(-0.13), tri(0.13), m, limb([[0, 0.26, 0], [0.01, 0.36, 0], [0.05, 0.43, 0.01], [0.1, 0.45, 0.02]], 0.04, stemMat), vine, leaf);
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
    const b = mat(0x221c3a, { rough: 0.5, sheen: 1, coat: 0.6 });
    const legs = Array.from({ length: 8 }, (_, i) => {
      const s = i < 4 ? -1 : 1;
      const k = (i % 4) - 1.5;
      const a = k * 0.42;
      const dir = (r: number, y: number): P3 => [s * Math.cos(a) * r, y, Math.sin(a) * r * 1.3 - 0.02];
      return limb([dir(0.08, 0), dir(0.22, 0.16), dir(0.36, 0.08), dir(0.46, -0.16)], 0.018, b);
    });
    const mark = scl(sphere(0.05, mat(0xe8364f, { glow: 0.5 }), 0, 0.17, -0.2), 0.7, 0.3, 1.4);
    const eye = (x: number, y: number, r: number) => sphere(r, mat(0xff4d8d, { glow: 1.2, coat: 1, rough: 0.1 }), x, y, 0.19, 12);
    return group(scl(sphere(0.2, b, 0, 0.04, -0.2), 1, 0.85, 1.15), sphere(0.12, b, 0, 0.02, 0.08), eye(-0.045, 0.06, 0.026), eye(0.045, 0.06, 0.026), eye(-0.025, 0.1, 0.016), eye(0.025, 0.1, 0.016), mark, ...legs, cyl(0.003, 0.003, 0.6, mat(0xeeeeee, { glow: 0.4 }), 0, 0.5, -0.2, 6));
  },
  web: () => {
    const s = mat(0xe8e6f5, { glow: 0.3, rough: 0.3 });
    const spokes = Array.from({ length: 8 }, (_, i) => rot(cyl(0.008, 0.008, 1, s, 0, 0, 0, 6), 0, 0, (i / 8) * Math.PI));
    const rings = [0.12, 0.24, 0.36, 0.48].map((r) => mesh(new THREE.TorusGeometry(r, 0.007, 4, 8), s));
    return group(...spokes, ...rings);
  },
  skull: () => {
    const bone = mat(0xf2ead8, { rough: 0.55, coat: 0.3 });
    const dark = mat(0x1b1730, { rough: 0.9, coat: 0 });
    const head = deform(new THREE.SphereGeometry(0.3, 64, 48), (v) => {
      v.y *= 0.95;
      if (v.y < -0.05) v.x *= 1 - Math.min(0.25, (-0.05 - v.y) * 1.2);
    });
    const socket = (x: number) => scl(sphere(0.075, dark, x, -0.02, 0.24, 24), 1.05, 1.15, 0.55);
    return group(new THREE.Mesh(head, bone), rbox(0.28, 0.16, 0.22, 0.05, bone, 0, -0.25, 0.06), socket(-0.11), socket(0.11), rot(cone(0.035, 0.07, dark, 0, -0.12, 0.275, 3), Math.PI / 2 - 0.3, 0, Math.PI), ...[-0.075, -0.025, 0.025, 0.075].map((x) => rbox(0.042, 0.06, 0.03, 0.01, mat(0xfffaf0, { coat: 0.8 }), x, -0.27, 0.17)), sphere(0.03, mat(0xff4d8d, { glow: 1.5 }), -0.11, -0.02, 0.27, 12), sphere(0.03, mat(0xff4d8d, { glow: 1.5 }), 0.11, -0.02, 0.27, 12));
  },
  crystal: () => group(sphere(0.32, mat(0xb9a6ff, { glow: 0.6, rough: 0.05, metal: 0.1, opacity: 0.8 }), 0, 0.12, 0), sphere(0.14, mat(0xffffff, { glow: 1.2, opacity: 0.6 }), 0.05, 0.18, 0.1), cyl(0.22, 0.3, 0.14, mat(0x6b3fd6, { metal: 0.6, rough: 0.3 }), 0, -0.25, 0)),
  candle: () => {
    const wax = mat(0xfff1dc, { rough: 0.55, sheen: 0.4, coat: 0.3 });
    const brass = mat(0xd8a84a, { metal: 0.9, rough: 0.22 });
    const drips = [0, 1.3, 2.4, 3.6, 4.7, 5.6].map((a, i) => {
      const len = 0.08 + ((i * 37) % 5) * 0.035;
      const d = mesh(new THREE.CapsuleGeometry(0.022, len, 8, 16), wax, Math.cos(a) * 0.125, 0.16 - len / 2, Math.sin(a) * 0.125);
      return d;
    });
    return group(
      lathe([[0.001, 0.16], [0.09, 0.15], [0.12, 0.175], [0.125, 0.12], [0.125, -0.2], [0.13, -0.33], [0.001, -0.33]], wax, 64),
      ...drips,
      tube([[0, 0.15, 0], [0, 0.2, 0], [0.012, 0.23, 0]], 0.008, mat(0x2a2320, { rough: 0.9, coat: 0 })),
      flame(0.28, 1.15),
      lathe([[0.001, -0.37], [0.2, -0.37], [0.25, -0.33], [0.24, -0.31], [0.16, -0.33], [0.001, -0.33]], brass, 64, false),
      rot(torus(0.06, 0.016, brass, 0.27, -0.33, 0), Math.PI / 2, 0, 0),
    );
  },
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
    const snow = mat(0xf8fbff, { rough: 0.8, sheen: 0.8, coat: 0.15 });
    const coal = mat(0x1d1b2a, { rough: 0.5, coat: 0.6 });
    const twig = mat(0x6b4a2b, { rough: 0.9, coat: 0 });
    const scarf = mat(0xe8364f, { rough: 0.7, sheen: 1, coat: 0 });
    const arm = (s: number) => group(limb([[s * 0.2, 0.12, 0], [s * 0.36, 0.22, 0.02], [s * 0.5, 0.34, 0.02]], 0.014, twig), limb([[s * 0.42, 0.27, 0.02], [s * 0.47, 0.36, 0.03]], 0.01, twig), limb([[s * 0.47, 0.32, 0.02], [s * 0.56, 0.33, 0.02]], 0.009, twig));
    const smile = Array.from({ length: 5 }, (_, i) => {
      const a = Math.PI * (1.25 + i * 0.125);
      return sphere(0.013, coal, Math.cos(a) * 0.07, 0.4 + Math.sin(a) * 0.05, 0.145, 10);
    });
    return group(
      sphere(0.3, snow, 0, -0.26, 0, 64), sphere(0.22, snow, 0, 0.1, 0, 64), sphere(0.16, snow, 0, 0.4, 0, 64),
      ...eyes(0.45, 0.14, 0.05, 0.024), ...smile,
      rot(lathe([[0.001, 0], [0.03, 0.005], [0.022, 0.07], [0.001, 0.15]], mat(0xff7a1a, { rough: 0.5 }), 24), Math.PI / 2, 0, 0).translateY(0.41).translateZ(0.14),
      ...[0.17, 0.07, -0.03].map((y) => sphere(0.025, coal, 0, y, 0.215 - Math.abs(y - 0.07) * 0.2, 14)),
      arm(-1), arm(1),
      lathe([[0.001, 0.5], [0.2, 0.5], [0.205, 0.52], [0.12, 0.525], [0.115, 0.72], [0.001, 0.72]], coal, 48, false),
      cyl(0.119, 0.117, 0.05, scarf, 0, 0.555, 0),
      torus(0.165, 0.045, scarf, 0, 0.26, 0).rotateX(Math.PI / 2 - 0.1),
      rot(rbox(0.08, 0.24, 0.035, 0.015, scarf, 0.08, 0.15, 0.17), -0.2, 0, 0.25),
    );
  },
  tree: () => {
    const needles = mat(0x1f8a5a, { rough: 0.65, sheen: 0.6, coat: 0.2 });
    const tiers = [0, 1, 2, 3].map((i) => {
      const r = 0.44 - i * 0.09;
      const g = deform(new THREE.ConeGeometry(r, 0.34, 72, 6), (v) => {
        // Scalloped, slightly upturned branch tips.
        const th = Math.atan2(v.z, v.x);
        const k = 1 + 0.07 * Math.sin(th * 14) * (0.17 - v.y) / 0.34;
        v.x *= k;
        v.z *= k;
        if (v.y < -0.16) v.y += Math.cos(th * 14) * 0.015;
      });
      return mesh(g, needles, 0, -0.22 + i * 0.18, 0);
    });
    const radiusAt = (y: number) => Math.max(0.02, (0.44 * (0.5 - y)) / 0.9);
    const spiral = Array.from({ length: 60 }, (_, i) => {
      const t = i / 59;
      const y = -0.36 + t * 0.78;
      const a = t * Math.PI * 7;
      const r = radiusAt(y) * 0.86 + 0.015;
      return [Math.cos(a) * r, y + Math.sin(t * 40) * 0.008, Math.sin(a) * r] as P3;
    });
    const garland = tube(spiral, 0.012, mat(0xffd34d, { metal: 0.85, rough: 0.25 }));
    const lights = spiral.filter((_, i) => i % 3 === 1).map((p, i) => sphere(0.016, mat([0xff4d4d, 0xffd34d, 0x4da3ff, 0x6fe3a1, 0xff8fd8][i % 5], { glow: 2.2 }), p[0] * 1.06, p[1] - 0.012, p[2] * 1.06, 12));
    const balls = [0, 1, 2].flatMap((tier) => Array.from({ length: 6 - tier }, (_, j) => {
      const a = (j / (6 - tier)) * Math.PI * 2 + tier * 0.6;
      const r = (0.44 - tier * 0.09) * 0.93;
      const y = -0.36 + tier * 0.18;
      return sphere(0.035, mat([0xe8364f, 0x3d7bff, 0xffc94a, 0xc0c0d0][(j + tier) % 4], { metal: 0.75, rough: 0.15 }), Math.cos(a) * r, y, Math.sin(a) * r, 24);
    }));
    const star = scl(extrude(starShape(), 0.06, mat(0xffd34d, { glow: 1.2, metal: 0.5, rough: 0.2 }), 0.02), 0.24);
    star.position.y = 0.53;
    return group(...tiers, cyl(0.06, 0.07, 0.14, mat(0x6b4a2b, { rough: 0.9, coat: 0 }), 0, -0.44, 0), lathe([[0.001, -0.53], [0.15, -0.53], [0.13, -0.42], [0.001, -0.42]], mat(0xe8364f, { coat: 0.8 }), 48, false), garland, ...lights, ...balls, star);
  },
  star: () => extrude(starShape(5, 0.5, 0.24), 0.14, mat(0xffc72e, { glow: 0.45, metal: 0.55, rough: 0.22 }), 0.06),
  gift: () => {
    const paper = mat(0xe03048, { rough: 0.35, coat: 0.9 });
    const satin = mat(0xffd34d, { metal: 0.45, rough: 0.28, sheen: 0.8 });
    const loop = (s: number) => {
      const l = tube([[0, 0, 0], [s * 0.08, 0.07, 0], [s * 0.19, 0.11, 0], [s * 0.24, 0.05, 0], [s * 0.17, 0.0, 0], [s * 0.06, 0.0, 0]], 0.028, satin, true, 16);
      l.scale.z = 2.4;
      l.position.y = 0.4;
      return l;
    };
    const tail = (s: number) => rot(rbox(0.07, 0.2, 0.02, 0.008, satin, s * 0.09, 0.32, 0.31), 0.2, 0, s * 0.45);
    return group(
      rbox(0.58, 0.44, 0.58, 0.035, paper, 0, -0.04, 0),
      rbox(0.64, 0.12, 0.64, 0.035, mat(0xc92640, { rough: 0.35, coat: 0.9 }), 0, 0.22, 0),
      rbox(0.1, 0.57, 0.655, 0.02, satin, 0, 0.01, 0), rbox(0.655, 0.57, 0.1, 0.02, satin, 0, 0.01, 0),
      loop(-1), loop(1), scl(sphere(0.05, satin, 0, 0.41, 0, 24), 1, 0.9, 1.4), tail(-1), tail(1),
    );
  },
  deer: () => {
    const fur = mat(0x9a6640, { rough: 0.6, sheen: 0.7, coat: 0.2 });
    const cream = mat(0xf2dcc0, { rough: 0.6, sheen: 0.5 });
    const hoof = mat(0x3a2a20, { coat: 0.6 });
    const antlerMat = mat(0x7a5a3a, { rough: 0.7 });
    const leg = (x: number, z: number) => group(limb([[x, -0.08, z], [x * 1.05, -0.28, z + 0.02], [x * 1.05, -0.46, z]], 0.032, fur), sphere(0.036, hoof, x * 1.05, -0.47, z, 14));
    const antler = (s: number) => group(limb([[s * 0.05, 0.45, 0.2], [s * 0.1, 0.56, 0.18], [s * 0.2, 0.66, 0.16]], 0.016, antlerMat), limb([[s * 0.1, 0.56, 0.18], [s * 0.08, 0.66, 0.2]], 0.012, antlerMat), limb([[s * 0.16, 0.62, 0.17], [s * 0.24, 0.6, 0.2]], 0.011, antlerMat));
    const ear = (s: number) => rot(scl(sphere(0.05, fur, s * 0.11, 0.44, 0.17, 16), 0.5, 1, 0.3), 0, 0, s * -1);
    return group(
      scl(sphere(0.22, fur, 0, 0, 0), 1.45, 0.78, 0.85), scl(sphere(0.15, cream, 0, -0.04, 0.04), 1.6, 0.6, 0.7),
      leg(-0.18, 0.08), leg(0.18, 0.08), leg(-0.18, -0.08), leg(0.18, -0.08),
      limb([[0, 0.08, 0.17], [0, 0.22, 0.22], [0, 0.32, 0.22]], 0.07, fur),
      sphere(0.11, fur, 0, 0.38, 0.24, 32), scl(sphere(0.07, cream, 0, 0.33, 0.32), 1, 0.85, 1.1),
      sphere(0.036, mat(0xff2a3a, { glow: 1.6, coat: 1, rough: 0.1 }), 0, 0.34, 0.4, 16),
      ...eyes(0.41, 0.33, 0.045, 0.022), ear(-1), ear(1), antler(-1), antler(1),
      scl(sphere(0.05, cream, 0, 0.05, -0.32), 0.8, 1.2, 0.8),
    );
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
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) pts.push(new THREE.Vector3(0.12, -0.5 + i * 0.0375, 0));
    for (let i = 1; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.12, 0.25 + Math.sin(a) * 0.12, 0));
    }
    for (let i = 1; i <= 4; i++) pts.push(new THREE.Vector3(-0.12, 0.25 - i * 0.025, 0));
    const path = new THREE.CatmullRomCurve3(pts);
    const n = 400;
    const frames = path.computeFrenetFrames(n, false);
    // Red stripes spiral around the cane, sitting just proud of the white candy.
    const stripe = (phase: number, r: number) => {
      const sp = Array.from({ length: n + 1 }, (_, i) => {
        const a = (i / n) * Math.PI * 2 * 9 + phase;
        return path.getPointAt(i / n).add(frames.normals[i].clone().multiplyScalar(Math.cos(a) * 0.05)).add(frames.binormals[i].clone().multiplyScalar(Math.sin(a) * 0.05));
      });
      return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), n * 2, r, 10), mat(0xe8203a, { rough: 0.2, coat: 1 }));
    };
    const white = mat(0xfffaf5, { rough: 0.2, coat: 1 });
    const end = pts[pts.length - 1];
    return group(new THREE.Mesh(new THREE.TubeGeometry(path, 240, 0.065, 32), white), stripe(0, 0.024), stripe(Math.PI, 0.024), stripe(Math.PI / 2, 0.009), stripe(Math.PI * 1.5, 0.009), sphere(0.065, white, 0.12, -0.5, 0, 32), sphere(0.065, white, end.x, end.y, end.z, 32));
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
  flower: () => {
    // A marigold: rings of ruffled petals, darker and tighter toward the middle.
    const petals = Array.from({ length: 130 }, (_, i) => {
      const t = (i + 0.5) / 130;
      const phi = Math.acos(1 - t * 1.6);
      const th = Math.PI * (1 + Math.sqrt(5)) * i;
      const dir = new THREE.Vector3(Math.cos(th) * Math.sin(phi), Math.cos(phi), Math.sin(th) * Math.sin(phi));
      const c = t < 0.3 ? 0xf06a00 : t < 0.65 ? 0xff8c00 : 0xffaa10;
      const p = scl(sphere(0.11, mat(c, { rough: 0.5, sheen: 0.3, coat: 0.2 }), 0, 0, 0, 16), 1, 0.16, 0.6);
      p.position.copy(dir.clone().multiplyScalar(0.25));
      // Stand each petal on edge, pointing outward, for a ruffled pom-pom.
      p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      p.rotateZ(th);
      return p;
    });
    return rot(group(sphere(0.2, mat(0xd96a00)), ...petals), 0.5, 0, 0);
  },
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
    const silk = mat(0xe8203a, { glow: 0.55, emissive: 0xff5a3a, rough: 0.5, sheen: 0.8, coat: 0.2 });
    const gold = mat(0xffc94a, { metal: 0.85, rough: 0.25 });
    const body = deform(new THREE.SphereGeometry(0.32, 96, 64), (v) => {
      const k = 0.92 + 0.08 * Math.pow(Math.abs(Math.cos(Math.atan2(v.z, v.x) * 6)), 0.5);
      v.x *= k * 1.1;
      v.z *= k * 1.1;
      v.y *= 0.82;
    });
    const tassel = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return cyl(0.005, 0.005, 0.22, mat(0xffc94a, { rough: 0.5 }), Math.cos(a) * 0.04, -0.47, Math.sin(a) * 0.04, 5);
    });
    return group(
      new THREE.Mesh(body, silk),
      lathe([[0.001, 0.25], [0.15, 0.25], [0.17, 0.28], [0.16, 0.31], [0.001, 0.31]], gold, 48, false),
      lathe([[0.001, -0.31], [0.16, -0.31], [0.17, -0.28], [0.15, -0.25], [0.001, -0.25]], gold, 48, false),
      ...Array.from({ length: 6 }, (_, i) => rot(torus(0.302, 0.006, gold, 0, 0, 0, Math.PI), 0, (i / 6) * Math.PI, Math.PI / 2)).map((t) => scl(t, 1.07, 0.84, 1.07)),
      torus(0.05, 0.012, gold, 0, 0.36, 0), sphere(0.035, gold, 0, -0.34, 0, 20), cyl(0.045, 0.03, 0.05, gold, 0, -0.37, 0), ...tassel,
    );
  },
  dragon: () => {
    const red = mat(0xe8203a, { rough: 0.35, coat: 0.7 });
    const gold = mat(0xffc94a, { metal: 0.75, rough: 0.25 });
    const spine = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15;
      return [-0.5 + t * 0.85, Math.sin(t * Math.PI * 2.2) * 0.12, Math.cos(t * Math.PI * 1.6) * 0.06] as P3;
    });
    const fins = spine.slice(1, -2).map((p, i) => cone(0.025, 0.08, gold, p[0], p[1] + 0.075, p[2], 8));
    const head = spine[spine.length - 1];
    const [hx, hy, hz] = head;
    return group(
      tube(spine, 0.065, red), sphere(0.06, red, ...spine[0], 20),
      ...fins,
      rbox(0.2, 0.15, 0.17, 0.05, red, hx + 0.08, hy + 0.02, hz),
      rbox(0.13, 0.08, 0.13, 0.035, gold, hx + 0.19, hy - 0.01, hz),
      sphere(0.012, mat(0x2a1e1e), hx + 0.25, hy + 0.01, hz - 0.03, 8), sphere(0.012, mat(0x2a1e1e), hx + 0.25, hy + 0.01, hz + 0.03, 8),
      ...[-1, 1].flatMap((s) => [
        sphere(0.03, mat(0xffffff, { coat: 1 }), hx + 0.12, hy + 0.08, hz + s * 0.06, 16), sphere(0.017, mat(0x14123a, { coat: 1 }), hx + 0.14, hy + 0.085, hz + s * 0.07, 12),
        limb([[hx + 0.04, hy + 0.08, hz + s * 0.05], [hx - 0.04, hy + 0.17, hz + s * 0.07], [hx - 0.1, hy + 0.2, hz + s * 0.08]], 0.014, gold),
        tube([[hx + 0.24, hy - 0.03, hz + s * 0.05], [hx + 0.3, hy - 0.06, hz + s * 0.12], [hx + 0.34, hy - 0.02, hz + s * 0.2]], 0.006, gold),
      ]),
      ...[spine[4], spine[11]].flatMap((p) => [-1, 1].map((s) => limb([[p[0], p[1] - 0.03, p[2] + s * 0.04], [p[0] + 0.03, p[1] - 0.11, p[2] + s * 0.07]], 0.02, gold))),
      sphere(0.04, mat(0xffd34d, { glow: 1.6 }), hx + 0.36, hy - 0.08, hz, 16),
    );
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
