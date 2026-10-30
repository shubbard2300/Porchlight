/**
 * The decorating holidays an admin can run a contest for, with the usual dates for each one.
 * Admins turn holidays on or off and can move any contest's dates on Admin > Contest dates;
 * everything here is only the starting point (see seasons.ts for how the two combine).
 */
export type HolidayKey =
  | 'valentines' | 'lunarnewyear' | 'stpatricks' | 'easter' | 'july4'
  | 'halloween' | 'diwali' | 'thanksgiving' | 'hanukkah' | 'christmas';

export type Holiday = {
  key: HolidayKey;
  name: string;
  color: string;
  /** On when nothing has been saved yet. Matches the contests Porchlight has always run. */
  onByDefault: boolean;
  /** The holiday itself, YYYY-MM-DD, or null when we don't know it for that year. */
  date: (year: number) => string | null;
  /** When voting usually opens, given the holiday date. */
  votingOpens: (day: string, year: number) => string;
  /** Extra days voting stays open after the holiday starts (Hanukkah runs eight nights). */
  extraDays?: number;
};

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export function shiftDays(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Western Easter Sunday (anonymous Gregorian algorithm). */
export function easterSunday(y: number): string {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(y, month, day);
}

/** Fourth Thursday of November. */
export function thanksgiving(y: number): string {
  const first = new Date(Date.UTC(y, 10, 1)).getUTCDay();
  return ymd(y, 11, 1 + ((4 - first + 7) % 7) + 21);
}

// Lunar and Hebrew calendar holidays move around; these are the US dates. Add years as they come up.
const LUNAR_NEW_YEAR: Record<number, string> = { 2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26', 2029: '2029-02-13', 2030: '2030-02-03' };
const DIWALI: Record<number, string> = { 2026: '2026-11-08', 2027: '2027-10-29', 2028: '2028-10-17', 2029: '2029-11-05', 2030: '2030-10-26' };
const HANUKKAH: Record<number, string> = { 2026: '2026-12-04', 2027: '2027-12-24', 2028: '2028-12-12', 2029: '2029-12-01', 2030: '2030-12-20' };

const twoWeeksBefore = (day: string) => shiftDays(day, -14);

/** In calendar order, which is also the order the admin screen lists them. */
export const HOLIDAYS: Holiday[] = [
  { key: 'valentines', name: "Valentine's Day", color: '#FF4F8B', onByDefault: false, date: (y) => ymd(y, 2, 14), votingOpens: (_, y) => ymd(y, 2, 1) },
  { key: 'lunarnewyear', name: 'Lunar New Year', color: '#E8364F', onByDefault: false, date: (y) => LUNAR_NEW_YEAR[y] ?? null, votingOpens: twoWeeksBefore },
  { key: 'stpatricks', name: "St. Patrick's Day", color: '#1FA45B', onByDefault: false, date: (y) => ymd(y, 3, 17), votingOpens: (_, y) => ymd(y, 3, 1) },
  { key: 'easter', name: 'Easter', color: '#B48CFF', onByDefault: false, date: easterSunday, votingOpens: twoWeeksBefore },
  { key: 'july4', name: 'Fourth of July', color: '#3D7BFF', onByDefault: true, date: (y) => ymd(y, 7, 4), votingOpens: (_, y) => ymd(y, 6, 1) },
  { key: 'halloween', name: 'Halloween', color: '#FF6A1F', onByDefault: true, date: (y) => ymd(y, 10, 31), votingOpens: (_, y) => ymd(y, 10, 1) },
  { key: 'diwali', name: 'Diwali', color: '#FFB020', onByDefault: false, date: (y) => DIWALI[y] ?? null, votingOpens: twoWeeksBefore },
  { key: 'thanksgiving', name: 'Thanksgiving', color: '#D9822B', onByDefault: false, date: thanksgiving, votingOpens: (_, y) => ymd(y, 11, 1) },
  { key: 'hanukkah', name: 'Hanukkah', color: '#4A8BFF', onByDefault: false, date: (y) => HANUKKAH[y] ?? null, votingOpens: twoWeeksBefore, extraDays: 7 },
  { key: 'christmas', name: 'Christmas', color: '#E8364F', onByDefault: true, date: (y) => ymd(y, 12, 25), votingOpens: (_, y) => ymd(y, 11, 1) },
];

export const getHoliday = (key: string | null | undefined) => HOLIDAYS.find((h) => h.key === key);

/** Days before voting opens that hosts can start entering their house. */
export const SUBMISSION_LEAD_DAYS = 30;
