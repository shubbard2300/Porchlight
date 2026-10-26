/**
 * Prints a one-time sign-in link for an existing account. Use it to get into the admin portal
 * before email delivery is set up:  npm run sign-in-link -- admin@example.com
 */
import { db } from '../src/lib/db';
import { issueToken, linkFor } from '../src/lib/tokens';

async function main() {
  const email = (process.argv[2] ?? '').trim().toLowerCase();
  if (!email) throw new Error('Usage: npm run sign-in-link -- you@example.com');
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No account for ${email}. Sign up first or run npm run db:seed.`);
  const raw = await issueToken(user.id, user.emailVerifiedAt ? 'LOGIN' : 'VERIFY', user.role === 'ADMIN' ? '/admin' : '/profile');
  console.log(linkFor(raw));
}

main().finally(() => db.$disconnect());
