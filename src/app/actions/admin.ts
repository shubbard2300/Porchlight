'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { alertNearbyHouse } from '@/lib/alertTriggers';
import { db } from '@/lib/db';
import { APPROVAL_XP } from '@/lib/rewards';
import { requireAdmin } from '@/lib/auth';
import { appUrl, notifyAdmin, sendEmail } from '@/lib/email';
import { approvedEmail, rejectedEmail, removedEmail, testAdminEmail } from '@/lib/emails';
import { geocodeAddress } from '@/lib/geocode';
import type { FormState } from '@/lib/forms';
import { deleteHouse } from '@/lib/housePhotos';
import { deletePhotoFiles } from '@/lib/photoStorage';
import { getSeason } from '@/lib/seasons';
import { dollars } from '@/lib/pot';
import { stripeConfigured } from '@/lib/stripe';
import { displayName } from '@/lib/users';
import { setSetting } from '@/lib/settings';
import { fieldErrors, settingsSchema } from '@/lib/validation';

export async function reviewHouse(id: string, choice: 'approve' | 'reject', rawNote: string) {
  await requireAdmin();
  const decision = choice === 'approve' ? 'APPROVED' : 'REJECTED';
  const note = String(rawNote ?? '').trim().slice(0, 500) || null;
  const before = await db.house.findUnique({ where: { id }, include: { owner: true } });
  if (!before) return;

  // A house going live without a pin (no photo location, address lookup failed at submit) gets one more try.
  const spot = decision === 'APPROVED' && before.lat === null ? await geocodeAddress(before.address) : null;
  await db.house.update({ where: { id }, data: { status: decision, reviewNote: note, reviewedAt: new Date(), ...spot } });
  if (decision === 'APPROVED' && before.status !== 'APPROVED') {
    await db.user.update({ where: { id: before.ownerId }, data: { xp: { increment: APPROVAL_XP } } });
    after(() => alertNearbyHouse(id).catch((e) => console.error('[push] nearby alert', e)));
  }
  const season = getSeason(before.season);
  await sendEmail({
    to: before.owner.email,
    kind: decision === 'APPROVED' ? 'approved' : 'rejected',
    ...(decision === 'APPROVED'
      ? approvedEmail({ name: displayName(before.owner), house: before.name, season: season?.name ?? '', xp: APPROVAL_XP, note, pledge: stripeConfigured() && before.contributionCents > 0 ? dollars(before.contributionCents) : null }, appUrl)
      : rejectedEmail({ name: displayName(before.owner), house: before.name, note }, appUrl)),
  });
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
}

/** Looks the address up again for a house that has no map pin yet. */
export async function placeHousePin(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const house = await db.house.findUnique({ where: { id }, select: { address: true, lat: true } });
  if (!house) return { ok: false };
  if (house.lat !== null) return { ok: true };
  const spot = await geocodeAddress(house.address);
  if (!spot) return { ok: false };
  await db.house.update({ where: { id }, data: spot });
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
  return { ok: true };
}

/** Removes any entry for good. The host gets an email, with the note if the admin wrote one. */
export async function removeHouse(id: string, rawNote: string) {
  await requireAdmin();
  const note = String(rawNote ?? '').trim().slice(0, 500) || null;
  const house = await db.house.findUnique({ where: { id }, include: { owner: true } });
  if (!house) return;
  await deleteHouse(id);
  await sendEmail({
    to: house.owner.email,
    kind: 'removed',
    ...removedEmail({ name: displayName(house.owner), house: house.name, note }, appUrl),
  });
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
}

export async function setRole(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get('id'));
  if (id === admin.id) return; // admins can't demote themselves and lock everyone out
  await db.user.update({ where: { id }, data: { role: fd.get('role') === 'ADMIN' ? 'ADMIN' : 'USER' } });
  revalidatePath('/admin/users');
}

export async function deleteUser(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get('id'));
  if (id === admin.id || fd.get('confirm') !== 'on') return;
  const photos = await db.housePhoto.findMany({ where: { ownerId: id }, select: { blobUrl: true } });
  await db.user.delete({ where: { id } });
  await deletePhotoFiles(photos.map((p) => p.blobUrl));
  revalidatePath('/admin', 'layout');
}

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await setSetting('notificationEmail', parsed.data.notificationEmail);
  if (parsed.data.emailFrom) await setSetting('emailFrom', parsed.data.emailFrom);
  await setSetting('replyTo', parsed.data.replyTo ?? '');
  revalidatePath('/admin/settings');
  return { message: 'Saved. New form notifications will go to ' + parsed.data.notificationEmail + '.' };
}

export async function sendTestEmail() {
  await requireAdmin();
  await notifyAdmin(testAdminEmail(appUrl), 'test');
  revalidatePath('/admin', 'layout');
}
