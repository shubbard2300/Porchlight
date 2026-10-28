'use server';

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import type { TokenPurpose, User } from '@prisma/client';
import { db } from '@/lib/db';
import { SIGNUP_BONUS_XP } from '@/lib/rewards';
import { applyBootstrapAdmin, endSession, isBootstrapAdmin, startSession } from '@/lib/auth';
import { appUrl, emailDeliveryConfigured, notifyAdmin, sendEmail } from '@/lib/email';
import { linkEmail, newMemberAdminEmail, welcomeEmail } from '@/lib/emails';
import { safeNext, type FormState } from '@/lib/forms';
import { consumeToken, issueToken, linkFor, sentRecently, TOKEN_TTL_MIN } from '@/lib/tokens';
import { displayName } from '@/lib/users';
import { emailOnlySchema, fieldErrors, joinSchema, loginSchema } from '@/lib/validation';

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

export async function join(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const existing = await db.user.findUnique({ where: { email: d.email } });
  const taken = await db.user.findUnique({ where: { username: d.username } });
  if (taken && taken.id !== existing?.id) return { errors: { username: 'That username is taken. Try another.' } };

  // Already verified: treat this as a sign-in rather than revealing that the account exists.
  if (existing?.emailVerifiedAt) return sendLink(existing, 'LOGIN', '/profile');

  const referrer = d.referralCode ? await db.user.findUnique({ where: { referralCode: d.referralCode } }) : null;
  if (d.referralCode && !referrer) return { errors: { referralCode: "We couldn't find that invite code. Check it or leave it blank." } };

  const profile = {
    username: d.username,
    passwordHash: await bcrypt.hash(d.password, BCRYPT_ROUNDS),
    accountType: d.accountType,
    propertyAddress: d.propertyAddress || null,
    marketingOptIn: d.marketingOptIn,
    referredById: referrer?.id,
  };
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: profile })
    : await db.user.create({
        data: { ...profile, email: d.email, xp: SIGNUP_BONUS_XP, referralCode: await uniqueReferralCode(), role: isBootstrapAdmin(d.email) ? 'ADMIN' : 'USER' },
      });
  return sendLink(user, 'VERIFY', '/profile?welcome=1');
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
  if (!user.emailVerifiedAt) return sendLink(user, 'VERIFY', '/profile?welcome=1');
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
  return sendLink(user, user.emailVerifiedAt ? 'LOGIN' : 'VERIFY', user.emailVerifiedAt ? next : '/profile?welcome=1');
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
