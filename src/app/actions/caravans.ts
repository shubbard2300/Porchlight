'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { currentUser, requireUser } from '@/lib/auth';
import type { FormState } from '@/lib/forms';
import { CARAVAN_HOURS, MAX_MEMBERS, makeCode, normalizeCode } from '@/lib/caravans';
import { activeCaravanId } from '@/lib/caravanServer';
import { isKind } from '@/lib/visits';

/** Leaves whatever caravan the user is in, so they're only ever rolling with one. */
async function leaveActive(userId: string) {
  await db.caravanMember.updateMany({ where: { userId, leftAt: null }, data: { leftAt: new Date() } });
}

export async function startCaravan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { errors: { form: 'Log in to start a caravan.' } };
  const name = String(fd.get('name') ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 40) return { errors: { name: 'Give your caravan a name, up to 40 characters.' } };
  if (!isKind(name)) return { errors: { name: 'Pick a friendlier name. Squad names show on house pages.' } };

  await leaveActive(user.id);
  for (let tries = 0; ; tries++) {
    try {
      await db.caravan.create({
        data: {
          name, code: makeCode(), leaderId: user.id, endsAt: new Date(Date.now() + CARAVAN_HOURS * 3600_000),
          members: { create: { userId: user.id } },
        },
      });
      break;
    } catch (e) {
      // A code collision is astronomically rare; try a fresh code a couple of times.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') || tries >= 2) throw e;
    }
  }
  revalidatePath('/caravan');
  redirect('/caravan?started=1');
}

export async function joinCaravan(code: string) {
  const user = await requireUser(`/caravan/join?code=${encodeURIComponent(code)}`);
  const caravan = await db.caravan.findUnique({
    where: { code: normalizeCode(code) },
    include: { _count: { select: { members: { where: { leftAt: null } } } } },
  });
  if (!caravan || caravan.endsAt <= new Date()) redirect(`/caravan/join?code=${encodeURIComponent(code)}&error=ended`);
  const already = await db.caravanMember.findUnique({ where: { caravanId_userId: { caravanId: caravan.id, userId: user.id } } });
  if (already && !already.leftAt) redirect('/caravan');
  if (caravan._count.members >= MAX_MEMBERS) redirect(`/caravan/join?code=${encodeURIComponent(code)}&error=full`);

  await leaveActive(user.id);
  await db.caravanMember.upsert({
    where: { caravanId_userId: { caravanId: caravan.id, userId: user.id } },
    create: { caravanId: caravan.id, userId: user.id },
    update: { leftAt: null, joinedAt: new Date() },
  });
  revalidatePath('/caravan');
  redirect('/caravan?joined=1');
}

export async function leaveCaravan() {
  const user = await requireUser('/caravan');
  await leaveActive(user.id);
  revalidatePath('/caravan');
  redirect('/caravan');
}

/** The leader wraps up the night for everyone. */
export async function endCaravan() {
  const user = await requireUser('/caravan');
  const id = await activeCaravanId(user.id);
  if (id) await db.caravan.updateMany({ where: { id, leaderId: user.id }, data: { endsAt: new Date() } });
  revalidatePath('/caravan');
  redirect('/caravan?ended=1');
}
