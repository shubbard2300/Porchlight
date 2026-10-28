import 'server-only';
import { db } from './db';

/** The caravan a user is rolling with right now, if any. */
export async function activeCaravanId(userId: string): Promise<string | null> {
  const m = await db.caravanMember.findFirst({
    where: { userId, leftAt: null, caravan: { endsAt: { gt: new Date() } } },
    orderBy: { joinedAt: 'desc' },
    select: { caravanId: true },
  });
  return m?.caravanId ?? null;
}

/** The active caravan with its current members, for the caravan page. */
export async function activeCaravan(userId: string) {
  const id = await activeCaravanId(userId);
  if (!id) return null;
  return db.caravan.findUnique({
    where: { id },
    include: {
      members: { where: { leftAt: null }, orderBy: { joinedAt: 'asc' }, include: { user: { select: { id: true, username: true, displayName: true, avatarUpdatedAt: true, xp: true } } } },
    },
  });
}
