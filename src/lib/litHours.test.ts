import { describe, expect, it } from 'vitest';
import { contestMinutes, isLitAt, litMinutes } from './litHours';

describe('litMinutes', () => {
  it('reads the times the forms offer', () => {
    expect(litMinutes('4:30 pm')).toBe(16 * 60 + 30);
    expect(litMinutes('6 pm')).toBe(18 * 60);
    expect(litMinutes('9 PM')).toBe(21 * 60);
    expect(litMinutes('Midnight')).toBe(24 * 60);
    expect(litMinutes('12 am')).toBe(0);
    expect(litMinutes('Noon')).toBe(12 * 60);
    expect(litMinutes('7pm')).toBe(19 * 60);
  });

  it('gives up on anything else', () => {
    expect(litMinutes('dusk')).toBeNull();
    expect(litMinutes('13 pm')).toBeNull();
  });
});

describe('isLitAt', () => {
  it('is on inside the window and off outside it', () => {
    expect(isLitAt('6 pm', '10 pm', 18 * 60)).toBe(true);
    expect(isLitAt('6 pm', '10 pm', 21 * 60 + 59)).toBe(true);
    expect(isLitAt('6 pm', '10 pm', 22 * 60)).toBe(false);
    expect(isLitAt('6 pm', '10 pm', 12 * 60)).toBe(false);
  });

  it('runs up to midnight', () => {
    expect(isLitAt('7 pm', 'Midnight', 23 * 60 + 59)).toBe(true);
    expect(isLitAt('7 pm', 'Midnight', 0)).toBe(false);
  });

  it('wraps a window that ends after midnight', () => {
    expect(isLitAt('8 pm', '1 am', 30)).toBe(true);
    expect(isLitAt('8 pm', '1 am', 2 * 60)).toBe(false);
  });

  it('keeps a house glowing when its hours cannot be read', () => {
    expect(isLitAt('dusk', 'late', 12 * 60)).toBe(true);
  });
});

describe('contestMinutes', () => {
  it('reads the clock in the contest time zone', () => {
    // 03:30 UTC on Oct 31 is 8:30 pm the evening before in Portland (PDT).
    expect(contestMinutes(new Date('2026-10-31T03:30:00Z'))).toBe(20 * 60 + 30);
  });
});
