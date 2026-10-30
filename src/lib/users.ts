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

const RESERVED = ['admin', 'administrator', 'porchlight', 'support', 'help', 'moderator', 'staff'];

/**
 * A starting username made from the email, so sign-up only needs an email and password.
 * "Sam.Rivera+lights@x.com" becomes "sam_rivera". People can change it on their profile.
 */
export function usernameFromEmail(email: string) {
  const base = email.split('@')[0].split('+')[0].toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 15).replace(/_+$/, '');
  return base.length >= 3 && !RESERVED.includes(base) ? base : 'neighbor';
}

/** The base name with a short number on the end, for when the base is taken. Stays within 20 characters. */
export const numberedUsername = (base: string, n: number) => `${base}_${n}`;
