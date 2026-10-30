import { describe, expect, it } from 'vitest';
import { cleanPlacements, decorFor, degDiff, getDecor, MAX_DECOR, MAX_SCALE, MIN_SCALE, panOffset } from './arDecor';

describe('decorFor', () => {
  it('puts the holiday set first and adds the everyday props once', () => {
    const halloween = decorFor('Halloween');
    expect(halloween[0].key).toBe('ghost');
    expect(halloween.some((d) => d.key === 'sparkles')).toBe(true);
    expect(new Set(halloween.map((d) => d.key)).size).toBe(halloween.length);
    expect(decorFor(undefined).map((d) => d.key)).toEqual(['sparkles', 'bulb', 'heart']);
  });
  it('finds any prop by key', () => {
    expect(getDecor('deer')?.name).toBe('Reindeer');
    expect(getDecor('nope')).toBeUndefined();
  });
});

describe('cleanPlacements', () => {
  it('drops unknown props and clamps positions and sizes', () => {
    const out = cleanPlacements([
      { kind: 'ghost', x: -1, y: 2, scale: 9 },
      { kind: 'mystery', x: 0.5, y: 0.5, scale: 1 },
      { kind: 'bat', x: 0.33333, y: Number.NaN, scale: 1 },
      { kind: 'star', x: 0.123456, y: 0.5, scale: 0.01 },
    ]);
    expect(out).toEqual([
      { kind: 'ghost', x: 0, y: 1, scale: MAX_SCALE },
      { kind: 'star', x: 0.123, y: 0.5, scale: MIN_SCALE },
    ]);
  });
  it('caps how many props a house can have', () => {
    const many = Array.from({ length: MAX_DECOR + 5 }, () => ({ kind: 'ghost', x: 0.5, y: 0.5, scale: 1 }));
    expect(cleanPlacements(many)).toHaveLength(MAX_DECOR);
  });
});

describe('panOffset', () => {
  it('slides props left when the phone turns right and down when it tilts up', () => {
    const start = { alpha: 10, beta: 90 };
    expect(panOffset(start, { alpha: 0, beta: 90 }).dx).toBeLessThan(0);
    expect(panOffset(start, { alpha: 20, beta: 90 }).dx).toBeGreaterThan(0);
    expect(panOffset(start, { alpha: 10, beta: 100 }).dy).toBeGreaterThan(0);
  });
  it('wraps around north', () => {
    expect(degDiff(350, 10)).toBe(-20);
    expect(panOffset({ alpha: 355, beta: 90 }, { alpha: 5, beta: 90 }).dx).toBeCloseTo(10 / 52);
  });
});
