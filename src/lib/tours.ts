/** The welcome tours. A viewer who becomes a host later gets the host tour too. */
export const TOURS = ['viewer', 'host'] as const;
export type Tour = (typeof TOURS)[number];

export const isTour = (v: unknown): v is Tour => TOURS.includes(v as Tour);

/** The tour someone should see next, if any: the one for their account type, once. */
export function pendingTour(u: { accountType: 'VIEWER' | 'HOST'; emailVerifiedAt: Date | null; toursDone: string[] }): Tour | null {
  if (!u.emailVerifiedAt) return null;
  const tour: Tour = u.accountType === 'HOST' ? 'host' : 'viewer';
  return u.toursDone.includes(tour) ? null : tour;
}
