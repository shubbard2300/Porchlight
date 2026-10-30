import 'server-only';
import { db } from './db';
import type { CommunityCounts } from './community';

/** Totals for one contest, counted across every approved house in it. */
export async function communityCounts(seasonKey: string): Promise<CommunityCounts> {
  const house = { season: seasonKey, status: 'APPROVED' as const };
  const [porches, checkIns, scorecards, visitors] = await Promise.all([
    db.house.count({ where: house }),
    db.checkIn.count({ where: { house } }),
    db.vote.count({ where: { house, verifiedAt: { not: null } } }),
    db.checkIn.findMany({ where: { house }, distinct: ['userId'], select: { userId: true } }),
  ]);
  return { porches, checkIns, scorecards, neighbors: visitors.length };
}

/** What one person has added to this contest, so the page can say "you're part of this". */
export async function myContribution(userId: string, seasonKey: string) {
  const house = { season: seasonKey, status: 'APPROVED' as const };
  const [porches, checkIns, scorecards] = await Promise.all([
    db.house.count({ where: { ...house, ownerId: userId } }),
    db.checkIn.count({ where: { userId, house } }),
    db.vote.count({ where: { userId, house, verifiedAt: { not: null } } }),
  ]);
  return { porches, checkIns, scorecards };
}
