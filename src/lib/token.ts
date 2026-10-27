import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'pl_session';
export const SESSION_DAYS = 30;

export type Session = { userId: string; role: 'USER' | 'ADMIN' };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set to at least 32 characters');
  return new TextEncoder().encode(s);
}

export function signSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== 'string') return null;
    return { userId: payload.userId, role: payload.role === 'ADMIN' ? 'ADMIN' : 'USER' };
  } catch {
    return null;
  }
}
