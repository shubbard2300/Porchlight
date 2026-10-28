'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import type { FormState } from '@/lib/forms';
import { checkHookUrl, LIGHT_EVENTS, lightPayload } from '@/lib/porchLights';
import { callHook, newSecret } from '@/lib/porchLightServer';

/** The house if the signed-in user hosts it, else null. Admins don't get to point a stranger's lights. */
async function ownHouse(houseId: string) {
  const user = await requireUser(`/house/${houseId}/lights`);
  return db.house.findFirst({ where: { id: houseId, ownerId: user.id }, select: { id: true, name: true } });
}

export async function saveLights(houseId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const house = await ownHouse(houseId);
  if (!house) return { errors: { form: 'Only the host can set up this porch’s lights.' } };
  const checked = checkHookUrl(String(fd.get('url') ?? ''));
  if (!checked.ok) return { errors: { url: checked.error } };
  const flags = Object.fromEntries(LIGHT_EVENTS.map((e) => [e.flag, fd.get(e.flag) === 'on']));
  const data = { url: checked.url.toString(), enabled: fd.get('enabled') === 'on', ...flags };
  await db.porchTrigger.upsert({ where: { houseId }, create: { houseId, secret: newSecret(), ...data }, update: data });
  revalidatePath(`/house/${houseId}/lights`);
  return { message: 'Saved. Send a test flash to make sure it works.' };
}

export async function removeLights(houseId: string) {
  const house = await ownHouse(houseId);
  if (!house) return;
  await db.porchTrigger.deleteMany({ where: { houseId } });
  revalidatePath(`/house/${houseId}/lights`);
}

/** A fresh signing secret, for when the old one was shared somewhere it shouldn't be. */
export async function rotateLightsSecret(houseId: string) {
  const house = await ownHouse(houseId);
  if (!house) return;
  await db.porchTrigger.updateMany({ where: { houseId }, data: { secret: newSecret() } });
  revalidatePath(`/house/${houseId}/lights`);
}

/** Fires the hook right now, ignoring the cooldown and event switches, and reports what happened.
 *  It doesn't start the cooldown, so a real visitor right after a test still gets their flash. */
export async function testLights(houseId: string): Promise<string> {
  const house = await ownHouse(houseId);
  const t = house && await db.porchTrigger.findUnique({ where: { houseId } });
  if (!t) return 'Save a webhook link first.';
  const status = await callHook(t.url, t.secret, lightPayload('test', house.name, 'Porchlight test'));
  await db.porchTrigger.update({ where: { id: t.id }, data: { lastStatus: `${status} · test` } });
  revalidatePath(`/house/${houseId}/lights`);
  return status;
}
