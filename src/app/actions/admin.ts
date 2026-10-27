'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { APPROVAL_XP } from '@/lib/rewards';
import { requireAdmin } from '@/lib/auth';
import { appUrl, notifyAdmin, sendEmail } from '@/lib/email';
import type { FormState } from '@/lib/forms';
import { deleteHouse } from '@/lib/housePhotos';
import { deletePhotoFiles } from '@/lib/photoStorage';
import { getSeason } from '@/lib/seasons';
import { displayName } from '@/lib/users';
import { setSetting } from '@/lib/settings';
import { fieldErrors, settingsSchema } from '@/lib/validation';

export async function reviewHouse(id: string, choice: 'approve' | 'reject', rawNote: string) {
  await requireAdmin();
  const decision = choice === 'approve' ? 'APPROVED' : 'REJECTED';
  const note = String(rawNote ?? '').trim().slice(0, 500) || null;
  const before = await db.house.findUnique({ where: { id }, include: { owner: true } });
  if (!before) return;

  await db.house.update({ where: { id }, data: { status: decision, reviewNote: note, reviewedAt: new Date() } });
  if (decision === 'APPROVED' && before.status !== 'APPROVED') {
    await db.user.update({ where: { id: before.ownerId }, data: { xp: { increment: APPROVAL_XP } } });
  }
  const season = getSeason(before.season);
  await sendEmail({
    to: before.owner.email,
    kind: decision === 'APPROVED' ? 'approved' : 'rejected',
    subject: decision === 'APPROVED' ? `${before.name} is live on Porchlight` : `About your ${before.name} submission`,
    text: decision === 'APPROVED'
      ? [`Hi ${displayName(before.owner)},`, '', `${before.name} is now on the ${season?.name ?? ''} map. You earned ${APPROVAL_XP} XP and the Lamplighter badge.`, note ? `\nNote from the team: ${note}` : '', '', appUrl('/')].join('\n')
      : [`Hi ${displayName(before.owner)},`, '', `We couldn't publish ${before.name} yet.`, note ? `Reason: ${note}` : '', '', `You can post it again any time: ${appUrl('/submit')}`].join('\n'),
  });
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
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
    subject: `${house.name} was removed from Porchlight`,
    text: [`Hi ${displayName(house.owner)},`, '', `We removed ${house.name} from Porchlight.`, note ? `Reason: ${note}` : '', '', `You can post your house again any time: ${appUrl('/submit')}`].join('\n'),
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
  await notifyAdmin('Porchlight test email', `This is a test from Porchlight. If you can read this, form notifications reach this inbox.\n\n${appUrl('/admin/inbox')}`, 'test');
  revalidatePath('/admin', 'layout');
}
