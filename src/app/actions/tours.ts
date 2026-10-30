'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { TOUR_XP } from '@/lib/rewards';
import { isTour } from '@/lib/tours';

/**
 * Marks a welcome tour as seen so it doesn't come back. Finishing it (rather than skipping) pays TOUR_XP,
 * once per tour. Returns the XP earned.
 */
export async function endTour(tour: string, finished: boolean): Promise<{ xp: number }> {
  const user = await requireUser();
  if (!isTour(tour) || user.toursDone.includes(tour)) return { xp: 0 };
  // Only the request that adds the tour pays, so a double tap can't pay twice.
  const { count } = await db.user.updateMany({
    where: { id: user.id, NOT: { toursDone: { has: tour } } },
    data: { toursDone: { push: tour }, ...(finished ? { xp: { increment: TOUR_XP } } : {}) },
  });
  revalidatePath('/', 'layout');
  return { xp: count && finished ? TOUR_XP : 0 };
}
