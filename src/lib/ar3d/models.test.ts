import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DECOR, decorFor } from '../arDecor';
import { buildProp, MODEL_KEYS } from './models';

const keys = [...new Set([...Object.values(DECOR).flat(), ...decorFor(undefined)].map((d) => d.key))];

describe('3D prop models', () => {
  it('has a model for every prop a host can place', () => {
    expect(keys.filter((k) => !MODEL_KEYS.includes(k))).toEqual([]);
  });
  it.each(keys)('%s fits a unit cube around the origin', (k) => {
    const o = buildProp(k);
    const b = new THREE.Box3().setFromObject(o);
    const s = b.getSize(new THREE.Vector3());
    expect(Math.max(s.x, s.y, s.z)).toBeCloseTo(1, 2);
    expect(b.getCenter(new THREE.Vector3()).length()).toBeLessThan(0.01);
  });
});

describe('AR Quick Look export', () => {
  it('turns a host layout into a USDZ file', async () => {
    const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
    const { buildScene } = await import('./scene');
    const scene = new THREE.Scene();
    scene.add(buildScene([{ kind: 'ghost', x: 0.3, y: 0.4, scale: 1 }, { kind: 'pumpkin', x: 0.7, y: 0.9, scale: 1.5 }], null));
    const data = await new USDZExporter().parseAsync(scene);
    expect(data.byteLength).toBeGreaterThan(10_000);
    // USDZ is a zip: starts with "PK".
    expect(String.fromCharCode(data[0], data[1])).toBe('PK');
  });
});
