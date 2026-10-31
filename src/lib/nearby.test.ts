import { describe, expect, it } from 'vitest';
import { closestNearby, nearbyRadius, searchBox, snoozed, NEARBY_SNOOZE_HOURS } from './nearby';
import { distanceM } from './visits';

// 1e-4 degrees of latitude is about 11 m.
const me = { lat: 45.5152, lng: -122.6784 };
const at = (dLat: number, id = 'h') => ({ id, lat: me.lat + dLat, lng: me.lng });

describe('nearby houses', () => {
  it('picks a house out front and ignores one down the block', () => {
    expect(closestNearby([at(0.0002)], me, 8)?.id).toBe('h'); // ~22 m
    expect(closestNearby([at(0.0005)], me, 8)).toBeNull(); // ~56 m
  });

  it('picks the closest of several', () => {
    expect(closestNearby([at(0.0002, 'far'), at(0.0001, 'near')], me, 5)?.id).toBe('near');
  });

  it('ignores fuzzy fixes and missing accuracy', () => {
    expect(closestNearby([at(0.0001)], me, 80)).toBeNull();
    expect(closestNearby([at(0.0001)], me, null)).toBeNull();
  });

  it('adds only a little of the reported accuracy', () => {
    expect(nearbyRadius(3)).toBe(28);
    expect(nearbyRadius(30)).toBe(35);
  });

  it('skips houses without a pin', () => {
    expect(closestNearby([{ id: 'x', lat: null, lng: null }], me, 5)).toBeNull();
  });

  it('search box covers the radius', () => {
    const box = searchBox(me);
    expect(distanceM(me, { lat: box.lat.lte, lng: me.lng })).toBeGreaterThan(nearbyRadius(40));
    expect(distanceM(me, { lat: me.lat, lng: box.lng.lte })).toBeGreaterThan(nearbyRadius(40));
  });

  it('snoozes a dismissed house for a few hours', () => {
    const now = Date.now();
    expect(snoozed(now - 60_000, now)).toBe(true);
    expect(snoozed(now - (NEARBY_SNOOZE_HOURS + 1) * 3600_000, now)).toBe(false);
    expect(snoozed(undefined, now)).toBe(false);
  });
});
