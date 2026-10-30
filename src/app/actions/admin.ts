'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { alertNearbyHouse } from '@/lib/alertTriggers';
import { db } from '@/lib/db';
import { APPROVAL_XP, SIGNUP_BONUS_XP } from '@/lib/rewards';
import { isBootstrapAdmin, requireAdmin, requireSuperAdmin } from '@/lib/auth';
import { appUrl, notifyAdmin, sendEmail } from '@/lib/email';
import { approvedEmail, inviteEmail, rejectedEmail, removedEmail, testAdminEmail } from '@/lib/emails';
import { geocodeAddress } from '@/lib/geocode';
import type { FormState } from '@/lib/forms';
import { deleteHouse } from '@/lib/housePhotos';
import { uniqueReferralCode, uniqueUsername } from '@/lib/newUser';
import { deletePhotoFiles } from '@/lib/photoStorage';
import { deleteBlocked, isAccessLevel, isStaff, levelData, levelLabel, roleChangeBlocked } from '@/lib/roles';
import { seasonCalendar } from '@/lib/seasonConfig';
import { dollars } from '@/lib/pot';
import { stripeConfigured } from '@/lib/stripe';
import { displayName } from '@/lib/users';
import { setSetting } from '@/lib/settings';
import { issueToken, linkFor } from '@/lib/tokens';
import { addUserSchema, fieldErrors, settingsSchema } from '@/lib/validation';

export async function reviewHouse(id: string, choice: 'approve' | 'reject', rawNote: string) {
  const { getSeason } = await seasonCalendar();
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

/** Counts Super Admins, for the "keep at least one" rule. */
const superAdminCount = () => db.user.count({ where: { role: 'ADMIN' } });
const usersPage = (note: string) => redirect(`/admin/users?note=${note}`);

/** A Super Admin changes anyone's access level; an Editor switches members between Author and Viewer. */
export async function setAccessLevel(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get('id'));
  const to = fd.get('level');
  if (!isAccessLevel(to)) return;
  const target = await db.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } });
  if (!target) return;
  const blocked = roleChangeBlocked(admin, { id, role: target.role, owner: isBootstrapAdmin(target.email) }, to, await superAdminCount());
  if (blocked) usersPage(blocked);
  await db.user.update({ where: { id }, data: levelData(to) });
  revalidatePath('/admin', 'layout');
  usersPage('saved');
}

export async function deleteUser(fd: FormData) {
  const admin = await requireSuperAdmin();
  const id = String(fd.get('id'));
  if (fd.get('confirm') !== 'on') return;
  const target = await db.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } });
  if (!target) return;
  const blocked = deleteBlocked(admin.id, { id, role: target.role, owner: isBootstrapAdmin(target.email) }, await superAdminCount());
  if (blocked) usersPage(blocked);
  const photos = await db.housePhoto.findMany({ where: { ownerId: id }, select: { blobUrl: true } });
  await db.user.delete({ where: { id } });
  await deletePhotoFiles(photos.map((p) => p.blobUrl));
  revalidatePath('/admin', 'layout');
  usersPage('deleted');
}

/** A Super Admin adds someone by email. They get an invite link that confirms the email and signs them in. */
export async function addUser(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperAdmin();
  const parsed = addUserSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { email, level } = parsed.data;
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { errors: { email: 'That email already has an account. Find it in the list below to change its access.' } };
  }
  const { role, accountType } = levelData(isBootstrapAdmin(email) ? 'SUPER_ADMIN' : level);
  const user = await db.user.create({
    data: { email, role, accountType: accountType ?? 'VIEWER', username: await uniqueUsername(email), xp: SIGNUP_BONUS_XP, referralCode: await uniqueReferralCode() },
  });
  const staff = isStaff(role);
  const link = linkFor(await issueToken(user.id, 'VERIFY', staff ? '/admin' : user.accountType === 'HOST' ? '/submit?welcome=1' : '/?welcome=1#map'));
  const label = levelLabel(level);
  const sent = await sendEmail({ to: email, kind: 'invite', ...inviteEmail({ invitedBy: displayName(admin), level: label, staff, link, expires: '24 hours' }) });
  revalidatePath('/admin/users');
  if (sent.status === 'failed') return { message: `Added ${email} as ${label}, but the invite email didn’t send (${sent.code ?? 'error'}). They can still get a link from the sign-in page.` };
  if (sent.status === 'skipped') return { message: `Added ${email} as ${label}. Email delivery is off, so the invite is only in the Form inbox.` };
  return { message: `Added ${email} as ${label}. We emailed them an invite link.` };
}

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await setSetting('notificationEmail', parsed.data.notificationEmail);
  if (parsed.data.emailFrom) await setSetting('emailFrom', parsed.data.emailFrom);
  await setSetting('replyTo', parsed.data.replyTo ?? '');
  revalidatePath('/admin/settings');
  return { message: 'Saved. New form notifications will go to ' + parsed.data.notificationEmail + '.' };
}

export async function sendTestEmail() {
  await requireSuperAdmin();
  await notifyAdmin(testAdminEmail(appUrl), 'test');
  revalidatePath('/admin', 'layout');
}
