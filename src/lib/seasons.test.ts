import { describe, expect, it } from 'vitest';
import { contestToday, defaultSeason, openForSubmissions, phase, getSeason, visibleSeasons, addDays } from './seasons';

const halloween = getSeason('halloween-2026')!;
const keys = (list: { key: string }[]) => list.map((s) => s.key);

describe('phase', () => {
  it('walks a contest through its life', () => {
    expect(phase(halloween, '2026-09-30')).toBe('soon');
    expect(phase(halloween, '2026-10-01')).toBe('live');
    expect(phase(halloween, '2026-10-31')).toBe('live');
    expect(phase(halloween, '2026-11-01')).toBe('final');
    expect(phase(halloween, '2026-11-07')).toBe('final');
    expect(phase(halloween, '2026-11-08')).toBe('expired');
  });
});

describe('defaultSeason', () => {
  it('picks the upcoming holiday', () => {
    expect(defaultSeason('2026-10-26').key).toBe('halloween-2026');
    expect(defaultSeason('2026-10-31').key).toBe('halloween-2026');
    expect(defaultSeason('2026-11-01').key).toBe('christmas-2026');
    expect(defaultSeason('2026-12-28').key).toBe('july4-2027');
  });
});

describe('visibleSeasons', () => {
  it('keeps the last contest visible for one week after the holiday', () => {
    expect(keys(visibleSeasons('2026-11-03'))).toEqual(['christmas-2026', 'halloween-2026', 'july4-2027']);
    expect(keys(visibleSeasons('2026-11-09'))).toEqual(['christmas-2026', 'july4-2027']);
  });
});

describe('openForSubmissions', () => {
  it('accepts the live contest and the next one, never a finished one', () => {
    expect(keys(openForSubmissions('2026-10-26'))).toEqual(['halloween-2026', 'christmas-2026']);
    expect(keys(openForSubmissions('2026-11-03'))).toEqual(['christmas-2026', 'july4-2027']);
  });
});

describe('dates', () => {
  it('uses the Pacific calendar date', () => {
    // 2026-11-01 05:00 UTC is still Oct 31 in Portland
    expect(contestToday(new Date('2026-11-01T05:00:00Z'))).toBe('2026-10-31');
  });
  it('adds days across month ends', () => {
    expect(addDays('2026-12-25', 7)).toBe('2027-01-01');
  });
});
