import { describe, expect, it } from 'vitest';
import { easterSunday, thanksgiving } from './holidays';
import { addDays, buildSeasons, calendar, contestToday, dateProblems, phase, phaseLabel, type SeasonConfig } from './seasons';

const TODAY = '2026-10-26';
const cal = (config: SeasonConfig = {}, today = TODAY) => calendar(buildSeasons(config, today));
const { getSeason, defaultSeason, visibleSeasons, openForSubmissions } = cal();
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

describe('usual dates', () => {
  it('keeps the contests Porchlight has always run', () => {
    const christmas = getSeason('christmas-2026')!;
    expect(christmas).toMatchObject({ opens: '2026-11-01', closes: '2026-12-25', day: '2026-12-25', enabled: true });
    expect(getSeason('july4-2027')).toMatchObject({ opens: '2027-06-01', closes: '2027-07-04', enabled: true });
    expect(getSeason('diwali-2026')?.enabled).toBe(false);
  });
  it('lets hosts enter a month before voting opens, until voting closes', () => {
    expect(getSeason('christmas-2026')).toMatchObject({ submitOpens: '2026-10-02', submitCloses: '2026-12-25' });
  });
  it('works out holidays that move', () => {
    expect(easterSunday(2027)).toBe('2027-03-28');
    expect(easterSunday(2028)).toBe('2028-04-16');
    expect(thanksgiving(2026)).toBe('2026-11-26');
    expect(thanksgiving(2027)).toBe('2027-11-25');
    expect(getSeason('hanukkah-2026')).toMatchObject({ day: '2026-12-04', closes: '2026-12-11' });
  });
});

describe('defaultSeason', () => {
  it('picks the upcoming holiday', () => {
    expect(defaultSeason('2026-10-26').key).toBe('halloween-2026');
    expect(defaultSeason('2026-10-31').key).toBe('halloween-2026');
    expect(defaultSeason('2026-11-01').key).toBe('christmas-2026');
    expect(defaultSeason('2026-12-28').key).toBe('july4-2027');
  });
  it('skips holidays an admin turned off', () => {
    expect(cal({ enabled: { halloween: false } }).defaultSeason('2026-10-26').key).toBe('christmas-2026');
  });
  it('picks up holidays an admin turned on', () => {
    expect(cal({ enabled: { thanksgiving: true } }).defaultSeason('2026-11-03').key).toBe('thanksgiving-2026');
  });
  it('falls back to the usual contests when everything is off', () => {
    const off = Object.fromEntries(['july4', 'halloween', 'christmas'].map((k) => [k, false]));
    expect(cal({ enabled: off }).defaultSeason('2026-11-03').key).toBe('christmas-2026');
  });
});

describe('admin dates', () => {
  it('moves voting for one contest only', () => {
    const c = cal({ dates: { 'christmas-2026': { closes: '2026-12-31' } } });
    expect(c.getSeason('christmas-2026')).toMatchObject({ opens: '2026-11-01', closes: '2026-12-31' });
    expect(c.getSeason('christmas-2027')?.closes).toBe('2027-12-25');
    expect(phase(c.getSeason('christmas-2026')!, '2026-12-28')).toBe('live');
  });
  it('ignores dates that are not dates', () => {
    expect(cal({ dates: { 'christmas-2026': { opens: 'soon' } } }).getSeason('christmas-2026')?.opens).toBe('2026-11-01');
  });
  it('flags dates in the wrong order', () => {
    expect(dateProblems({ submitOpens: '2026-10-01', submitCloses: '2026-12-25', opens: '2026-11-01', closes: '2026-12-25' })).toEqual({});
    expect(dateProblems({ submitOpens: '2026-10-01', submitCloses: '2026-12-26', opens: '2026-11-01', closes: '2026-12-25' }).submitCloses).toBeTruthy();
    expect(dateProblems({ submitOpens: '2026-10-01', submitCloses: '2026-10-02', opens: '2026-11-01', closes: '2026-10-25' }).closes).toBeTruthy();
    expect(dateProblems({ opens: '' }).opens).toBe('Pick a date.');
  });
});

describe('visibleSeasons', () => {
  it('keeps the last contest visible for one week after the holiday', () => {
    expect(keys(visibleSeasons('2026-11-03'))).toEqual(['christmas-2026', 'halloween-2026', 'july4-2027']);
    expect(keys(visibleSeasons('2026-11-09'))).toEqual(['christmas-2026', 'july4-2027']);
  });
  it('hides turned-off contests', () => {
    expect(keys(cal({ enabled: { july4: false } }).visibleSeasons('2026-11-09'))).toEqual(['christmas-2026', 'halloween-2027']);
  });
});

describe('openForSubmissions', () => {
  it('follows the entry dates and never takes a finished contest', () => {
    expect(keys(openForSubmissions('2026-10-26'))).toEqual(['halloween-2026', 'christmas-2026']);
    expect(keys(openForSubmissions('2026-11-03'))).toEqual(['christmas-2026']);
    expect(keys(openForSubmissions('2027-05-10'))).toEqual(['july4-2027']);
  });
  it('labels a contest that is not taking entries yet', () => {
    expect(phaseLabel(getSeason('july4-2027')!, '2026-11-03').tag).toBe('Coming soon');
    expect(phaseLabel(getSeason('christmas-2026')!, '2026-10-26').tag).toBe('Submissions open');
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
