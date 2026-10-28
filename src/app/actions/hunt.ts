'use server';

import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { votableHouse } from '@/lib/checkIns';
import { critterFor } from '@/lib/hunt';
import { boostedXp } from '@/lib/pitstops';
import { AR_CATCH_XP } from '@/lib/rewards';
import { getSeason } from '@/lib/seasons';

export type CatchResult = { ok: true; xp: number; already: boolean } | { ok: false; error: string };

/** Records catching a house's AR critter. Only people who checked in at the house can catch it. */
export async function catchCritter(houseId: string): Promise<CatchResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: 'Log in to catch critters.' };
  const found = await votableHouse(houseId, user.id);
  if ('error' in found) return { ok: false, error: found.error };
  const checkedIn = await db.checkIn.findFirst({ where: { userId: user.id, houseId }, select: { id: true } });
  if (!checkedIn) return { ok: false, error: 'Check in at the house first, by location or the porch QR sign.' };

  const critter = critterFor(houseId, getSeason(found.house.season)?.name);
  const xp = boostedXp(AR_CATCH_XP, user.xpBoostUntil);
  try {
    await db.$transaction([
      db.arCatch.create({ data: { userId: user.id, houseId, season: found.house.season, critter: critter.key } }),
      db.user.update({ where: { id: user.id }, data: { xp: { increment: xp } } }),
    ]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return { ok: true, xp: 0, already: true };
    throw err;
  }
  // No revalidatePath: it would re-render the hunt page into its "already caught" state before the
  // celebration shows. Every page that lists catches is dynamic, so the next visit is fresh anyway.
  return { ok: true, xp, already: false };
}
