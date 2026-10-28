import { describe, expect, it } from 'vitest';
import { addPitstop, googleRouteUrl, houseValue, planRoute, travelMin } from './routeWeaver';

const start = { lat: 45.52, lng: -122.68 };
// About 300 m apart going east.
const house = (id: string, i: number, value = 3) => ({ id, lat: 45.52, lng: -122.68 + 0.004 * i, value });

describe('route weaver', () => {
  it('estimates travel time from distance', () => {
    const t = travelMin(start, { lat: 45.53, lng: -122.68 }, 'walking');
    expect(t).toBeGreaterThan(18);
    expect(t).toBeLessThan(22);
  });

  it('values liked, well-scored houses more', () => {
    expect(houseValue({ likes: 5, avgScore: 9 })).toBeGreaterThan(houseValue({ likes: 0, avgScore: null }));
  });

  it('fits the loop in the time budget and returns to the start', () => {
    const plan = planRoute(start, [1, 2, 3, 4, 5, 6].map((i) => house(`h${i}`, i)), 30, 'walking');
    expect(plan.totalMin).toBeLessThanOrEqual(30);
    expect(plan.stops.length).toBeGreaterThan(0);
    expect(plan.stops.length).toBeLessThan(6);
  });

  it('prefers a far favorite over nothing but skips houses out of reach', () => {
    const far = { id: 'far', lat: 46.5, lng: -122.68, value: 100 };
    const plan = planRoute(start, [far, house('near', 1)], 60, 'driving');
    expect(plan.stops.map((s) => s.id)).toEqual(['near']);
  });

  it('orders stops so the loop does not zigzag', () => {
    const plan = planRoute(start, [house('c', 3), house('a', 1), house('b', 2)], 120, 'walking');
    const ids = plan.stops.map((s) => s.id).join('');
    expect(['abc', 'cba']).toContain(ids);
  });

  it('caps the number of stops', () => {
    const plan = planRoute(start, Array.from({ length: 20 }, (_, i) => house(`h${i}`, (i % 5) * 0.1)), 600, 'driving', 4);
    expect(plan.stops).toHaveLength(4);
  });

  it('adds a pitstop only when it still fits', () => {
    const stops = [house('a', 1), house('b', 2)];
    const shop = { lat: 45.5205, lng: -122.6725 };
    expect(addPitstop(start, stops, [shop], 120, 'walking').pitstop).toBe(shop);
    expect(addPitstop(start, stops, [{ lat: 46, lng: -122.68 }], 120, 'walking').pitstop).toBeNull();
  });

  it('builds a Google Maps loop link', () => {
    const url = new URL(googleRouteUrl(start, [house('a', 1)], 'walking'));
    expect(url.searchParams.get('origin')).toBe('45.52000,-122.68000');
    expect(url.searchParams.get('destination')).toBe('45.52000,-122.68000');
    expect(url.searchParams.get('waypoints')).toBe('45.52000,-122.67600');
    expect(url.searchParams.get('travelmode')).toBe('walking');
  });
});
