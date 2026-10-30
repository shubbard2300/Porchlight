import 'server-only';
import { randomBytes, randomInt } from 'node:crypto';
import { db } from './db';
import { numberedUsername, usernameFromEmail } from './users';

export async function uniqueReferralCode() {
  for (;;) {
    const code = 'PORCH-' + randomBytes(3).toString('hex').toUpperCase();
    if (!(await db.user.findUnique({ where: { referralCode: code } }))) return code;
  }
}

/** The email's name if it's free, otherwise that name with a short number on the end. */
export async function uniqueUsername(email: string) {
  const base = usernameFromEmail(email);
  if (!(await db.user.findUnique({ where: { username: base }, select: { id: true } }))) return base;
  for (;;) {
    const name = numberedUsername(base, 1000 + randomInt(9000));
    if (!(await db.user.findUnique({ where: { username: name }, select: { id: true } }))) return name;
  }
}
