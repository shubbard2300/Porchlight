'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { cleanPlacements, GREETING_MAX, MAX_DECOR } from '@/lib/arDecor';
import { isKind } from '@/lib/visits';

export type SaveArResult = { ok: true; count: number } | { ok: false; error: string };

const sceneSchema = z.object({
  placements: z.array(z.object({ kind: z.string().max(40), x: z.number(), y: z.number(), scale: z.number() })).max(MAX_DECOR * 2),
  greeting: z.string().trim().max(GREETING_MAX, `Keep the greeting under ${GREETING_MAX} characters.`),
});

/** Replaces a house's AR props and greeting. Only the host can decorate their own porch. */
export async function saveArScene(houseId: string, input: unknown): Promise<SaveArResult> {
  const user = await requireUser(`/house/${houseId}/ar/edit`);
  const house = await db.house.findFirst({ where: { id: houseId, ownerId: user.id }, select: { id: true } });
  if (!house) return { ok: false, error: 'Only the host can decorate this porch.' };
  const parsed = sceneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'That didn’t save. Try again.' };
  const greeting = parsed.data.greeting || null;
  if (greeting && !isKind(greeting)) return { ok: false, error: 'Keep the greeting friendly, it floats over your house for every visitor.' };
  const placements = cleanPlacements(parsed.data.placements);

  await db.$transaction([
    db.arDecoration.deleteMany({ where: { houseId } }),
    db.arDecoration.createMany({ data: placements.map((p, i) => ({ houseId, ...p, position: i })) }),
    db.house.update({ where: { id: houseId }, data: { arGreeting: greeting } }),
  ]);
  revalidatePath(`/house/${houseId}`);
  revalidatePath(`/house/${houseId}/ar`);
  return { ok: true, count: placements.length };
}
