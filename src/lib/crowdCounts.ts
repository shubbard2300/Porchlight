import 'server-only';
import { db } from './db';
import { CROWD_WINDOW_MIN } from './crowd';

/** Distinct visitors who checked in at each house in the crowd window. Houses with nobody are left out. */
export async function crowdCounts(where: { houseIds: string[] } | { season: string }): Promise<Record<string, number>> {
  const rows = await db.checkIn.groupBy({
    by: ['houseId', 'userId'],
    where: {
      createdAt: { gte: new Date(Date.now() - CROWD_WINDOW_MIN * 60_000) },
      ...('houseIds' in where ? { houseId: { in: where.houseIds } } : { house: { season: where.season, status: 'APPROVED' } }),
    },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.houseId] = (counts[r.houseId] ?? 0) + 1;
  return counts;
}
