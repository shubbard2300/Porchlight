import { describe, expect, it } from 'vitest';
import { averageScore, distanceM, formatDistance, insideGeofence, isKind } from './visits';
import { porchCode, validPorchCode } from './porchCode';

const SECRET = 'x'.repeat(40);

describe('distanceM', () => {
  it('is zero for the same point', () => expect(distanceM({ lat: 45.5, lng: -122.6 }, { lat: 45.5, lng: -122.6 })).toBe(0));
  it('measures about 111 m per 0.001 degree of latitude', () => {
    expect(distanceM({ lat: 45.5, lng: -122.6 }, { lat: 45.501, lng: -122.6 })).toBeCloseTo(111.2, 0);
  });
});

describe('insideGeofence', () => {
  it('accepts a phone 140 m away', () => expect(insideGeofence(140)).toBe(true));
  it('rejects a phone 250 m away', () => expect(insideGeofence(250, 20)).toBe(false));
  it('allows up to 50 m of GPS slack', () => {
    expect(insideGeofence(190, 40)).toBe(true);
    expect(insideGeofence(210, 500)).toBe(false);
  });
});

describe('porch codes', () => {
  it('round-trips for the same house', () => expect(validPorchCode('h1', porchCode('h1', SECRET), SECRET)).toBe(true));
  it('rejects another house’s code', () => expect(validPorchCode('h2', porchCode('h1', SECRET), SECRET)).toBe(false));
  it('rejects missing or junk codes', () => {
    expect(validPorchCode('h1', null, SECRET)).toBe(false);
    expect(validPorchCode('h1', 'abc', SECRET)).toBe(false);
  });
});

describe('averageScore', () => {
  it('averages the filled-in categories', () => expect(averageScore({ creativity: 9, lighting: 8, storytelling: 7, sound: 5 })).toBe(7.3));
  it('is null with no scores', () => expect(averageScore({ creativity: null })).toBeNull());
});

it('formats distances', () => {
  expect(formatDistance(318)).toBe('320 m');
  expect(formatDistance(1420)).toBe('1.4 km');
});

it('flags put-downs but not praise', () => {
  expect(isKind('The skeleton band made my night!')).toBe(true);
  expect(isKind('Honestly kind of ugly')).toBe(false);
});
