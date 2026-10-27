import type { User } from '@prisma/client';

/** The name to greet someone by. */
export const displayName = (u: Pick<User, 'displayName' | 'username'>) => u.displayName || u.username;

export const avatarUrl = (u: Pick<User, 'id' | 'avatarUpdatedAt'>) =>
  u.avatarUpdatedAt ? `/avatar/${u.id}?v=${u.avatarUpdatedAt.getTime()}` : null;

export const LEVELS: [number, string][] = [[0, 'Candle'], [150, 'Lantern'], [400, 'Porchlight'], [800, 'Beacon'], [1400, 'Lighthouse'], [2200, 'Aurora']];

export function level(xp: number) {
  const i = LEVELS.filter(([t]) => xp >= t).length - 1;
  return { number: i + 1, name: LEVELS[i][1], next: LEVELS[i + 1] ?? null };
}
