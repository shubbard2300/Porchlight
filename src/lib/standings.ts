/**
 * Contest order: most verified likes wins (that's what the pot rules promise). Ties go to the
 * higher average scorecard, then to whoever entered first.
 */
export type Rankable = { likes: number; avgScore: number | null; createdAt: Date };

export function rankHouses<T extends Rankable>(houses: T[]): T[] {
  return [...houses].sort((a, b) =>
    b.likes - a.likes
    || (b.avgScore ?? -1) - (a.avgScore ?? -1)
    || a.createdAt.getTime() - b.createdAt.getTime());
}
