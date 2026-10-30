import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { isStaff } from './roles';
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type Session } from './token';

export async function startSession(session: Session) {
  const token = await signSession(session);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in user, loaded fresh from the database so role changes apply immediately. */
export async function currentUser() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  // The owner's account (ADMIN_EMAILS) is always Super Admin, even if it was changed in the database.
  return user && applyBootstrapAdmin(user);
}

export async function requireUser(next = '/') {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** The admin portal and content tools: Super Admins and Editors. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin');
  if (!isStaff(user.role)) redirect('/');
  return user;
}

/** Users and roles, site settings, the prize pot and the form inbox: Super Admins only. */
export async function requireSuperAdmin() {
  const user = await requireAdmin();
  if (user.role !== 'ADMIN') redirect('/admin?denied=1');
  return user;
}

/**
 * Makes an existing account a Super Admin when its email is in ADMIN_EMAILS, so adding
 * an email there later takes effect right away. These are the site owners: they can't be
 * demoted or deleted from the admin portal.
 */
export async function applyBootstrapAdmin<U extends { id: string; email: string; role: 'USER' | 'EDITOR' | 'ADMIN' }>(user: U): Promise<U> {
  if (user.role === 'ADMIN' || !isBootstrapAdmin(user.email)) return user;
  await db.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  return { ...user, role: 'ADMIN' };
}

export function isBootstrapAdmin(email: string) {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
