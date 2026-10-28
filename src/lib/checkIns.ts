import 'server-only';
import type { CheckInMethod, House } from '@prisma/client';
import { db } from './db';
import { CHECKIN_XP } from './rewards';
import { boostedXp } from './pitstops';
import { contestToday, getSeason, phase } from './seasons';
import { CHECKIN_REPEAT_HOURS } from './visits';

export function votingOpen(seasonKey: string) {
  const s = getSeason(seasonKey);
  return Boolean(s && phase(s, contestToday()) === 'live');
}

/** The house, if this person may check in and vote there right now; otherwise a reason they can't. */
export async function votableHouse(houseId: string, userId: string): Promise<{ house: House } | { code: 'missing' | 'own' | 'closed'; error: string }> {
  const house = await db.house.findUnique({ where: { id: houseId } });
  if (!house || house.status !== 'APPROVED') return { code: 'missing', error: 'That house isn’t in the contest.' };
  if (house.ownerId === userId) return { code: 'own', error: 'This is your own house, so you can’t vote for it. Share your porch sign instead!' };
  if (!votingOpen(house.season)) return { code: 'closed', error: 'Voting for this contest isn’t open right now.' };
  return { house };
}

/**
 * Records a check-in. Repeat check-ins within a few hours reuse the earlier one so the crowd meter
 * isn't inflated by someone tapping the button twice. The first check-in at a house earns XP.
 */
export async function recordCheckIn(userId: string, houseId: string, method: CheckInMethod, distanceM: number | null) {
  const recent = await db.checkIn.findFirst({
    where: { userId, houseId, createdAt: { gte: new Date(Date.now() - CHECKIN_REPEAT_HOURS * 3600_000) } },
  });
  if (recent) return { first: false };
  const before = await db.checkIn.count({ where: { userId, houseId } });
  const visitor = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { xpBoostUntil: true } });
  await db.$transaction([
    db.checkIn.create({ data: { userId, houseId, method, distanceM } }),
    ...(before === 0 ? [db.user.update({ where: { id: userId }, data: { xp: { increment: boostedXp(CHECKIN_XP, visitor.xpBoostUntil) } } })] : []),
  ]);
  return { first: before === 0 };
}
