import { randomInt } from 'node:crypto';
import { averageScore, SCORE_CATEGORIES, type ScoreKey } from './visits';

/** A caravan lasts one night out. */
export const CARAVAN_HOURS = 12;
export const MAX_MEMBERS = 12;
export { SQUAD_BONUS_XP, SQUAD_WINDOW_MIN } from './rewards';
/** A house needs this many squad scorecards before the squad's review shows on it. */
export const MIN_SQUAD_REVIEWERS = 2;

// No 0/O or 1/I/L, so codes read cleanly off a phone screen.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function makeCode(length = 6): string {
  return Array.from({ length }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');
}
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

type Scorecard = { liked: boolean; comment: string | null } & Record<ScoreKey, number | null>;

/** Rolls a squad's scorecards for one house into a single review. */
export function squadReview(votes: Scorecard[]) {
  const avg = Object.fromEntries(SCORE_CATEGORIES.map((c) => {
    const xs = votes.map((v) => v[c.key]).filter((x): x is number => typeof x === 'number');
    return [c.key, xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null];
  })) as Record<ScoreKey, number | null>;
  const ranked = SCORE_CATEGORIES.map((c) => ({ ...c, v: avg[c.key] })).filter((c) => c.v !== null).sort((a, b) => b.v! - a.v!);
  // Only name a favorite when one category actually stands out.
  const top = ranked[0] && (ranked.length === 1 || ranked[0].v! > ranked[1].v!) ? ranked[0] : null;
  return {
    reviewers: votes.length,
    likes: votes.filter((v) => v.liked).length,
    overall: averageScore(avg),
    scores: avg,
    favorite: top?.label ?? null,
    cheers: votes.map((v) => v.comment).filter((c): c is string => Boolean(c)),
  };
}
