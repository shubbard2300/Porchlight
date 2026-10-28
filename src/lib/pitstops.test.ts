import { expect, it } from 'vitest';
import { boostActive, boostedXp, nearestPitstop } from './pitstops';

const now = new Date('2026-10-28T03:00:00Z');

it('doubles XP only while a boost runs', () => {
  expect(boostedXp(10, new Date('2026-10-28T04:00:00Z'), now)).toBe(20);
  expect(boostedXp(10, new Date('2026-10-28T02:00:00Z'), now)).toBe(10);
  expect(boostedXp(10, null, now)).toBe(10);
  expect(boostActive(new Date('2026-10-28T03:00:01Z'), now)).toBe(true);
});

it('suggests the nearest pitstop, nudged toward higher tiers', () => {
  const home = { lat: 45.5, lng: -122.6 };
  const near = { id: 'bronze', tier: 'BRONZE' as const, lat: 45.501, lng: -122.6 }; // ~111 m
  const gold = { id: 'gold', tier: 'GOLD' as const, lat: 45.503, lng: -122.6 }; // ~334 m
  const far = { id: 'far', tier: 'GOLD' as const, lat: 45.6, lng: -122.6 };
  expect(nearestPitstop(home, [far, near, gold])?.id).toBe('gold');
  expect(nearestPitstop(home, [near, { id: 'x', tier: 'GOLD' as const, lat: 45.508, lng: -122.6 }])?.id).toBe('bronze');
  expect(nearestPitstop(home, [far])).toBeNull();
  expect(nearestPitstop(home, [{ id: 'unplaced', tier: 'GOLD' as const, lat: null, lng: null }])).toBeNull();
});
