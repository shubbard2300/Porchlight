/**
 * Holiday contests and the rules for when each one is visible.
 *
 * - The app defaults to the upcoming holiday.
 * - Voting runs from `opens` through the end of the holiday (`day`).
 * - Viewers can still see final results for GRACE_DAYS after the holiday.
 * - After that the contest is expired for viewers and lives on only in each poster's archive.
 *
 * All dates are calendar dates in CONTEST_TIME_ZONE, compared as YYYY-MM-DD strings.
 */
export const CONTEST_TIME_ZONE = 'America/Los_Angeles';
export const GRACE_DAYS = 7;

export type Season = {
  key: string;
  name: string;
  year: number;
  opens: string;
  day: string;
  color: string;
};

export type Phase = 'soon' | 'live' | 'final' | 'expired';

export const SEASONS: Season[] = [
  { key: 'halloween-2026', name: 'Halloween', year: 2026, opens: '2026-10-01', day: '2026-10-31', color: '#FF6A1F' },
  { key: 'christmas-2026', name: 'Christmas', year: 2026, opens: '2026-11-01', day: '2026-12-25', color: '#E8364F' },
  { key: 'july4-2027', name: 'Fourth of July', year: 2027, opens: '2027-06-01', day: '2027-07-04', color: '#3D7BFF' },
  { key: 'halloween-2027', name: 'Halloween', year: 2027, opens: '2027-10-01', day: '2027-10-31', color: '#FF6A1F' },
  { key: 'christmas-2027', name: 'Christmas', year: 2027, opens: '2027-11-01', day: '2027-12-25', color: '#E8364F' },
];

/** Today's date in the contest time zone, as YYYY-MM-DD. */
export function contestToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CONTEST_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const viewableUntil = (s: Season) => addDays(s.day, GRACE_DAYS);

export function phase(s: Season, today: string): Phase {
  if (today < s.opens) return 'soon';
  if (today <= s.day) return 'live';
  if (today <= viewableUntil(s)) return 'final';
  return 'expired';
}

export function getSeason(key: string | null | undefined): Season | undefined {
  return SEASONS.find((s) => s.key === key);
}

/** The upcoming holiday: the first contest whose holiday is today or later. */
export function defaultSeason(today: string): Season {
  return SEASONS.find((s) => s.day >= today) ?? SEASONS[SEASONS.length - 1];
}

/** What viewers can pick from: the default, any contest in its results week, and the one after the default. */
export function visibleSeasons(today: string): Season[] {
  const def = defaultSeason(today);
  const next = SEASONS[SEASONS.indexOf(def) + 1];
  const finals = SEASONS.filter((s) => phase(s, today) === 'final');
  return [...new Set([def, ...finals, ...(next ? [next] : [])])];
}

/** Contests that accept new house submissions. */
export function openForSubmissions(today: string): Season[] {
  const def = defaultSeason(today);
  const next = SEASONS[SEASONS.indexOf(def) + 1];
  return [def, ...(next ? [next] : [])].filter((s) => {
    const p = phase(s, today);
    return p === 'soon' || p === 'live';
  });
}

export function formatDay(ymd: string): string {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function phaseLabel(s: Season, today: string): { tag: string; line: string } {
  switch (phase(s, today)) {
    case 'soon': return { tag: 'Submissions open', line: `Voting opens ${formatDay(s.opens)}` };
    case 'live': return { tag: 'Voting live', line: `Closes ${formatDay(s.day)} at midnight` };
    case 'final': return { tag: 'Final results', line: `Viewable until ${formatDay(viewableUntil(s))}` };
    default: return { tag: 'Archived', line: 'In posters’ archives' };
  }
}
