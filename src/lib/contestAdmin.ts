import { HOLIDAYS } from './holidays';
import { viewableUntil, type Season } from './seasons';

/**
 * The contest per holiday that Admin > Contest dates edits: the next one still running or showing
 * results, soonest first. Later years start from the usual dates until they come up.
 */
export function editableSeasons(all: Season[], today: string): Season[] {
  return HOLIDAYS.flatMap((h) => {
    const next = all.filter((s) => s.holiday === h.key && viewableUntil(s) >= today).sort((a, b) => a.year - b.year)[0];
    return next ? [next] : [];
  }).sort((a, b) => a.closes.localeCompare(b.closes));
}
