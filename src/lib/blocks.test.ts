import { describe, expect, it } from 'vitest';
import { circleRing, inBlock } from './blocks';
import { distanceM } from './visits';

const block = { lat: 45.52, lng: -122.68, radiusM: 400 };

describe('anchor blocks', () => {
  it('includes pins inside the radius only', () => {
    expect(inBlock(block, { lat: 45.522, lng: -122.68 })).toBe(true); // ~220 m
    expect(inBlock(block, { lat: 45.525, lng: -122.68 })).toBe(false); // ~560 m
  });

  it('draws a closed ring at the right distance', () => {
    const ring = circleRing(block, 32);
    expect(ring).toHaveLength(33);
    expect(ring[0]).toEqual(ring[32]);
    for (const [lng, lat] of ring.slice(0, 32)) {
      expect(Math.abs(distanceM(block, { lat, lng }) - 400)).toBeLessThan(5);
    }
  });
});
