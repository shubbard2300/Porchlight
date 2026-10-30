'use server';

import bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'node:crypto';
import { redirect } from 'next/navigation';
import type { TokenPurpose, User } from '@prisma/client';
import { db } from '@/lib/db';
import { SIGNUP_BONUS_XP } from '@/lib/rewards';
import { applyBootstrapAdmin, endSession, isBootstrapAdmin, startSession } from '@/lib/auth';
import { appUrl, emailDeliveryConfigured, notifyAdmin, sendEmail } from '@/lib/email';
import { linkEmail, newMemberAdminEmail, welcomeEmail } from '@/lib/emails';
import { safeNext, type FormState } from '@/lib/forms';
import { consumeToken, issueToken, linkFor, sentRecently, TOKEN_TTL_MIN } from '@/lib/tokens';
import { MAX_PHOTO_BYTES, savePhoto } from '@/lib/housePhotos';
import { displayName, numberedUsername, usernameFromEmail } from '@/lib/users';
import { emailOnlySchema, fieldErrors, joinSchema, loginSchema, photoMetaSchema } from '@/lib/validation';

const BCRYPT_ROUNDS = 12;

async function uniqueReferralCode() {
  for (;;) {
    const code = 'PORCH-' + randomBytes(3).toString('hex').toUpperCase();
    if (!(await db.user.findUnique({ where: { referralCode: code } }))) return code;
  }
}

/** Emails a one-time link and sends the person to the "check your email" page. */
async function sendLink(user: User, purpose: TokenPurpose, next: string): Promise<never> {
  const checkEmail = `/check-email?email=${encodeURIComponent(user.email)}`;
  if (await sentRecently(user.id)) redirect(`${checkEmail}&wait=1`);

  const raw = await issueToken(user.id, purpose, next);
  const link = linkFor(raw);
  const verify = purpose === 'VERIFY';
  const sent = await sendEmail({
    to: user.email,
    kind: verify ? 'verify' : 'login',
    ...linkEmail({ name: displayName(user), verify, link, expires: verify ? '24 hours' : `${TOKEN_TTL_MIN.LOGIN} minutes` }),
  });

  // Local development without an email service: show the link on screen so the flow can be tested.
  const showLink = !emailDeliveryConfigured() && process.env.NODE_ENV !== 'production';
  if (showLink) redirect(`${checkEmail}&dev=${encodeURIComponent(link)}`);
  redirect(sent.status === 'failed' ? `${checkEmail}&failed=${encodeURIComponent(sent.code ?? 'error')}` : checkEmail);
}

/** Where a new member lands after confirming their email: hosts on the entry form, viewers on the map. */
const welcomePath = (accountType: 'VIEWER' | 'HOST') => (accountType === 'HOST' ? '/submit?welcome=1' : '/?welcome=1#map');

/** The email's name if it's free, otherwise that name with a short number on the end. */
async function uniqueUsername(email: string) {
  const base = usernameFromEmail(email);
  if (!(await db.user.findUnique({ where: { username: base }, select: { id: true } }))) return base;
  for (;;) {
    const name = numberedUsername(base, 1000 + randomInt(9000));
    if (!(await db.user.findUnique({ where: { username: name }, select: { id: true } }))) return name;
  }
}

/** A house photo picked on the host sign-up form. It waits, unattached, for the host's first entry. */
async function saveSignupPhoto(userId: string, fd: FormData): Promise<{ error?: string }> {
  const file = fd.get('photo');
  if (!(file instanceof File) || file.size === 0) return {};
  const meta = photoMetaSchema.safeParse(Object.fromEntries([...fd].filter(([k]) => ['width', 'height', 'lat', 'lng', 'locationSource', 'takenAt'].includes(k))));
  if (!meta.success) return { error: 'We could not read that photo. Remove it and try again, or add it after you sign up.' };
  const { houseId: _, ...m } = meta.data;
  return savePhoto(userId, file, m);
}

export async function join(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse(Object.fromEntries([...fd].filter(([, v]) => typeof v === 'string')));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const photo = fd.get('photo');
  if (photo instanceof File && photo.size > MAX_PHOTO_BYTES) return { errors: { photo: 'That photo is too large. Try one under 3 MB.' } };

  const existing = await db.user.findUnique({ where: { email: d.email } });
  // Already verified: treat this as a sign-in rather than revealing that the account exists.
  if (existing?.emailVerifiedAt) return sendLink(existing, 'LOGIN', '/profile');

  const referrer = d.referralCode ? await db.user.findUnique({ where: { referralCode: d.referralCode } }) : null;
  if (d.referralCode && !referrer) return { errors: { referralCode: "We couldn't find that invite code. Check it or leave it blank." } };

  const profile = {
    passwordHash: await bcrypt.hash(d.password, BCRYPT_ROUNDS),
    accountType: d.accountType,
    propertyAddress: d.propertyAddress || null,
    neighborhood: d.accountType === 'HOST' ? (String(fd.get('neighborhood') ?? '').trim().slice(0, 60) || null) : null,
    marketingOptIn: d.marketingOptIn,
    // Pressing "Create my account" under the agreement line is the acceptance.
    termsAcceptedAt: new Date(),
    referredById: referrer?.id,
  };
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: profile })
    : await db.user.create({
        data: { ...profile, email: d.email, username: await uniqueUsername(d.email), xp: SIGNUP_BONUS_XP, referralCode: await uniqueReferralCode(), role: isBootstrapAdmin(d.email) ? 'ADMIN' : 'USER' },
      });
  if (d.accountType === 'HOST') {
    const saved = await saveSignupPhoto(user.id, fd);
    if (saved.error) return { errors: { photo: saved.error } };
  }
  return sendLink(user, 'VERIFY', welcomePath(user.accountType));
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ok = Boolean(user?.passwordHash) && (await bcrypt.compare(parsed.data.password, user!.passwordHash!));
  if (!user || !ok) {
    return { errors: { form: 'That email and password don\u2019t match. Try again, or get a sign-in link by email.' } };
  }
  // Right password but the email was never confirmed: send the confirmation link again.
  if (!user.emailVerifiedAt) return sendLink(user, 'VERIFY', welcomePath(user.accountType));
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const signedIn = await applyBootstrapAdmin(user);
  await startSession({ userId: signedIn.id, role: signedIn.role });
  redirect(safeNext(fd.get('next')) ?? (signedIn.role === 'ADMIN' ? '/admin' : '/profile'));
}

export async function requestLoginLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const next = safeNext(fd.get('next')) ?? '/profile';
  // Same screen whether or not the account exists, so emails can't be probed.
  if (!user) redirect(`/check-email?email=${encodeURIComponent(parsed.data.email)}`);
  return sendLink(user, user.emailVerifiedAt ? 'LOGIN' : 'VERIFY', user.emailVerifiedAt ? next : welcomePath(user.accountType));
}

/** Runs when the person presses Continue on the link page. A POST, so email scanners that prefetch links can't use them up. */
export async function confirmLink(fd: FormData) {
  const t = await consumeToken(String(fd.get('token') ?? ''));
  if (!t) redirect('/auth/verify?error=expired');

  const firstTime = !t.user.emailVerifiedAt;
  const user = await db.user.update({
    where: { id: t.userId },
    data: { emailVerifiedAt: t.user.emailVerifiedAt ?? new Date(), lastLoginAt: new Date() },
    include: { referredBy: true },
  });

  if (firstTime) {
    const host = user.accountType === 'HOST';
    await notifyAdmin(
      newMemberAdminEmail(
        {
          username: user.username,
          email: user.email,
          host,
          propertyAddress: user.propertyAddress,
          invitedBy: user.referredBy ? `${user.referredBy.username} <${user.referredBy.email}>` : null,
          marketingOptIn: user.marketingOptIn,
        },
        appUrl,
      ),
      'signup',
      user.email,
    );
    await sendEmail({
      to: user.email,
      kind: 'welcome',
      ...welcomeEmail({ username: user.username, host, bonusXp: SIGNUP_BONUS_XP, referralCode: user.referralCode }, appUrl),
    });
  }

  const signedIn = await applyBootstrapAdmin(user);
  await startSession({ userId: signedIn.id, role: signedIn.role });
  redirect(safeNext(t.next) ?? '/profile');
}

export async function logout() {
  await endSession();
  redirect('/');
}
