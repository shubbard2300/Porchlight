import { createHash, randomBytes } from 'node:crypto';
import type { TokenPurpose, User } from '@prisma/client';
import { db } from './db';
import { appUrl } from './email';

/** Minutes each kind of emailed link stays valid. */
export const TOKEN_TTL_MIN: Record<TokenPurpose, number> = { VERIFY: 24 * 60, LOGIN: 30 };
/** Don't send another link to the same person within this many seconds. */
export const RESEND_COOLDOWN_SEC = 60;

export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex');
export const linkFor = (raw: string) => appUrl(`/auth/verify?token=${encodeURIComponent(raw)}`);

export async function issueToken(userId: string, purpose: TokenPurpose, next?: string | null) {
  const raw = newToken();
  await db.emailToken.create({
    data: { userId, purpose, next: next ?? null, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + TOKEN_TTL_MIN[purpose] * 60_000) },
  });
  return raw;
}

export async function sentRecently(userId: string) {
  return Boolean(await db.emailToken.findFirst({ where: { userId, createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_SEC * 1000) } } }));
}

/** Marks a link as used and returns it with its user, or null if it is unknown, expired or already used. */
export async function consumeToken(raw: string): Promise<(Awaited<ReturnType<typeof findToken>> & { user: User }) | null> {
  const t = await findToken(raw);
  if (!t || t.usedAt || t.expiresAt < new Date()) return null;
  const { count } = await db.emailToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
  return count === 1 ? t : null;
}

function findToken(raw: string) {
  return db.emailToken.findUnique({ where: { tokenHash: hashToken(raw) }, include: { user: true } });
}
