import { CONTEST_TIME_ZONE } from './seasons';

/**
 * A host's "lights on" window, like "6 pm" to "Midnight", read in the contest time zone.
 * The map uses it to make a house glow while it's welcoming visitors and dim it the rest of the day.
 */

/** Minutes after midnight for a time like "6 pm", "4:30 pm", "10:15 am", "Noon" or "Midnight" (as 24:00). */
export function litMinutes(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (t === 'midnight') return 24 * 60;
  if (t === 'noon') return 12 * 60;
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m?\.?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h < 1 || h > 12 || min > 59) return null;
  return ((h % 12) + (m[3] === 'p' ? 12 : 0)) * 60 + min;
}

/** Minutes after midnight right now in the contest time zone. */
export function contestMinutes(now: Date = new Date(), timeZone = CONTEST_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return (get('hour') % 24) * 60 + get('minute');
}

/** Whether the lights are on at `minutes` after midnight. A window that ends before it starts runs past midnight. */
export function isLitAt(from: string, until: string, minutes: number): boolean {
  const start = litMinutes(from);
  const end = litMinutes(until);
  // Hours we can't read shouldn't make a house look closed.
  if (start === null || end === null) return true;
  if (start === end) return true;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

export const isLitNow = (from: string, until: string, now: Date = new Date()) => isLitAt(from, until, contestMinutes(now));
