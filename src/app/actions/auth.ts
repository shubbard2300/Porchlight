'use server';

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { SIGNUP_BONUS_XP } from '@/lib/rewards';
import { endSession, isBootstrapAdmin, startSession } from '@/lib/auth';
import { appUrl, notifyAdmin, sendEmail } from '@/lib/email';
import { safeNext, type FormState } from '@/lib/forms';
import { fieldErrors, loginSchema, signupSchema } from '@/lib/validation';

async function uniqueReferralCode() {
  for (;;) {
    const code = 'PORCH-' + randomBytes(3).toString('hex').toUpperCase();
    if (!(await db.user.findUnique({ where: { referralCode: code } }))) return code;
  }
}

export async function signup(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  if (await db.user.findUnique({ where: { email: d.email } })) {
    return { errors: { email: 'An account with this email already exists. Try logging in instead.' } };
  }
  const referrer = d.referralCode ? await db.user.findUnique({ where: { referralCode: d.referralCode } }) : null;
  if (d.referralCode && !referrer) return { errors: { referralCode: "We couldn't find that invite code. Check it or leave it blank." } };

  const user = await db.user.create({
    data: {
      name: d.name,
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 12),
      role: isBootstrapAdmin(d.email) ? 'ADMIN' : 'USER',
      xp: SIGNUP_BONUS_XP,
      referralCode: await uniqueReferralCode(),
      referredById: referrer?.id,
      marketingOptIn: d.marketingOptIn,
    },
  });

  await notifyAdmin(
    `New sign-up: ${user.name}`,
    [
      `${user.name} <${user.email}> just created a Porchlight account.`,
      `Invited by: ${referrer ? `${referrer.name} <${referrer.email}>` : 'nobody'}`,
      `Email updates: ${user.marketingOptIn ? 'yes' : 'no'}`,
      '',
      `Manage users: ${appUrl('/admin/users')}`,
    ].join('\n'),
    'signup',
  );
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Porchlight',
    text: [
      `Hi ${user.name},`,
      '',
      `Your welcome gift is in: ${SIGNUP_BONUS_XP} XP and the Porch Pass badge.`,
      `Invite neighbors with your code ${user.referralCode}.`,
      '',
      `Find houses near you: ${appUrl('/')}`,
    ].join('\n'),
    kind: 'welcome',
  });

  await startSession({ userId: user.id, role: user.role });
  redirect(safeNext(fd.get('next')) ?? '/account?welcome=1');
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { errors: { form: 'That email and password don’t match. Check them and try again.' } };
  }
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession({ userId: user.id, role: user.role });
  redirect(safeNext(fd.get('next')) ?? (user.role === 'ADMIN' ? '/admin' : '/account'));
}

export async function logout() {
  await endSession();
  redirect('/');
}
