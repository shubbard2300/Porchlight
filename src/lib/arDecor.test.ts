import { describe, expect, it } from 'vitest';
import { cleanPlacements, DECOR, decorFor, degDiff, forHoliday, getDecor, MAX_DECOR, MAX_SCALE, MIN_SCALE, panOffset } from './arDecor';

describe('decorFor', () => {
  it('gives each holiday only its own props, plus sparkles', () => {
    const halloween = decorFor('Halloween').map((d) => d.key);
    expect(halloween[0]).toBe('ghost');
    expect(halloween).toContain('sparkles');
    expect(halloween).not.toContain('snowman');
    expect(decorFor('Christmas').map((d) => d.key)).not.toContain('skull');
    expect(decorFor('Easter').map((d) => d.key)).toContain('rabbit');
    expect(decorFor(undefined).map((d) => d.key)).toEqual(['bulb', 'star', 'sparkles']);
  });
  it('has no duplicate props within a holiday', () => {
    for (const h of [...Object.keys(DECOR), undefined]) {
      const keys = decorFor(h).map((d) => d.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
  it('finds any prop by key', () => {
    expect(getDecor('deer')?.name).toBe('Reindeer');
    expect(getDecor('nope')).toBeUndefined();
  });
});

describe('cleanPlacements', () => {
  it('keeps only this holiday’s props and clamps positions and sizes', () => {
    const out = cleanPlacements([
      { kind: 'ghost', x: -1, y: 2, scale: 9 },
      { kind: 'mystery', x: 0.5, y: 0.5, scale: 1 },
      { kind: 'snowman', x: 0.5, y: 0.5, scale: 1 },
      { kind: 'bat', x: 0.33333, y: Number.NaN, scale: 1 },
      { kind: 'sparkles', x: 0.123456, y: 0.5, scale: 0.01 },
    ], 'Halloween');
    expect(out).toEqual([
      { kind: 'ghost', x: 0, y: 1, scale: MAX_SCALE },
      { kind: 'sparkles', x: 0.123, y: 0.5, scale: MIN_SCALE },
    ]);
  });
  it('caps how many props a house can have', () => {
    const many = Array.from({ length: MAX_DECOR + 5 }, () => ({ kind: 'ghost', x: 0.5, y: 0.5, scale: 1 }));
    expect(cleanPlacements(many, 'Halloween')).toHaveLength(MAX_DECOR);
  });
  it('hides props left over from another holiday', () => {
    expect(forHoliday([{ kind: 'ghost' }, { kind: 'tree' }], 'Christmas')).toEqual([{ kind: 'tree' }]);
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
