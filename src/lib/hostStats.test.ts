import { describe, expect, it } from 'vitest';
import { checkInsByHour, hourLabel, milesTraveledTo } from './hostStats';
import { crowdLevel, crowdLine } from './crowd';

it('buckets check-ins by local hour', () => {
  // 03:30 UTC on Oct 28 is 8:30 pm the evening before in Los Angeles.
  const hours = checkInsByHour([new Date('2026-10-28T03:30:00Z'), new Date('2026-10-28T03:59:00Z'), new Date('2026-10-28T04:10:00Z')]);
  expect(hours[20]).toBe(2);
  expect(hours[21]).toBe(1);
  expect(hourLabel(20)).toBe('8 pm');
  expect(hourLabel(0)).toBe('12 am');
});

describe('milesTraveledTo', () => {
  const at = (userId: string, houseId: string, iso: string, lat: number) => ({ userId, houseId, createdAt: new Date(iso), lat, lng: -122.6 });
  it('adds the hop from each guest’s previous stop on the same outing', () => {
    const visits = [
      at('a', 'x', '2026-10-28T02:00:00Z', 45.5), at('a', 'me', '2026-10-28T02:30:00Z', 45.5145), // ~1 mile north
      at('b', 'me', '2026-10-28T02:00:00Z', 45.5145), // came straight here
      at('c', 'y', '2026-10-20T02:00:00Z', 45.5), at('c', 'me', '2026-10-28T02:00:00Z', 45.5145), // different night
    ];
    expect(milesTraveledTo('me', visits)).toBe(1);
  });
});

it('maps visitor counts to crowd levels', () => {
  expect([0, 1, 4, 10].map(crowdLevel)).toEqual(['quiet', 'lively', 'busy', 'packed']);
  expect(crowdLine(1)).toBe('Lively: 1 visitor in the last 30 min');
});
