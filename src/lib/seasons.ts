import { getHoliday, HOLIDAYS, shiftDays, SUBMISSION_LEAD_DAYS, type HolidayKey } from './holidays';

/**
 * Holiday contests and the rules for when each one is visible.
 *
 * - Which holidays run, and each contest's dates, come from Admin > Contest dates (a SeasonConfig),
 *   on top of the usual dates in holidays.ts.
 * - The app defaults to the upcoming holiday.
 * - Hosts can enter a house from `submitOpens` through `submitCloses`.
 * - Voting runs from `opens` through `closes` (usually the holiday itself, `day`).
 * - Viewers can still see final results for GRACE_DAYS after voting closes.
 * - After that the contest is expired for viewers and lives on only in each poster's archive.
 *
 * All dates are calendar dates in CONTEST_TIME_ZONE, compared as YYYY-MM-DD strings.
 */
export const CONTEST_TIME_ZONE = 'America/Los_Angeles';
export const GRACE_DAYS = 7;
/** The first contest year. Houses keep their season key forever, so every year since stays resolvable. */
export const FIRST_YEAR = 2026;

export type SeasonDates = { submitOpens: string; submitCloses: string; opens: string; closes: string };

export type Season = SeasonDates & {
  key: string;
  holiday: HolidayKey;
  name: string;
  year: number;
  /** The holiday itself. */
  day: string;
  color: string;
  /** Turned on by an admin. Off contests stay readable for old entries but are hidden and closed. */
  enabled: boolean;
};

/** What an admin saved. Anything missing falls back to the usual dates and on/off defaults. */
export type SeasonConfig = {
  enabled?: Partial<Record<HolidayKey, boolean>>;
  /** Date changes for one contest, by season key such as "christmas-2026". */
  dates?: Record<string, Partial<SeasonDates>>;
};

export type Phase = 'soon' | 'live' | 'final' | 'expired';

/** Today's date in the contest time zone, as YYYY-MM-DD. */
export function contestToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CONTEST_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export const addDays = shiftDays;

export const isYmd = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));

/** The usual dates for one holiday in one year, before any admin changes. */
export function usualDates(key: HolidayKey, year: number): (SeasonDates & { day: string }) | null {
  const h = getHoliday(key)!;
  const day = h.date(year);
  if (!day) return null;
  const opens = h.votingOpens(day, year);
  const closes = shiftDays(day, h.extraDays ?? 0);
  return { day, opens, closes, submitOpens: shiftDays(opens, -SUBMISSION_LEAD_DAYS), submitCloses: closes };
}

/** Every contest from FIRST_YEAR through next year, on or off, sorted by when voting closes. */
export function buildSeasons(config: SeasonConfig = {}, today: string = contestToday()): Season[] {
  const lastYear = Math.max(Number(today.slice(0, 4)) + 1, FIRST_YEAR + 1);
  const anyOn = HOLIDAYS.some((h) => config.enabled?.[h.key] ?? h.onByDefault);
  const list: Season[] = [];
  for (let year = FIRST_YEAR; year <= lastYear; year++) {
    for (const h of HOLIDAYS) {
      const usual = usualDates(h.key, year);
      if (!usual) continue;
      const key = `${h.key}-${year}`;
      const saved = config.dates?.[key] ?? {};
      const pick = (f: keyof SeasonDates) => (isYmd(saved[f]) ? saved[f]! : usual[f]);
      list.push({
        key, holiday: h.key, name: h.name, year, day: usual.day, color: h.color,
        submitOpens: pick('submitOpens'), submitCloses: pick('submitCloses'), opens: pick('opens'), closes: pick('closes'),
        // With everything switched off the site would have no contest at all, so the defaults come back.
        enabled: anyOn ? (config.enabled?.[h.key] ?? h.onByDefault) : h.onByDefault,
      });
    }
  }
  return list.sort((a, b) => a.closes.localeCompare(b.closes) || a.opens.localeCompare(b.opens));
}

export const viewableUntil = (s: Season) => addDays(s.closes, GRACE_DAYS);

export function phase(s: Season, today: string): Phase {
  if (today < s.opens) return 'soon';
  if (today <= s.closes) return 'live';
  if (today <= viewableUntil(s)) return 'final';
  return 'expired';
}

/** Problems with a set of dates, by field, in words an admin can act on. */
export function dateProblems(d: Partial<SeasonDates>): Partial<Record<keyof SeasonDates, string>> {
  const out: Partial<Record<keyof SeasonDates, string>> = {};
  for (const f of ['submitOpens', 'submitCloses', 'opens', 'closes'] as const) if (!isYmd(d[f])) out[f] = 'Pick a date.';
  if (Object.keys(out).length) return out;
  if (d.submitCloses! < d.submitOpens!) out.submitCloses = 'Entries have to close after they open.';
  if (d.closes! < d.opens!) out.closes = 'Voting has to close after it opens.';
  if (d.submitCloses! > d.closes!) out.submitCloses = 'Entries can’t stay open after voting closes.';
  return out;
}

/**
 * Season lookups over one list of contests. Server code gets one from `seasonCalendar()` in
 * seasonConfig.ts, so every page in a request agrees on the same admin settings.
 */
export function calendar(all: Season[]) {
  const live = all.filter((s) => s.enabled);
  /** Any contest, on or off, so old entries keep their holiday. */
  const getSeason = (key: string | null | undefined) => all.find((s) => s.key === key);
  /** The upcoming holiday: the first turned-on contest whose voting hasn't closed yet. */
  const defaultSeason = (today: string): Season =>
    live.find((s) => s.closes >= today) ?? live[live.length - 1] ?? all[all.length - 1];
  const nextAfter = (s: Season) => live[live.indexOf(s) + 1];
  /** What viewers can pick from: the default, any contest in its results week, and the one after the default. */
  const visibleSeasons = (today: string): Season[] => {
    const def = defaultSeason(today);
    const next = nextAfter(def);
    const finals = live.filter((s) => phase(s, today) === 'final');
    return [...new Set([def, ...finals, ...(next ? [next] : [])])];
  };
  /** Contests that accept new house submissions today. */
  const openForSubmissions = (today: string): Season[] =>
    live.filter((s) => s.submitOpens <= today && today <= s.submitCloses);
  return { all, getSeason, defaultSeason, visibleSeasons, openForSubmissions };
}

export type SeasonCalendar = ReturnType<typeof calendar>;

export function formatDay(ymd: string): string {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function phaseLabel(s: Season, today: string): { tag: string; line: string } {
  switch (phase(s, today)) {
    case 'soon': return { tag: today >= s.submitOpens && today <= s.submitCloses ? 'Submissions open' : 'Coming soon', line: `Voting opens ${formatDay(s.opens)}` };
    case 'live': return { tag: 'Voting live', line: `Closes ${formatDay(s.closes)} at midnight` };
    case 'final': return { tag: 'Final results', line: `Viewable until ${formatDay(viewableUntil(s))}` };
    default: return { tag: 'Archived', line: 'In posters’ archives' };
  }
}
