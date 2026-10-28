import { describe, expect, it } from 'vitest';
import { clampRadius, isNearby, likeAlertDue, LIKE_ALERT_MINUTES } from './alerts';

describe('alerts', () => {
  const spot = { alertLat: 45.5152, alertLng: -122.6784, alertRadiusKm: 3 };

  it('finds houses inside the radius only', () => {
    expect(isNearby(spot, { lat: 45.53, lng: -122.66 })).toBe(true); // ~2 km
    expect(isNearby(spot, { lat: 45.6, lng: -122.6784 })).toBe(false); // ~9.4 km
    expect(isNearby({ ...spot, alertRadiusKm: 10 }, { lat: 45.6, lng: -122.6784 })).toBe(true);
  });

  it('skips people without a spot and houses without a pin', () => {
    expect(isNearby({ ...spot, alertLat: null }, { lat: 45.53, lng: -122.66 })).toBe(false);
    expect(isNearby(spot, { lat: null, lng: null })).toBe(false);
  });

  it('spaces out like alerts', () => {
    const now = new Date('2026-10-31T03:00:00Z');
    expect(likeAlertDue(null, now)).toBe(true);
    expect(likeAlertDue(new Date(now.getTime() - (LIKE_ALERT_MINUTES - 1) * 60_000), now)).toBe(false);
    expect(likeAlertDue(new Date(now.getTime() - LIKE_ALERT_MINUTES * 60_000), now)).toBe(true);
  });

  it('snaps radius to an allowed choice', () => {
    expect(clampRadius(4)).toBe(3);
    expect(clampRadius(50)).toBe(10);
    expect(clampRadius(0)).toBe(1);
    expect(clampRadius(Number.NaN)).toBe(3);
  });
});
