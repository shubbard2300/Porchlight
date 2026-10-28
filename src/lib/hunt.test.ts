import { describe, expect, it } from 'vitest';
import { angleDiff, bearingFor, CRITTERS, critterFor, getCritter, screenX } from './hunt';

describe('hunt', () => {
  it('gives each house a stable critter from its holiday', () => {
    const c = critterFor('house-1', 'Halloween');
    expect(CRITTERS.Halloween).toContainEqual(c);
    expect(critterFor('house-1', 'Halloween')).toEqual(c);
    expect(critterFor('house-1', 'Arbor Day').key).toBe('glim');
    expect(getCritter(c.key)).toEqual(c);
  });

  it('spreads critters across a holiday set', () => {
    const keys = new Set(Array.from({ length: 60 }, (_, i) => critterFor(`h${i}`, 'Christmas').key));
    expect(keys.size).toBe(CRITTERS.Christmas.length);
  });

  it('hides each visitor’s critter in a stable direction', () => {
    const b = bearingFor('h1', 'u1');
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
    expect(bearingFor('h1', 'u1')).toBe(b);
  });

  it('measures turns the short way around', () => {
    expect(angleDiff(10, 350)).toBe(20);
    expect(angleDiff(350, 10)).toBe(-20);
    expect(angleDiff(180, 0)).toBe(-180);
  });

  it('places the critter on screen only inside the field of view', () => {
    expect(screenX(90, 90)).toBe(0.5);
    expect(screenX(105, 90)).toBe(0.75);
    expect(screenX(75, 90)).toBe(0.25);
    expect(screenX(130, 90)).toBeNull();
    expect(screenX(5, 355)).toBeCloseTo(0.6667, 3);
  });
});
